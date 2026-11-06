import { readFileSync } from "node:fs";
import { checkApproval, compareVersions, packetDigest, sha256 } from "./model.mjs";
import type { Packet, State, Store, MozillaVersion, Notes, ChromeStatus } from "./model.mjs";
import { StoreHttpError } from "./stores.mjs";
import type { ChromeApi, MozillaApi } from "./stores.mjs";

export interface Services {
  chrome: ChromeApi;
  mozilla: MozillaApi;
}
export function verifyArtifacts(packet: Packet): void {
  for (const artifact of Object.values(packet.artifacts)) {
    const bytes = readFileSync(artifact.path);
    if (bytes.length !== artifact.size || sha256(bytes) !== artifact.sha256) {
      throw new Error("Release artifact changed. Rebuild the packet and obtain approval again.");
    }
  }
}
const sameNotes = (a: Notes | null | undefined, b: Notes | null | undefined) => {
  const left = a ?? {};
  const right = b ?? {};
  return (
    Object.keys(left).toSorted().join(",") === Object.keys(right).toSorted().join(",") &&
    Object.keys(left).every((key) => left[key] === right[key])
  );
};
const submittedStates = new Set(["PENDING_REVIEW", "PUBLISHED", "PUBLISHED_TO_TESTERS", "STAGED"]);

export class ReleaseEngine {
  readonly packet: Packet;
  readonly state: State;
  readonly services: Services;
  readonly save: () => void;
  readonly pause: () => Promise<void>;
  readonly attempts: number;
  constructor(
    packet: Packet,
    state: State,
    services: Services,
    save: () => void,
    pause: () => Promise<void> = async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      });
    },
    attempts = 10,
  ) {
    this.packet = packet;
    this.state = state;
    this.services = services;
    this.save = save;
    this.pause = pause;
    this.attempts = attempts;
  }

  async mutation<T>(
    store: Store,
    operation: "upload" | "submit",
    perform: () => Promise<T>,
    accept: (value: T) => void,
  ): Promise<void> {
    const state = this.state[store];
    if (state.inFlight !== undefined) {
      throw new Error(
        `${store} has an unresolved ${state.inFlight.operation}. Inspect remote state before repeating it.`,
      );
    }
    state.inFlight = { operation, startedAt: new Date().toISOString() };
    this.save();
    try {
      const value = await perform();
      accept(value);
      Reflect.deleteProperty(state, "inFlight");
      this.save();
    } catch (error) {
      if (
        error instanceof StoreHttpError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408
      ) {
        Reflect.deleteProperty(state, "inFlight");
      }
      this.save();
      throw error;
    }
  }

  async chromeBaseline(): Promise<ChromeStatus> {
    const remote = await this.services.chrome.status();
    if (remote.published.includes(this.packet.version)) {
      if (this.state.chrome.submitted !== true) {
        throw new Error(
          "This Chrome version is already published outside this packet; inspect it instead of overwriting it.",
        );
      }
      return remote;
    }
    if (compareVersions(this.packet.version, this.packet.baselines.chrome.version) <= 0) {
      throw new Error("The Chrome package version must increase from its published baseline.");
    }
    if (
      remote.published.length !== 1 ||
      remote.published[0] !== this.packet.baselines.chrome.version
    ) {
      throw new Error("Chrome published baseline changed; prepare and review a new packet.");
    }
    if (remote.submitted.length > 0 && submittedStates.has(remote.state)) {
      const ours =
        remote.submitted.every((version) => version === this.packet.version) &&
        (this.state.chrome.submitted === true ||
          this.state.chrome.inFlight?.operation === "submit");
      if (!ours) {
        throw new Error("Chrome has an existing submission; it will not be replaced.");
      }
    }
    return remote;
  }

  async mozillaBaseline(): Promise<void> {
    const addon = await this.services.mozilla.addon();
    const version = addon.current_version?.version;
    if (version === this.packet.version && this.state.mozilla.submitted === true) {
      return;
    }
    if (version !== this.packet.baselines.mozilla.version) {
      throw new Error("Mozilla published baseline changed; prepare and review a new packet.");
    }
  }

  async reconcileChrome(): Promise<void> {
    const state = this.state.chrome;
    if (state.inFlight === undefined) {
      return;
    }
    if (state.inFlight.operation === "upload") {
      const remote = await this.chromeBaseline();
      if (remote.uploadState === "IN_PROGRESS") {
        state.remoteState = "AWAITING_VALIDATION";
        this.save();
        return;
      }
      Reflect.deleteProperty(state, "inFlight");
      state.uploadAccepted = false;
      state.uploaded = false;
      this.save();
      return;
    }
    const remote = await this.services.chrome.status();
    if (
      remote.published.includes(this.packet.version) ||
      (remote.submitted.includes(this.packet.version) && submittedStates.has(remote.state))
    ) {
      state.submitted = true;
      state.remoteState = remote.published.includes(this.packet.version)
        ? "PUBLISHED"
        : remote.state;
      Reflect.deleteProperty(state, "inFlight");
      this.save();
    } else {
      throw new Error(
        "Chrome submission acceptance is uncertain; it will not be submitted again automatically.",
      );
    }
  }

  async reconcileMozilla(): Promise<void> {
    const state = this.state.mozilla;
    if (state.inFlight === undefined) {
      return;
    }
    if (state.inFlight.operation === "upload") {
      await this.mozillaBaseline();
      Reflect.deleteProperty(state, "inFlight");
      this.save();
      return;
    }
    if (state.uploadId === undefined) {
      throw new Error("Cannot reconcile a submitted Mozilla version without its upload UUID.");
    }
    const upload = await this.services.mozilla.uploadStatus(state.uploadId);
    const version = await this.services.mozilla.version(this.packet.version);
    if (!upload.submitted || version === undefined || version.channel !== "listed") {
      throw new Error(
        "Mozilla submission acceptance is uncertain; it will not be submitted again automatically.",
      );
    }
    state.versionId = version.id;
    state.initialNotes = version.release_notes;
    state.submitted = true;
    Reflect.deleteProperty(state, "inFlight");
    this.save();
  }

  async restageChrome(): Promise<void> {
    verifyArtifacts(this.packet);
    if (
      this.state.chrome.submitted === true ||
      this.state.chrome.inFlight?.operation === "submit"
    ) {
      throw new Error("Do not replace an accepted or uncertain Chrome submission.");
    }
    const remote = await this.chromeBaseline();
    if (remote.uploadState === "IN_PROGRESS") {
      throw new Error("Wait for the current draft upload to finish before restaging.");
    }
    this.state.chrome = {};
    this.save();
  }

  async stageChrome(): Promise<void> {
    await this.reconcileChrome();
    const state = this.state.chrome;
    if (state.inFlight?.operation === "upload") {
      return;
    }
    if (state.submitted === true) {
      return;
    }
    await this.chromeBaseline();
    if (state.uploadAccepted !== true) {
      await this.mutation(
        "chrome",
        "upload",
        async () => await this.services.chrome.upload(this.packet.artifacts.chrome),
        (result) => {
          if (result.crxVersion !== undefined && result.crxVersion !== this.packet.version) {
            throw new Error("Chrome acknowledged a different package version.");
          }
          if (!["IN_PROGRESS", "SUCCEEDED"].includes(result.uploadState)) {
            throw new Error("Chrome rejected the package upload.");
          }
          state.uploadAccepted = true;
          state.uploaded = result.uploadState === "SUCCEEDED";
        },
      );
    }
    for (let attempt = 0; state.uploaded !== true && attempt < this.attempts; attempt++) {
      // eslint-disable-next-line no-await-in-loop -- Poll the acknowledged upload, never re-upload it.
      const remote = await this.services.chrome.status();
      if (remote.uploadState === "FAILED") {
        throw new Error("Chrome package validation failed.");
      }
      state.uploaded = remote.uploadState === "SUCCEEDED";
      state.remoteState = state.uploaded ? "UPLOADED" : "AWAITING_VALIDATION";
      this.save();

      if (!state.uploaded) {
        // eslint-disable-next-line no-await-in-loop -- Poll the acknowledged upload without re-uploading.
        await this.pause();
      }
    }
  }

  async stageMozilla(): Promise<void> {
    await this.reconcileMozilla();
    const state = this.state.mozilla;
    if (state.submitted === true) {
      return;
    }
    await this.mozillaBaseline();
    const versions = await this.services.mozilla.versions();
    if (versions.some((version) => compareVersions(version.version, this.packet.version) >= 0)) {
      throw new Error(
        "Mozilla already has this or a newer version in a listed/unlisted channel; it will not be replaced.",
      );
    }
    if (state.uploadId === undefined) {
      await this.mutation(
        "mozilla",
        "upload",
        async () => await this.services.mozilla.upload(this.packet.artifacts.firefox),
        (result) => {
          if (result.uuid === "" || typeof result.uuid !== "string") {
            throw new Error("Mozilla did not acknowledge an upload UUID.");
          }
          state.uploadId = result.uuid;
        },
      );
    }
    const uuid = state.uploadId;
    if (uuid === undefined) {
      throw new Error("Missing Mozilla upload UUID.");
    }
    for (let attempt = 0; state.uploaded !== true && attempt < this.attempts; attempt++) {
      // eslint-disable-next-line no-await-in-loop -- Poll this exact upload UUID.
      const upload = await this.services.mozilla.uploadStatus(uuid);
      if (
        upload.channel !== "listed" ||
        upload.submitted ||
        (upload.processed && upload.version !== this.packet.version)
      ) {
        throw new Error("Mozilla upload identity, channel, or version changed.");
      }
      state.validation = upload.validation;
      if (upload.processed && !upload.valid) {
        throw new Error("Mozilla package validation failed; inspect the saved validation report.");
      }
      state.uploaded = upload.processed && upload.valid;
      state.remoteState = state.uploaded ? "VALIDATED" : "AWAITING_VALIDATION";
      this.save();

      if (!state.uploaded) {
        // eslint-disable-next-line no-await-in-loop -- Poll the acknowledged upload without re-uploading.
        await this.pause();
      }
    }
  }

  async runChrome(): Promise<void> {
    checkApproval(this.packet, this.state);
    await this.stageChrome();
    const state = this.state.chrome;
    if (state.uploaded !== true && state.submitted !== true) {
      return;
    }
    if (
      state.submitted !== true &&
      this.packet.updateNotes &&
      (state.browserReceipt?.digest !== packetDigest(this.packet) ||
        Date.now() - Date.parse(state.browserReceipt.observedAt) > 5 * 60 * 1000)
    ) {
      state.remoteState = "NEEDS_CHROME_LISTING";
      this.save();
      return;
    }
    if (state.submitted !== true) {
      if (
        state.readyCheck?.digest !== packetDigest(this.packet) ||
        state.readyCheck.version !== this.packet.version ||
        Date.now() - Date.parse(state.readyCheck.observedAt) > 5 * 60 * 1000
      ) {
        state.remoteState = "NEEDS_CHROME_PACKAGE_READY";
        this.save();
        return;
      }
      await this.chromeBaseline();
      await this.mutation(
        "chrome",
        "submit",
        async () => await this.services.chrome.submit(),
        (result) => {
          if (!submittedStates.has(result.state)) {
            throw new Error("Chrome did not confirm submission acceptance.");
          }
          state.submitted = true;
          state.remoteState = result.state;
        },
      );
    }
    const remote = await this.services.chrome.status();
    if (remote.published.includes(this.packet.version)) {
      state.remoteState = "PUBLISHED";
    } else if (remote.submitted.includes(this.packet.version)) {
      state.remoteState = remote.state;
    } else {
      throw new Error(
        "Chrome accepted submission but the requested version is not yet visible in status; inspect before retrying.",
      );
    }
    if (["CANCELLED", "REJECTED"].includes(state.remoteState ?? "")) {
      throw new Error("Chrome submission was rejected or cancelled.");
    }
    this.save();
  }

  assertVersion(version: MozillaVersion): void {
    if (
      version.version !== this.packet.version ||
      version.channel !== "listed" ||
      version.id !== this.state.mozilla.versionId
    ) {
      throw new Error("Mozilla returned a different version or channel.");
    }
  }

  async runMozilla(): Promise<void> {
    checkApproval(this.packet, this.state);
    await this.stageMozilla();
    const state = this.state.mozilla;
    if (state.uploaded !== true && state.submitted !== true) {
      return;
    }
    if (state.submitted !== true) {
      await this.mozillaBaseline();
      const uuid = state.uploadId;
      if (uuid === undefined) {
        throw new Error("Missing Mozilla upload UUID.");
      }
      const upload = await this.services.mozilla.uploadStatus(uuid);
      if (
        !upload.processed ||
        !upload.valid ||
        upload.submitted ||
        upload.version !== this.packet.version ||
        upload.channel !== "listed"
      ) {
        throw new Error("Mozilla upload no longer eligible for submission.");
      }
      await this.mutation(
        "mozilla",
        "submit",
        async () => await this.services.mozilla.submit(uuid, this.packet.artifacts.source),
        (version) => {
          if (version.version !== this.packet.version || version.channel !== "listed") {
            throw new Error("Mozilla created the wrong version/channel.");
          }
          state.versionId = version.id;
          state.initialNotes = version.release_notes;
          state.submitted = true;
        },
      );
    }
    let version = await this.services.mozilla.version(this.packet.version);
    if (version === undefined) {
      throw new Error("Mozilla has not exposed the accepted version yet; resume status later.");
    }
    this.assertVersion(version);
    const notes = this.packet.plan?.mozilla;
    if (notes !== undefined && !sameNotes(version.release_notes, notes)) {
      if (!sameNotes(version.release_notes, state.initialNotes)) {
        throw new Error("Mozilla notes changed outside this packet; do not overwrite them.");
      }
      await this.services.mozilla.notes(version.id, notes);
      version = await this.services.mozilla.version(this.packet.version);
      if (version === undefined) {
        throw new Error("Mozilla version disappeared after updating notes.");
      }
      this.assertVersion(version);
      if (!sameNotes(version.release_notes, notes)) {
        throw new Error("Mozilla did not retain the approved release notes.");
      }
    }
    state.notesVerified = notes === undefined || sameNotes(version.release_notes, notes);
    if (state.sourceVerified !== true) {
      const hash = await this.services.mozilla.sourceHash(version);
      if (hash !== this.packet.artifacts.source.sha256) {
        throw new Error("Mozilla source archive is missing or differs from the approved ZIP.");
      }
      state.sourceVerified = true;
    }
    state.remoteState =
      String(version.file.status) === "public" || version.file.status === 4
        ? "PUBLISHED"
        : `SUBMITTED (${version.file.status})`;
    this.save();
  }

  async execute(mode: "stage" | "run"): Promise<Readonly<State>> {
    verifyArtifacts(this.packet);
    if (mode === "run") {
      checkApproval(this.packet, this.state);
    }
    const results = await Promise.allSettled(
      mode === "stage"
        ? [this.stageChrome(), this.stageMozilla()]
        : [this.runChrome(), this.runMozilla()],
    );
    for (const [index, store] of (["chrome", "mozilla"] as const).entries()) {
      const result = results[index];
      if (result.status === "rejected") {
        this.state[store].error =
          result.reason instanceof Error
            ? result.reason.message
            : "Store operation failed; inspect its saved state.";
      } else {
        Reflect.deleteProperty(this.state[store], "error");
      }
    }
    this.save();
    return this.state;
  }
}

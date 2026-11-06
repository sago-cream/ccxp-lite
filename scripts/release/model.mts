import { createHash } from "node:crypto";

export const chromeLocales = ["en", "zh-TW"] as const;
export type ChromeLocale = (typeof chromeLocales)[number];
export type Descriptions = Record<ChromeLocale, string>;
export type Notes = Record<string, string>;
export type Store = "chrome" | "mozilla";
export interface Artifact {
  path: string;
  sha256: string;
  size: number;
}
export interface Baseline {
  version: string;
  ref: string;
  commit: string;
  url: string;
}
export interface ChromeStatus {
  published: string[];
  submitted: string[];
  state: string;
  uploadState: string;
}
export interface MozillaVersion {
  id: number;
  version: string;
  channel: string;
  release_notes: Notes | null;
  source?: string | null;
  file: { status: string | number; hash?: string };
}
export interface Snapshot {
  extensionId: string;
  urls: Descriptions;
  observedAt: string;
  descriptions: Descriptions;
}
export interface DraftNotes {
  chrome: Descriptions;
  mozilla: Notes;
}
export interface Plan {
  chrome?: { before: Descriptions; after: Descriptions };
  mozilla?: Notes;
}
export interface Packet {
  schema: 1;
  version: string;
  commit: string;
  previousGithub: string;
  updateNotes: boolean;
  targets: { publisherId: string; extensionId: string; addonId: string; addonGuid: string };
  artifacts: { chrome: Artifact; firefox: Artifact; source: Artifact };
  baselines: { github: Baseline; chrome: Baseline; mozilla: Baseline };
  noteBaselines?: { chrome?: Record<ChromeLocale, Baseline>; mozilla: Baseline };
  mozillaLocales: string[];
  createdAt: string;
  plan?: Plan;
}
export interface InFlight {
  operation: "upload" | "submit";
  startedAt: string;
}
export interface StoreState {
  handoffDigest?: string;
  inFlight?: InFlight;
  uploaded?: boolean;
  uploadAccepted?: boolean;
  uploadId?: string;
  versionId?: number;
  initialNotes?: Notes | null;
  submitted?: boolean;
  notesVerified?: boolean;
  sourceVerified?: boolean;
  validation?: unknown;
  remoteState?: string;
  error?: string;
}
export interface State {
  schema: 1;
  approval?: { digest: string; approvedAt: string };
  chrome: StoreState;
  mozilla: StoreState;
}
export const emptyState = (): State => ({ schema: 1, chrome: {}, mozilla: {} });
export const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

export function versionParts(value: string): [number, number, number] {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(value)) {
    throw new Error("Use a stable three-part release version.");
  }
  const parts = value.split(".").map(Number);
  if (parts.some((part) => part > 65_535)) {
    throw new Error("Extension version components exceed 65535.");
  }
  return parts as [number, number, number];
}
export function compareVersions(a: string, b: string): number {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}
export function changesStoreNotes(previous: string, next: string): boolean {
  const a = versionParts(previous);
  const b = versionParts(next);
  if (compareVersions(next, previous) <= 0) {
    throw new Error("Release version must increase.");
  }
  return a[0] !== b[0] || a[1] !== b[1];
}
export function oneLine(value: string): string {
  if (value.trim() === "" || /[\r\n\p{Cc}]/u.test(value)) {
    throw new Error("Store summaries must be nonempty single lines.");
  }
  if (value !== value.trim()) {
    throw new Error("Remove surrounding whitespace from store summaries.");
  }
  return value;
}
export const normalizeText = (text: string): string => text.replaceAll("\r\n", "\n");

export function descriptionVersion(text: string): string {
  const match = /^v(\d+\.\d+\.\d+)(?:\uFF1A|:)\s*.+$/u.exec(normalizeText(text).split("\n")[0]);
  if (match === null) {
    throw new Error("Unrecognized Chrome headline version.");
  }
  versionParts(match[1]);
  return match[1];
}
export function rotateDescription(
  before: string,
  locale: ChromeLocale,
  version: string,
  summary: string,
): string {
  versionParts(version);
  oneLine(summary);
  const newline = before.includes("\r\n") ? "\r\n" : "\n";
  const lines = normalizeText(before).split("\n");
  const headline = `v${version}${locale === "en" ? ": " : "\uFF1A"}${summary}`;
  const first = /^v(\d+\.\d+\.\d+)(?:\uFF1A|:)\s*.+$/u.exec(lines[0]);
  if (first === null) {
    throw new Error(`Unrecognized ${locale} description headline; inspect the published listing.`);
  }
  const marker = locale === "en" ? "release note:" : "\u7248\u672C\u7D00\u9304\uFF1A";
  const history = lines.indexOf(marker);
  if (history < 1 || lines.filter((line) => line === marker).length !== 1) {
    throw new Error(`Unrecognized ${locale} history section.`);
  }
  if (first[1] === version) {
    if (lines[0] !== headline) {
      throw new Error("This version already has different wording; review the changed listing.");
    }
    return before;
  }
  if (compareVersions(version, first[1]) <= 0) {
    throw new Error("Do not move a description backwards.");
  }
  if (
    lines.some((line) =>
      new RegExp(`^v${version.replaceAll(".", String.raw`\.`)}(?:\uFF1A|:)`, "u").test(line),
    )
  ) {
    throw new Error("The new version already exists in listing history.");
  }
  const prior = lines[0];
  const priorVersion = new RegExp(`^v${first[1].replaceAll(".", String.raw`\.`)}(?:\uFF1A|:)`, "u");
  const duplicates = lines.slice(history + 1).filter((line) => priorVersion.test(line));
  if (duplicates.some((line) => line !== prior) || duplicates.length > 1) {
    throw new Error("Conflicting previous-version history.");
  }
  lines[0] = headline;
  if (duplicates.length === 1) {
    const existing = lines.indexOf(prior, history + 1);
    lines.splice(existing, 1);
  }
  lines.splice(history + 1, 0, prior);
  const after = lines.join(newline);
  if (after.length > 16_000) {
    throw new Error("Chrome description exceeds its 16000-character limit.");
  }
  return after;
}
function canonical(value: unknown): string {
  // eslint-disable-next-line complete/prefer-is-array -- Native guard for decoded JSON.
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .toSorted()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  if (value === undefined) {
    return "null";
  }
  return JSON.stringify(value);
}
export function packetDigest(packet: Packet): string {
  return sha256(canonical(packet));
}
export function checkApproval(packet: Packet, state: State): void {
  if (packet.plan === undefined || state.approval?.digest !== packetDigest(packet)) {
    throw new Error(
      "Review and approve the exact current packet before submission or metadata changes.",
    );
  }
}
export function validateSnapshot(packet: Packet, snapshot: Snapshot): void {
  if (
    snapshot.extensionId !== packet.targets.extensionId ||
    !Number.isFinite(Date.parse(snapshot.observedAt)) ||
    Date.parse(snapshot.observedAt) > Date.now() + 60_000
  ) {
    throw new Error("Chrome observation has the wrong target or timestamp.");
  }
  for (const locale of chromeLocales) {
    const url = new URL(snapshot.urls[locale]);
    if (
      url.origin !== "https://chromewebstore.google.com" ||
      url.pathname.split("/").at(-1) !== packet.targets.extensionId ||
      url.searchParams.get("hl") !== locale ||
      typeof snapshot.descriptions[locale] !== "string"
    ) {
      throw new TypeError(`Missing published ${locale} description or incorrect listing URL.`);
    }
  }
}
export function makePlan(packet: Packet, notes?: DraftNotes, snapshot?: Snapshot): Plan {
  if (!packet.updateNotes) {
    if (
      notes !== undefined &&
      (Object.values(notes.chrome).some((text) => text !== "") ||
        Object.values(notes.mozilla).some((text) => text !== ""))
    ) {
      throw new Error("Patch releases leave all public store notes unchanged.");
    }
    return {};
  }
  if (notes === undefined || snapshot === undefined) {
    throw new Error(
      "Non-patch releases need both Chrome locale observations and drafted store notes.",
    );
  }
  validateSnapshot(packet, snapshot);
  if (Date.parse(snapshot.observedAt) < Date.parse(packet.createdAt)) {
    throw new Error("Capture the Chrome listing after preparing this packet.");
  }
  if (
    Object.keys(notes.mozilla).toSorted().join(",") !==
    [...packet.mozillaLocales].toSorted().join(",")
  ) {
    throw new Error("Draft one Mozilla line for every configured release-note locale.");
  }
  const after = { ...snapshot.descriptions };
  for (const locale of chromeLocales) {
    after[locale] = rotateDescription(
      snapshot.descriptions[locale],
      locale,
      packet.version,
      notes.chrome[locale],
    );
  }
  for (const line of Object.values(notes.mozilla)) {
    oneLine(line);
  }
  return { chrome: { before: snapshot.descriptions, after }, mozilla: notes.mozilla };
}

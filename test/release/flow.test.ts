/* eslint-disable complete/require-ascii -- Bilingual fixtures preserve the live listing punctuation. */
/* eslint-disable @typescript-eslint/require-await -- Store mocks implement asynchronous interfaces. */
/* eslint-disable unicorn/no-null -- Exercise the store API's nullable release_notes field. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReleaseEngine } from "../../scripts/release/engine.mjs";
import { artifact } from "../../scripts/release/files.mjs";
import {
  changesStoreNotes,
  emptyState,
  makePlan,
  descriptionVersion,
  packetDigest,
  recordBrowserReceipt,
  recordReadyCheck,
  rotateDescription,
} from "../../scripts/release/model.mjs";
import type {
  Descriptions,
  MozillaVersion,
  Notes,
  Packet,
  Snapshot,
  State,
} from "../../scripts/release/model.mjs";
import type { Services } from "../../scripts/release/engine.mjs";
import { createStores, StoreHttpError } from "../../scripts/release/stores.mjs";

vi.mock(import("../../scripts/setup_release_credentials.mjs"), async (importOriginal) => ({
  ...(await importOriginal()),
  chromeAccessToken: vi.fn(() => "dummy-access-token"),
}));

const descriptions: Descriptions = {
  en: "v1.13.0: old summary\n\nStar it on GitHub if you like it ⭐: \nhttps://github.com/Hsiii/ccxpLite\n\nrelease note:\nv1.12.0: older summary\n",
  "zh-TW":
    "v1.13.0：舊摘要\n\n覺得好用的話，歡迎到 GitHub 點個星星⭐\nhttps://github.com/sago-cream/ccxpLite\n\n版本紀錄：\nv1.12.0：更早摘要\n",
};
const roots: string[] = [];
afterEach(() => {
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});
function fixture(patch = false) {
  const root = mkdtempSync(path.join(tmpdir(), "ccxp-release-test-"));
  roots.push(root);
  const files = Object.fromEntries(
    ["chrome", "firefox", "source"].map((kind) => {
      const file = path.join(root, `${kind}.zip`);
      writeFileSync(file, `${kind} fixture bytes`);
      return [kind, artifact(file)];
    }),
  ) as Packet["artifacts"];
  const version = patch ? "1.13.2" : "1.14.0";
  const from = {
    version: "1.13.0",
    ref: "v1.13.0",
    commit: "a".repeat(40),
    url: "https://github.com/sago-cream/ccxp-lite/releases/tag/v1.13.0",
  };
  const packet: Packet = {
    schema: 1,
    version,
    commit: "b".repeat(40),
    previousGithub: "1.13.1",
    updateNotes: !patch,
    targets: {
      publisherId: "publisher",
      extensionId: "extension",
      addonId: "ccxplite",
      addonGuid: "ccxp-lite@hsiii.dev",
    },
    artifacts: files,
    baselines: { github: from, chrome: from, mozilla: from },
    mozillaLocales: ["en-US", "zh-TW"],
    createdAt: new Date(Date.now() - 2000).toISOString(),
  };
  const snapshot: Snapshot = {
    publisherId: "publisher",
    extensionId: "extension",
    url: "https://chrome.google.com/webstore/devconsole/publisher/extension/edit/listing",
    observedAt: new Date().toISOString(),
    descriptions,
    publishedDescriptions: descriptions,
  };
  packet.plan = patch
    ? {}
    : makePlan(
        packet,
        {
          chrome: { en: "new summary", "zh-TW": "新摘要" },
          mozilla: { "en-US": "New features.", "zh-TW": "新增功能。" },
        },
        snapshot,
      );
  const state = emptyState();
  const backend = {
    chromeSubmitted: false,
    chromeUploaded: false,
    mozillaSubmitted: false,
    notes: null as Notes | null,
    sourceHash: files.source.sha256,
    chromeBaseline: "1.13.0",
    mozillaBaseline: "1.13.0",
  };
  const remoteVersion = (): MozillaVersion => ({
    id: 20,
    version,
    channel: "listed",
    release_notes: backend.notes,
    source: "https://addons.mozilla.org/source/20.zip",
    file: { status: "unreviewed" },
  });
  const services: Services = {
    chrome: {
      status: vi.fn(async () => ({
        published: [backend.chromeBaseline],
        submitted: backend.chromeSubmitted ? [version] : [],
        state: backend.chromeSubmitted ? "PENDING_REVIEW" : "PUBLISHED",
        uploadState: backend.chromeUploaded ? "SUCCEEDED" : "NOT_FOUND",
      })),
      upload: vi.fn(async () => {
        backend.chromeUploaded = true;
        return { itemId: "extension", crxVersion: version, uploadState: "SUCCEEDED" };
      }),
      submit: vi.fn(async () => {
        backend.chromeSubmitted = true;
        return { state: "PENDING_REVIEW" };
      }),
    },
    mozilla: {
      addon: vi.fn(async () => ({
        guid: packet.targets.addonGuid,
        default_locale: "en-US",
        current_version: { ...remoteVersion(), version: backend.mozillaBaseline },
      })),
      versions: vi.fn(async () => [{ ...remoteVersion(), version: "1.13.0" }]),
      version: vi.fn(async () => (backend.mozillaSubmitted ? remoteVersion() : undefined)),
      upload: vi.fn(async () => ({
        uuid: "known-upload",
        processed: true,
        valid: true,
        submitted: false,
        channel: "listed",
        version,
      })),
      uploadStatus: vi.fn(async () => ({
        uuid: "known-upload",
        processed: true,
        valid: true,
        submitted: backend.mozillaSubmitted,
        channel: "listed",
        version,
      })),
      submit: vi.fn(async () => {
        backend.mozillaSubmitted = true;
        return remoteVersion();
      }),
      notes: vi.fn(async (_id: number, notes: Notes) => {
        backend.notes = notes;
        return remoteVersion();
      }),
      sourceHash: vi.fn(async () => backend.sourceHash),
    },
  };
  const journal: string[] = [];
  const engine = () =>
    new ReleaseEngine(
      packet,
      state,
      services,
      () => {
        journal.push(JSON.stringify(state));
      },
      async () => {
        await Promise.resolve();
      },
      2,
    );
  const approve = (ready = true) => {
    state.approval = {
      digest: packetDigest(packet),
      approvedAt: new Date(Date.now() - 500).toISOString(),
    };
    if (ready) {
      state.chrome.readyCheck = {
        digest: packetDigest(packet),
        version: packet.version,
        observedAt: new Date().toISOString(),
      };
    }
  };
  return { packet, state, backend, services, snapshot, journal, engine, approve, remoteVersion };
}

describe("localized note planning", () => {
  it("rotates only the headline/history and preserves each invitation, URL, and older wording", () => {
    const en = rotateDescription(descriptions.en, "en", "1.14.0", "new summary");
    expect(en).toBe(
      descriptions.en
        .replace("v1.13.0: old summary", "v1.14.0: new summary")
        .replace("release note:\n", "release note:\nv1.13.0: old summary\n"),
    );
    const zh = rotateDescription(descriptions["zh-TW"], "zh-TW", "1.14.0", "新摘要");
    expect(zh).toContain("v1.14.0：新摘要\n");
    expect(zh).toContain("版本紀錄：\nv1.13.0：舊摘要\nv1.12.0：更早摘要");
    expect(rotateDescription(en, "en", "1.14.0", "new summary")).toBe(en);
  });
  it("preserves CRLF and rejects changed same-version text, missing landmarks, or multiline summaries", () => {
    expect(
      rotateDescription(descriptions.en.replaceAll("\n", "\r\n"), "en", "1.14.0", "new").replaceAll(
        "\r\n",
        "",
      ),
    ).not.toContain("\n");
    expect(() => rotateDescription(descriptions.en, "en", "1.13.0", "different")).toThrow(
      /different wording/u,
    );
    expect(() =>
      rotateDescription(
        descriptions.en.replace("release note:", "History:"),
        "en",
        "1.14.0",
        "new",
      ),
    ).toThrow(/history/u);
    expect(() => rotateDescription(descriptions.en, "en", "1.14.0", "two\nlines")).toThrow(
      /single lines/u,
    );
  });
  it("uses the actual GitHub bump to decide the patch policy", () => {
    expect(changesStoreNotes("1.13.0", "1.13.1")).toBe(false);
    expect(changesStoreNotes("1.12.9", "1.13.1")).toBe(true);
    expect(changesStoreNotes("1.13.9", "2.0.0")).toBe(true);
    const f = fixture(true);
    expect(makePlan(f.packet)).toEqual({});
    expect(() => makePlan(f.packet, { chrome: { en: "new", "zh-TW": "" }, mozilla: {} })).toThrow(
      /unchanged/u,
    );
  });
  it("uses the published headline even when the unsubmitted draft already has different new wording", () => {
    const f = fixture();
    const observation = {
      ...f.snapshot,
      descriptions: {
        ...descriptions,
        en: descriptions.en.replace("v1.13.0: old summary", "v1.14.0: abandoned draft"),
      },
      publishedDescriptions: descriptions,
    };
    const plan = makePlan(
      f.packet,
      {
        chrome: { en: "Approved new wording", "zh-TW": "新摘要" },
        mozilla: { "en-US": "New", "zh-TW": "新" },
      },
      observation,
    );
    expect(descriptionVersion(observation.publishedDescriptions.en)).toBe("1.13.0");
    expect(plan.chrome?.before.en).toContain("abandoned draft");
    expect(plan.chrome?.after.en).toContain("v1.14.0: Approved new wording");
    expect(plan.chrome?.after.en).toContain("release note:\nv1.13.0: old summary");
  });
  it("requires all Mozilla locales and the exact observed target", () => {
    const f = fixture();
    expect(() =>
      makePlan(
        f.packet,
        { chrome: { en: "New", "zh-TW": "新" }, mozilla: { "en-US": "New" } },
        f.snapshot,
      ),
    ).toThrow(/every configured/u);
    expect(() =>
      makePlan(
        f.packet,
        { chrome: { en: "New", "zh-TW": "新" }, mozilla: { "en-US": "New", "zh-TW": "新" } },
        { ...f.snapshot, publisherId: "other" },
      ),
    ).toThrow(/wrong target/u);
  });
  it("requires the online descriptions rather than assuming the dashboard draft is published", () => {
    const f = fixture();
    const observation = { ...f.snapshot };
    Reflect.deleteProperty(observation, "publishedDescriptions");
    expect(() =>
      makePlan(
        f.packet,
        { chrome: { en: "New", "zh-TW": "新" }, mozilla: { "en-US": "New", "zh-TW": "新" } },
        observation,
      ),
    ).toThrow(/published Chrome descriptions/u);
  });
});

describe("approval and both-store execution", () => {
  it("replaces an unsubmitted draft without a manual preflight", async () => {
    const f = fixture(true);
    f.approve();
    f.backend.chromeUploaded = true;
    await f.engine().execute("run");
    expect(f.services.chrome.upload).toHaveBeenCalledTimes(1);
    expect(f.state.chrome.submitted).toBe(true);
  });
  it("prepares upload validation without publishing, then blocks all writes until approved", async () => {
    const f = fixture(true);
    await expect(f.engine().execute("run")).rejects.toThrow(/approve/u);
    expect(f.services.chrome.upload).not.toHaveBeenCalled();
    await f.engine().execute("stage");
    expect(f.state.chrome.uploaded).toBe(true);
    expect(f.state.mozilla.uploaded).toBe(true);
    expect(f.services.chrome.submit).not.toHaveBeenCalled();
    expect(f.services.mozilla.submit).not.toHaveBeenCalled();
    expect(f.services.mozilla.notes).not.toHaveBeenCalled();
  });
  it("submits patch packages to both stores without touching any public note", async () => {
    const f = fixture(true);
    f.approve(false);
    await f.engine().execute("run");
    expect(f.state.chrome.remoteState).toBe("NEEDS_CHROME_PACKAGE_READY");
    expect(f.services.chrome.submit).not.toHaveBeenCalled();
    recordReadyCheck(f.packet, f.state, {
      publisherId: "publisher",
      extensionId: "extension",
      url: "https://chrome.google.com/webstore/devconsole/publisher/extension/edit/package",
      observedAt: new Date().toISOString(),
      packageVersion: f.packet.version,
      hasUnsubmittedChanges: true,
      state: "DRAFT",
    });
    await f.engine().execute("run");
    expect(f.state.chrome.submitted).toBe(true);
    expect(f.state.mozilla.submitted).toBe(true);
    expect(f.state.mozilla.sourceVerified).toBe(true);
    expect(f.services.mozilla.notes).not.toHaveBeenCalled();
    await f.engine().execute("run");
    expect(f.services.chrome.upload).toHaveBeenCalledTimes(1);
    expect(f.services.mozilla.submit).toHaveBeenCalledTimes(1);
    expect(f.services.chrome.submit).toHaveBeenCalledTimes(1);
  });
  it("finishes Mozilla while Chrome waits for an approved browser observation", async () => {
    const f = fixture();
    f.approve();
    await f.engine().execute("run");
    expect(f.state.chrome.remoteState).toBe("NEEDS_CHROME_LISTING");
    expect(f.services.chrome.submit).not.toHaveBeenCalled();
    expect(f.state.mozilla.submitted).toBe(true);
    expect(f.backend.notes).toEqual(f.packet.plan?.mozilla);
    f.state.chrome.browserCheck = {
      digest: packetDigest(f.packet),
      observedAt: new Date().toISOString(),
    };
    const after = {
      ...f.snapshot,
      observedAt: new Date().toISOString(),
      descriptions: f.packet.plan?.chrome?.after ?? descriptions,
    };
    recordBrowserReceipt(f.packet, f.state, after);
    await f.engine().execute("run");
    expect(f.state.chrome.submitted).toBe(true);
    expect(f.services.mozilla.submit).toHaveBeenCalledTimes(1);
    expect(f.services.mozilla.notes).toHaveBeenCalledTimes(1);
  });
  it("invalidates approval after a text or package edit", async () => {
    const f = fixture(true);
    f.approve();
    f.packet.targets.addonId = "other";
    await expect(f.engine().execute("run")).rejects.toThrow(/approve/u);
    f.approve();
    writeFileSync(f.packet.artifacts.chrome.path, "changed bytes");
    await expect(f.engine().execute("run")).rejects.toThrow(/artifact changed/u);
    expect(f.services.chrome.upload).not.toHaveBeenCalled();
  });
  it("rejects baseline drift and conflicting existing submissions without uploading over them", async () => {
    const f = fixture(true);
    f.approve();
    f.backend.chromeBaseline = "1.13.1";
    await f.engine().execute("run");
    expect(f.state.chrome.error).toMatch(/baseline changed/u);
    expect(f.services.chrome.upload).not.toHaveBeenCalled();
    expect(f.state.mozilla.submitted).toBe(true);
  });
  it("leaves another Chrome version under review untouched", async () => {
    const f = fixture(true);
    f.approve();
    vi.mocked(f.services.chrome.status).mockResolvedValue({
      published: ["1.13.0"],
      submitted: ["1.13.1"],
      state: "PENDING_REVIEW",
      uploadState: "SUCCEEDED",
    });
    await f.engine().execute("run");
    expect(f.state.chrome.error).toMatch(/existing submission/u);
    expect(f.services.chrome.upload).not.toHaveBeenCalled();
    expect(f.services.chrome.submit).not.toHaveBeenCalled();
  });
  it("rejects Chrome downgrades before uploading", async () => {
    const f = fixture(true);
    f.backend.chromeBaseline = "1.14.0";
    f.packet.baselines.chrome = { ...f.packet.baselines.chrome, version: "1.14.0" };
    f.approve();
    await f.engine().execute("run");
    expect(f.state.chrome.error).toMatch(/must increase/u);
    expect(f.services.chrome.upload).not.toHaveBeenCalled();
  });
  it("retries a reversible draft upload with the same artifact after a lost response", async () => {
    const f = fixture(true);
    f.approve();
    const upload = vi.mocked(f.services.chrome.upload);
    upload.mockRejectedValueOnce(new Error("response lost"));
    await f.engine().execute("run");
    expect(f.state.chrome.inFlight?.operation).toBe("upload");
    expect(
      f.journal.some(
        (entry) => (JSON.parse(entry) as State).chrome.inFlight?.operation === "upload",
      ),
    ).toBe(true);
    await f.engine().execute("run");
    expect(f.services.chrome.upload).toHaveBeenCalledTimes(2);
    expect(f.services.chrome.upload).toHaveBeenLastCalledWith(f.packet.artifacts.chrome);
    expect(f.state.chrome.error).toBeUndefined();
    expect(f.services.mozilla.submit).toHaveBeenCalledTimes(1);
  });
  it("reconciles accepted submissions after lost responses without submitting again", async () => {
    const f = fixture(true);
    f.approve();
    vi.mocked(f.services.chrome.submit).mockImplementation(async () => {
      f.backend.chromeSubmitted = true;
      throw new Error("response lost");
    });
    vi.mocked(f.services.mozilla.submit).mockImplementation(async () => {
      f.backend.mozillaSubmitted = true;
      throw new Error("response lost");
    });
    await f.engine().execute("run");
    expect(f.state.chrome.inFlight?.operation).toBe("submit");
    expect(f.state.mozilla.inFlight?.operation).toBe("submit");
    await f.engine().execute("run");
    expect(f.services.chrome.submit).toHaveBeenCalledTimes(1);
    expect(f.services.mozilla.submit).toHaveBeenCalledTimes(1);
    expect(f.state.chrome.error).toBeUndefined();
    expect(f.state.mozilla.error).toBeUndefined();
    expect(f.state.mozilla.sourceVerified).toBe(true);
  });
  it("resumes an idempotent note update after a response is lost", async () => {
    const f = fixture();
    f.approve();
    vi.mocked(f.services.mozilla.notes).mockImplementation(async (_id, notes) => {
      f.backend.notes = notes;
      throw new Error("response lost");
    });
    await f.engine().execute("run");
    await f.engine().execute("run");
    expect(f.services.mozilla.notes).toHaveBeenCalledTimes(1);
    expect(f.state.mozilla.notesVerified).toBe(true);
    expect(f.state.mozilla.error).toBeUndefined();
  });
  it("does not repeat completed Chrome browser work while retrying Mozilla later", async () => {
    const f = fixture();
    await f.engine().execute("stage");
    f.approve();
    f.state.chrome.browserCheck = {
      digest: packetDigest(f.packet),
      observedAt: new Date().toISOString(),
    };
    recordBrowserReceipt(f.packet, f.state, {
      ...f.snapshot,
      observedAt: new Date().toISOString(),
      descriptions: f.packet.plan?.chrome?.after ?? descriptions,
    });
    f.backend.sourceHash = "wrong";
    await f.engine().execute("run");
    expect(f.state.chrome.submitted).toBe(true);
    f.backend.sourceHash = f.packet.artifacts.source.sha256;
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60 * 60 * 1000);
    await f.engine().execute("run");
    expect(f.state.chrome.remoteState).toBe("PENDING_REVIEW");
    expect(f.state.mozilla.sourceVerified).toBe(true);
    expect(f.services.chrome.submit).toHaveBeenCalledTimes(1);
  });
  it("restages an unsubmitted Chrome draft without resetting the other store or approval", async () => {
    const f = fixture(true);
    f.approve(false);
    await f.engine().execute("run");
    const { approval } = f.state;
    await f.engine().restageChrome();
    expect(f.state.chrome).toEqual({});
    expect(f.state.mozilla.submitted).toBe(true);
    expect(f.state.approval).toBe(approval);
    await f.engine().execute("run");
    expect(f.services.chrome.upload).toHaveBeenCalledTimes(2);
    expect(f.services.mozilla.submit).toHaveBeenCalledTimes(1);
  });
  it("does not report success when the source archive differs", async () => {
    const f = fixture(true);
    f.approve();
    f.backend.sourceHash = "wrong";
    await f.engine().execute("run");
    expect(f.state.mozilla.error).toMatch(/source archive/u);
    expect(f.state.mozilla.sourceVerified).not.toBe(true);
  });
});

describe("store HTTP contracts", () => {
  it("uses listed upload, multipart version+source, separate localized notes, and fresh JWTs", async () => {
    const f = fixture(true);
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const responseVersion = f.remoteVersion();
    const fakeFetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push({ url, init });
      if (url.includes("/addons/upload/")) {
        return Response.json({
          uuid: "uuid",
          processed: true,
          valid: true,
          channel: "listed",
          version: f.packet.version,
        });
      }
      if (url.includes("/source/")) {
        return new Response(readFileSync(f.packet.artifacts.source.path));
      }
      return Response.json(responseVersion);
    });
    const api = createStores(
      f.packet.targets,
      { AMO_JWT_ISSUER: "user:1:2", AMO_JWT_SECRET: "dummy-secret" },
      fakeFetch,
    );
    await api.mozilla.upload(f.packet.artifacts.firefox);
    await api.mozilla.submit("uuid", f.packet.artifacts.source);
    await api.mozilla.notes(20, { "en-US": "Approved line" });
    expect((calls[0].init.body as FormData).get("channel")).toBe("listed");
    const form = calls[1].init.body as FormData;
    expect(form.get("upload")).toBe("uuid");
    expect(form.get("source")).toBeInstanceOf(Blob);
    expect(JSON.parse(calls[2].init.body as string)).toEqual({
      release_notes: { "en-US": "Approved line" },
    });
    const tokens = calls.map((call) => new Headers(call.init.headers).get("Authorization"));
    expect(new Set(tokens).size).toBe(3);
    expect(await api.mozilla.sourceHash(responseVersion)).toBe(f.packet.artifacts.source.sha256);
  });
  it("uses Chrome v2 raw ZIP upload and normal review while preserving rollout settings", async () => {
    const f = fixture(true);
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fakeFetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push({ url, init });
      if (url.endsWith(":upload")) {
        return Response.json({
          itemId: "extension",
          crxVersion: f.packet.version,
          uploadState: "SUCCEEDED",
        });
      }
      return Response.json({ state: "PENDING_REVIEW" });
    });
    const api = createStores(
      f.packet.targets,
      {
        CWS_SERVICE_ACCOUNT_EMAIL: "release@example.iam.gserviceaccount.com",
        CWS_GCLOUD_ACCOUNT: "owner@example.com",
      },
      fakeFetch,
    );
    await api.chrome.upload(f.packet.artifacts.chrome);
    await api.chrome.submit();
    expect(calls[0].url).toBe(
      "https://chromewebstore.googleapis.com/upload/v2/publishers/publisher/items/extension:upload",
    );
    expect(calls[0].init.body).toBeInstanceOf(Blob);
    expect(new Headers(calls[0].init.headers).get("Content-Type")).toBe("application/zip");
    expect(JSON.parse(calls[1].init.body as string)).toEqual({
      publishType: "DEFAULT_PUBLISH",
      skipReview: false,
      blockOnWarnings: true,
    });
    expect(calls[1].url).toBe(
      "https://chromewebstore.googleapis.com/v2/publishers/publisher/items/extension:publish",
    );
  });
  it("keeps API error bodies containing credentials out of errors", async () => {
    const f = fixture(true);
    const api = createStores(
      f.packet.targets,
      { AMO_JWT_ISSUER: "user:1:2", AMO_JWT_SECRET: "dummy-secret" },
      vi.fn(async () => Response.json({ detail: "private-api-key" }, { status: 401 })),
    );
    await expect(api.mozilla.addon()).rejects.toThrow(StoreHttpError);
    await expect(api.mozilla.addon()).rejects.not.toThrow(/private-api-key/u);
  });
});

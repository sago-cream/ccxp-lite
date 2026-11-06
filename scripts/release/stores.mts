import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { chromeAccessToken, requireValue } from "../setup_release_credentials.mjs";
import type { Credentials } from "../setup_release_credentials.mjs";
import { sha256 } from "./model.mjs";
import type { Artifact, ChromeStatus, MozillaVersion, Notes, Packet } from "./model.mjs";

export class StoreHttpError extends Error {
  readonly status: number;
  constructor(status: number, operation: string) {
    super(`${operation} failed with HTTP ${status}; response details were suppressed.`);
    this.name = "StoreHttpError";
    this.status = status;
  }
}
export interface MozillaUpload {
  uuid: string;
  processed: boolean;
  valid: boolean;
  submitted: boolean;
  channel: string;
  version: string;
  validation?: unknown;
}
export interface MozillaAddon {
  guid: string;
  default_locale: string;
  current_version: MozillaVersion | null;
}
interface Revision {
  state?: string;
  distributionChannels?: Array<{ crxVersion: string }>;
}
interface ChromeResponse {
  itemId: string;
  takenDown?: boolean;
  publishedItemRevisionStatus?: Revision;
  submittedItemRevisionStatus?: Revision;
  lastAsyncUploadState?: string;
}
export interface ChromeUpload {
  itemId: string;
  crxVersion?: string;
  uploadState: string;
}
export interface ChromeApi {
  status: () => Promise<ChromeStatus>;
  upload: (artifact: Artifact) => Promise<ChromeUpload>;
  submit: () => Promise<{ state: string }>;
}
export interface MozillaApi {
  addon: () => Promise<MozillaAddon>;
  versions: () => Promise<readonly MozillaVersion[]>;
  version: (version: string) => Promise<MozillaVersion | undefined>;
  upload: (artifact: Artifact) => Promise<MozillaUpload>;
  uploadStatus: (uuid: string) => Promise<MozillaUpload>;
  submit: (uuid: string, source: Artifact) => Promise<MozillaVersion>;
  notes: (id: number, notes: Notes) => Promise<MozillaVersion>;
  sourceHash: (version: MozillaVersion) => Promise<string | undefined>;
}
const fileBlob = (artifact: Artifact) =>
  new Blob([new Uint8Array(readFileSync(artifact.path))], { type: "application/zip" });

export function amoAuthorization(credentials: Credentials): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: requireValue(credentials, "AMO_JWT_ISSUER"),
      jti: randomUUID(),
      iat: now,
      exp: now + 60,
    }),
  ).toString("base64url");
  const body = `${header}.${payload}`;
  const signature = createHmac("sha256", requireValue(credentials, "AMO_JWT_SECRET"))
    .update(body)
    .digest("base64url");
  return `JWT ${body}.${signature}`;
}
export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function createStores(
  target: Packet["targets"],
  credentials: Credentials,
  fetcher: Fetcher = fetch,
): { chrome: ChromeApi; mozilla: MozillaApi } {
  const cwsName = `publishers/${encodeURIComponent(target.publisherId)}/items/${encodeURIComponent(target.extensionId)}`;
  const amoRoot = `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(target.addonId)}/`;
  let cachedToken: { value: string; expires: number } | undefined;
  const googleAuth = () => {
    if (cachedToken === undefined || cachedToken.expires < Date.now()) {
      cachedToken = {
        value: chromeAccessToken(credentials),
        expires: Date.now() + 45 * 60 * 1000,
      };
    }
    return `Bearer ${cachedToken.value}`;
  };
  async function json<T>(
    url: string,
    authorization: string,
    operation: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", authorization);
    const response = await fetcher(url, { ...init, headers, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) {
      throw new StoreHttpError(response.status, operation);
    }
    return (await response.json()) as T;
  }
  const mozillaJson = async <T,>(url: string, operation: string, init?: RequestInit) =>
    await json<T>(url, amoAuthorization(credentials), operation, init);
  const chrome: ChromeApi = {
    async status() {
      const result = await json<ChromeResponse>(
        `https://chromewebstore.googleapis.com/v2/${cwsName}:fetchStatus`,
        googleAuth(),
        "Chrome status",
      );
      if (result.itemId !== target.extensionId || result.takenDown === true) {
        throw new Error("Chrome returned a different or taken-down item.");
      }
      return {
        published:
          result.publishedItemRevisionStatus?.distributionChannels?.map(
            (channel) => channel.crxVersion,
          ) ?? [],
        submitted:
          result.submittedItemRevisionStatus?.distributionChannels?.map(
            (channel) => channel.crxVersion,
          ) ?? [],
        state:
          result.submittedItemRevisionStatus?.state ??
          result.publishedItemRevisionStatus?.state ??
          "UNKNOWN",
        uploadState: result.lastAsyncUploadState ?? "NOT_FOUND",
      };
    },
    async upload(artifact) {
      const result = await json<ChromeUpload>(
        `https://chromewebstore.googleapis.com/upload/v2/${cwsName}:upload`,
        googleAuth(),
        "Chrome upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/zip" },
          body: fileBlob(artifact),
        },
      );
      if (result.itemId !== target.extensionId) {
        throw new Error("Chrome upload returned the wrong item.");
      }
      return result;
    },
    async submit() {
      return await json<{ state: string }>(
        `https://chromewebstore.googleapis.com/v2/${cwsName}:publish`,
        googleAuth(),
        "Chrome submission",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publishType: "DEFAULT_PUBLISH",
            skipReview: false,
            blockOnWarnings: true,
          }),
        },
      );
    },
  };
  const mozilla: MozillaApi = {
    async addon() {
      const result = await mozillaJson<MozillaAddon>(
        `${amoRoot}?show_source=true`,
        "Mozilla add-on",
      );
      if (result.guid !== target.addonGuid) {
        throw new Error("Mozilla add-on GUID differs from the packaged extension.");
      }
      return result;
    },
    async versions(): Promise<readonly MozillaVersion[]> {
      const versions: MozillaVersion[] = [];
      for (let page = 1; page <= 100; page++) {
        // eslint-disable-next-line no-await-in-loop -- API pagination is sequential.
        const result = await mozillaJson<{ results: MozillaVersion[]; next: string | null }>(
          `${amoRoot}versions/?filter=all_with_unlisted&page_size=50&page=${page}&show_source=true`,
          "Mozilla versions",
        );
        versions.push(...result.results);
        if (result.next === null) {
          return versions;
        }
      }
      throw new Error("Mozilla version history exceeds the supported pagination bound.");
    },
    async version(version) {
      try {
        return await mozillaJson<MozillaVersion>(
          `${amoRoot}versions/v${encodeURIComponent(version)}/?show_source=true`,
          "Mozilla version",
        );
      } catch (error) {
        if (error instanceof StoreHttpError && error.status === 404) {
          return undefined;
        }
        throw error;
      }
    },
    async upload(artifact) {
      const body = new FormData();
      body.set("upload", fileBlob(artifact), path.basename(artifact.path));
      body.set("channel", "listed");
      return await mozillaJson<MozillaUpload>(
        "https://addons.mozilla.org/api/v5/addons/upload/",
        "Mozilla upload",
        { method: "POST", body },
      );
    },
    async uploadStatus(uuid) {
      return await mozillaJson<MozillaUpload>(
        `https://addons.mozilla.org/api/v5/addons/upload/${encodeURIComponent(uuid)}/`,
        "Mozilla validation",
      );
    },
    async submit(uuid, source) {
      const body = new FormData();
      body.set("upload", uuid);
      body.set("source", fileBlob(source), path.basename(source.path));
      return await mozillaJson<MozillaVersion>(
        `${amoRoot}versions/`,
        "Mozilla submission with source",
        {
          method: "POST",
          body,
        },
      );
    },
    async notes(id, notes) {
      return await mozillaJson<MozillaVersion>(
        `${amoRoot}versions/${id}/`,
        "Mozilla release notes",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ release_notes: notes }),
        },
      );
    },
    async sourceHash(version) {
      if (version.source === undefined || version.source === null) {
        return undefined;
      }
      const url = new URL(version.source);
      if (url.protocol !== "https:" || url.hostname !== "addons.mozilla.org") {
        throw new Error("Unexpected Mozilla source-download origin.");
      }
      const response = await fetcher(url, {
        headers: { Authorization: amoAuthorization(credentials) },
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) {
        throw new StoreHttpError(response.status, "Mozilla source verification");
      }
      return sha256(new Uint8Array(await response.arrayBuffer()));
    },
  };
  return { chrome, mozilla };
}

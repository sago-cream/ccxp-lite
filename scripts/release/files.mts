import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { sha256, versionParts } from "./model.mjs";
import type { Artifact, Packet, State } from "./model.mjs";

export function command(binary: string, args: readonly string[], cwd = process.cwd()): string {
  const result = spawnSync(binary, args, { cwd, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(
      `${binary} command failed; inspect authentication, repository state, or artifact availability. Output suppressed.`,
    );
  }
  return result.stdout.trimEnd();
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Keep the decoded JSON shape at the boundary.
export function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}
export function saveJson(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, undefined, 2)}\n`, { mode: 0o600, flag: "wx" });
  renameSync(temporary, file);
}
export function packetDirectory(version: string): string {
  versionParts(version);
  return path.resolve(".build/releases", version);
}
export function loadPacket(version: string): Packet {
  return readJson<Packet>(path.join(packetDirectory(version), "packet.json"));
}
export function loadState(version: string): State {
  return readJson<State>(path.join(packetDirectory(version), "state.json"));
}
export function saveState(version: string, state: State): void {
  saveJson(path.join(packetDirectory(version), "state.json"), state);
}
export function artifact(file: string): Artifact {
  const bytes = readFileSync(file);
  return { path: path.resolve(file), size: bytes.length, sha256: sha256(bytes) };
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Keep the decoded JSON shape at the boundary.
export function archiveJson<T>(file: string, entry: string): T {
  return JSON.parse(command("unzip", ["-p", file, entry])) as T;
}
export function verifyPackages(version: string, files: Packet["artifacts"]): void {
  for (const file of Object.values(files)) {
    command("unzip", ["-tq", file.path]);
  }
  const chrome = archiveJson<{ version: string }>(files.chrome.path, "manifest.json");
  const firefox = archiveJson<{
    version: string;
    browser_specific_settings: { gecko: { id: string } };
  }>(files.firefox.path, "manifest.json");
  const source = archiveJson<{ version: string }>(files.source.path, "package.json");
  if ([chrome.version, firefox.version, source.version].some((value) => value !== version)) {
    throw new Error("An archive has the wrong packaged version.");
  }
  if (firefox.browser_specific_settings.gecko.id !== "ccxp-lite@hsiii.dev") {
    throw new Error("Firefox archive has the wrong add-on GUID.");
  }
  const entries = command("unzip", ["-Z1", files.source.path]).split("\n");
  if (
    entries.some(
      (entry) =>
        entry
          .split("/")
          .some(
            (segment) =>
              segment === ".." ||
              segment === ".git" ||
              segment === "node_modules" ||
              /^\.env(?:\.|$)/u.test(segment),
          ) ||
        entry.startsWith("/") ||
        /(?:^|\/)(?:credentials|secrets?)\.(?:json|pem|key)$/u.test(entry),
    )
  ) {
    throw new Error("Source ZIP contains private configuration, dependencies, or unsafe paths.");
  }
}
export async function lock<T>(targets: Packet["targets"], work: () => Promise<T>): Promise<T> {
  const directory = path.join(homedir(), ".cache/ccxp-lite-release");
  mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `${sha256(JSON.stringify(targets))}.lock`);
  if (existsSync(file)) {
    const prior = readJson<{ pid: number }>(file);
    if (!Number.isInteger(prior.pid) || prior.pid <= 0) {
      throw new Error("Malformed release lock; inspect it before continuing.");
    }
    try {
      process.kill(prior.pid, 0);
      throw new Error("Another release process is using these targets.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
        throw error;
      }
      unlinkSync(file);
    }
  }
  const descriptor = openSync(file, "wx", 0o600);
  writeFileSync(descriptor, JSON.stringify({ pid: process.pid }));
  closeSync(descriptor);
  return await work().finally(() => {
    unlinkSync(file);
  });
}
export function verifyStoredArtifact(file: Artifact): void {
  if (statSync(file.path).size !== file.size || sha256(readFileSync(file.path)) !== file.sha256) {
    throw new Error("Stored artifact changed.");
  }
}

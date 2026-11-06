import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { artifact, command, packetDirectory, verifyPackages } from "./files.mjs";
import { changesStoreNotes, compareVersions } from "./model.mjs";
import type { Artifact, Baseline, Packet } from "./model.mjs";

const repo = "sago-cream/ccxp-lite";
interface GithubRelease {
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  body: string;
  assets: Array<{ name: string; digest?: string | null; size: number }>;
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Keep the decoded API shape at the boundary.
export function ghJson<T>(args: readonly string[]): T {
  return JSON.parse(command("gh", args)) as T;
}
export function previousRelease(version: string): GithubRelease {
  const releases = ghJson<GithubRelease[]>(["api", `repos/${repo}/releases?per_page=100`]);
  const candidates = releases
    .filter(
      (release) =>
        !release.draft &&
        !release.prerelease &&
        /^v\d+\.\d+\.\d+$/u.test(release.tag_name) &&
        compareVersions(release.tag_name.slice(1), version) < 0,
    )
    .toSorted((a, b) => compareVersions(b.tag_name.slice(1), a.tag_name.slice(1)));
  if (candidates.length === 0) {
    throw new Error("No previous shared GitHub release found; establish its baseline explicitly.");
  }
  return candidates[0];
}
export function tagCommit(ref: string): string {
  return command("git", ["rev-parse", "--verify", `${ref}^{commit}`]);
}
export function baseline(
  version: string,
  destination: "github" | "chrome" | "mozilla",
  override?: string,
): Baseline {
  const refs =
    override === undefined
      ? [
          `v${version}`,
          ...(destination === "github"
            ? []
            : [`${destination === "chrome" ? "crx" : "firefox"}-v${version}`]),
        ]
      : [override];
  const candidates: Array<{ ref: string; commit: string }> = [];
  for (const ref of refs) {
    try {
      candidates.push({ ref, commit: tagCommit(ref) });
    } catch {
      /* A skipped platform tag is normal. */
    }
  }
  if (
    candidates.length === 0 ||
    new Set(candidates.map((candidate) => candidate.commit)).size !== 1
  ) {
    throw new Error(
      `Cannot confidently map ${destination} version ${version} to source. Supply its explicit baseline ref.`,
    );
  }
  return {
    version,
    ...candidates[0],
    url: `https://github.com/${repo}/releases/tag/${candidates[0].ref}`,
  };
}
interface GithubArtifacts {
  commit: string;
  artifacts: Record<"chrome" | "firefox" | "source", Artifact>;
  release: GithubRelease;
}
export function collectGithubArtifacts(version: string): GithubArtifacts {
  const release = ghJson<GithubRelease>(["api", `repos/${repo}/releases/tags/v${version}`]);
  if (release.draft || release.prerelease) {
    throw new Error("Use a published stable GitHub release.");
  }
  command("git", ["fetch", "origin", "--tags"]);
  const commit = tagCommit(`v${version}`);
  const releasedPackage = JSON.parse(command("git", ["show", `${commit}:package.json`])) as {
    version: string;
  };
  if (releasedPackage.version !== version) {
    throw new Error("GitHub release tag and package version differ.");
  }
  const directory = path.join(packetDirectory(version), "artifacts");
  mkdirSync(directory, { recursive: true });
  const names = {
    chrome: `ccxpLite-crx-v${version}.zip`,
    firefox: `ccxpLite-firefox-v${version}.xpi`,
    source: `ccxpLite-firefox-v${version}-sources.zip`,
  };
  const files = {} as Record<keyof typeof names, Artifact>;
  for (const kind of ["chrome", "firefox", "source"] as const) {
    const name = names[kind];
    const asset = release.assets.find((candidate) => candidate.name === name);
    if (asset === undefined) {
      throw new Error("A required GitHub release asset is missing.");
    }
    const target = path.join(directory, name);
    if (!existsSync(target)) {
      const temporary = `${target}.${randomUUID()}.download`;
      try {
        command("gh", [
          "release",
          "download",
          `v${version}`,
          "--repo",
          repo,
          "--pattern",
          name,
          "--output",
          temporary,
        ]);
        const downloaded = artifact(temporary);
        if (
          downloaded.size !== asset.size ||
          (typeof asset.digest === "string" && asset.digest !== `sha256:${downloaded.sha256}`)
        ) {
          throw new Error("A downloaded asset differs from its published GitHub metadata.");
        }
        renameSync(temporary, target);
      } finally {
        rmSync(temporary, { force: true });
      }
    }
    files[kind] = artifact(target);
    if (
      files[kind].size !== asset.size ||
      (typeof asset.digest === "string" && asset.digest !== `sha256:${files[kind].sha256}`)
    ) {
      throw new Error("A downloaded asset differs from its published GitHub metadata.");
    }
  }
  verifyPackages(version, files);
  return { commit, artifacts: files, release };
}
export function publishGithub(version: string, notesPath: string): GithubArtifacts {
  const notes = readFileSync(notesPath, "utf8");
  if (notes.trim() === "") {
    throw new Error("Write curated GitHub notes first.");
  }
  const existing = spawnSync("gh", ["api", `repos/${repo}/releases/tags/v${version}`], {
    encoding: "utf8",
  });
  if (existing.status === 0) {
    const release = JSON.parse(existing.stdout) as GithubRelease;
    if (release.draft || release.body.trim() !== notes.trim()) {
      throw new Error("Existing release status or notes differ; inspect it before resuming.");
    }
    return collectGithubArtifacts(version);
  }
  // Authenticate separately so an API outage/permission error is never treated as a missing
  // release.
  ghJson<unknown>(["api", `repos/${repo}`]);
  if (!existing.stderr.includes("HTTP 404")) {
    throw new Error("Cannot establish whether the GitHub release already exists.");
  }
  if (
    command("git", ["branch", "--show-current"]) !== "main" ||
    command("git", ["status", "--porcelain"]) !== ""
  ) {
    throw new Error("Publish GitHub releases from clean main in its assigned checkout.");
  }
  command("git", ["fetch", "origin", "main"]);
  if (tagCommit("HEAD") !== tagCommit("origin/main")) {
    throw new Error("Update main before releasing.");
  }
  changesStoreNotes(previousRelease(version).tag_name.slice(1), version);
  const directory = packetDirectory(version);
  mkdirSync(directory, { recursive: true });
  const savedNotes = path.join(directory, "github-notes.md");
  writeFileSync(savedNotes, notes);
  const env = { ...process.env };
  if ((env.GITHUB_TOKEN ?? "") === "") {
    env.GITHUB_TOKEN = command("gh", ["auth", "token"]);
  }
  const quotedPath = `'${savedNotes.replaceAll("'", String.raw`'\''`)}'`;
  const result = spawnSync(
    "bun",
    [
      "run",
      "release",
      version,
      "--ci",
      "--no-github.draft",
      "--no-github.autoGenerate",
      `--github.releaseNotes=cat ${quotedPath}`,
    ],
    { stdio: "inherit", env },
  );
  if (result.status !== 0) {
    throw new Error(
      "GitHub release command did not complete; inspect remote tag/release before resuming.",
    );
  }
  const verified = collectGithubArtifacts(version);
  if (verified.commit !== tagCommit("HEAD") || verified.release.body.trim() !== notes.trim()) {
    throw new Error("Published GitHub source or notes differ from the requested release.");
  }
  return verified;
}
export function writeChanges(packet: Packet): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  for (const [destination, from] of Object.entries(packet.baselines)) {
    changes[destination] = {
      ...from,
      compare: `${from.commit}..${packet.commit}`,
      commits: command("git", ["log", "--format=%h %s", `${from.commit}..${packet.commit}`]),
      diffStat: command("git", ["diff", "--stat", from.commit, packet.commit]),
    };
  }
  if (packet.noteBaselines !== undefined) {
    const notes = {
      mozillaNotes: packet.noteBaselines.mozilla,
      ...Object.fromEntries(
        Object.entries(packet.noteBaselines.chrome ?? {}).map(([locale, from]) => [
          `chromeNotes.${locale}`,
          from,
        ]),
      ),
    };
    for (const [destination, from] of Object.entries(notes)) {
      changes[destination] = {
        ...from,
        compare: `${from.commit}..${packet.commit}`,
        commits: command("git", ["log", "--format=%h %s", `${from.commit}..${packet.commit}`]),
        diffStat: command("git", ["diff", "--stat", from.commit, packet.commit]),
      };
    }
  }
  return changes;
}

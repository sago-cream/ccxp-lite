import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = process.cwd();
const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
const sourceArchive = path.join(
  projectRoot,
  "dist/firefox",
  `ccxpLite-firefox-v${version}-sources.zip`,
);
const temporaryRoot = mkdtempSync(path.join(tmpdir(), "ccxp-lite-source-test-"));

function run(command: string, args: readonly string[]) {
  const result = spawnSync(command, args, { cwd: temporaryRoot, stdio: "inherit" });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed: ${result.error ?? ""}`);
}

function files(directory: string): readonly string[] {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)))
    .toSorted();
}

try {
  run("unzip", ["-q", sourceArchive, "-d", temporaryRoot]);
  run("bun", ["install", "--frozen-lockfile", "--ignore-scripts"]);
  run("bun", ["run", "build:firefox"]);

  const original = path.join(projectRoot, "dist/firefox/unpacked");
  const rebuilt = path.join(temporaryRoot, "dist/firefox/unpacked");
  const originalFiles = files(original);
  assert.deepEqual(
    files(rebuilt),
    originalFiles,
    "Source rebuild must contain every packaged file",
  );
  for (const file of originalFiles) {
    assert.ok(
      readFileSync(path.join(original, file)).equals(readFileSync(path.join(rebuilt, file))),
      `Source rebuild differs: ${file}`,
    );
  }
  console.log(`Firefox source archive reproduces all ${originalFiles.length} packaged files.`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

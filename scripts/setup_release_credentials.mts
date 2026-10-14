import { chmodSync, existsSync, lstatSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const fileName = ".env.release.local";
const outputPath = path.join(projectRoot, fileName);
const fields = [
  ["AMO_JWT_ISSUER", "Mozilla API key (JWT issuer)", "Mozilla Developer Hub > Manage API Keys"],
  ["AMO_JWT_SECRET", "Mozilla API secret", "Mozilla Developer Hub > Manage API Keys"],
  ["CWS_PUBLISHER_ID", "Chrome publisher ID", "Chrome developer dashboard > Publisher > Settings"],
  ["CWS_CLIENT_ID", "Chrome OAuth client ID", "Google Cloud > APIs & Services > Credentials"],
  [
    "CWS_CLIENT_SECRET",
    "Chrome OAuth client secret",
    "Google Cloud > APIs & Services > Credentials",
  ],
  ["CWS_REFRESH_TOKEN", "Chrome refresh token", "OAuth Playground > Exchange authorization code"],
  ["CWS_EXTENSION_ID", "Chrome extension ID", "Keep the existing ccxpLite ID unless it changed"],
  ["AMO_ADDON_ID", "Mozilla add-on slug/GUID", "Keep the existing ccxplite slug unless it changed"],
] as const;

class SetupError extends Error {
  name = "SetupError";
}

function encodeValue(value: string) {
  const quote = ["'", "`"].find((candidate) => !value.includes(candidate));
  if (quote === undefined || /\p{Cc}/u.test(value)) {
    throw new SetupError("Paste a single-line credential without both apostrophes and backticks.");
  }
  // Bun expands variables even inside single quotes; escape only dollar signs.
  return `${quote}${value.replaceAll("$", String.raw`\$`)}${quote}`;
}

function save(contents: string) {
  if (existsSync(outputPath) && !lstatSync(outputPath).isFile()) {
    throw new SetupError("The credential path must be a regular file.");
  }
  const temporaryPath = `${outputPath}.${crypto.randomUUID()}.tmp`;
  writeFileSync(temporaryPath, contents, { mode: 0o600, flag: "wx" });
  renameSync(temporaryPath, outputPath);
  chmodSync(outputPath, 0o600);
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new SetupError(
      "Run this command in an interactive terminal; piped input is not supported.",
    );
  }
  const ignored = spawnSync("git", ["check-ignore", "--quiet", fileName], { cwd: projectRoot });
  if (ignored.status !== 0) {
    throw new SetupError("The credential file must be untracked and ignored by Git before setup.");
  }
  if (existsSync(outputPath) && !lstatSync(outputPath).isFile()) {
    throw new SetupError("The credential path must be a regular file.");
  }
  let contents = readFileSync(
    existsSync(outputPath) ? outputPath : path.join(projectRoot, ".env.release.example"),
    "utf8",
  );
  save(contents);

  // Readline still handles editing and paste, but never echoes credentials.
  const mutedOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const readline = createInterface({
    input: process.stdin,
    output: mutedOutput,
    terminal: true,
    historySize: 0,
  });
  const cancellation = new AbortController();
  readline.on("SIGINT", () => {
    cancellation.abort();
  });

  process.stdout.write(
    "Release credential setup\nInput is hidden. Enter keeps an existing value or skips an empty field.\nEach answer is saved immediately; Ctrl+C stops without losing saved answers.\n",
  );
  try {
    for (const [key, label, source] of fields) {
      const pattern = new RegExp(`^${key}=.*$`, "mu");
      const current = pattern
        .exec(contents)?.[0]
        .slice(key.length + 1)
        .trim();
      const configured = current !== undefined && !["", "''", '""'].includes(current);
      process.stdout.write(
        `\n${label} (${key})\n${source}\n${configured ? "Replace or Enter to keep" : "Paste or Enter to skip"}: `,
      );
      // eslint-disable-next-line no-await-in-loop -- Each prompt needs its own answer before continuing.
      const input = await readline.question("", { signal: cancellation.signal });
      const answer = input.trim();
      process.stdout.write("\n");
      if (answer === "") {
        continue;
      }
      const entry = `${key}=${encodeValue(answer)}`;
      contents = pattern.test(contents)
        ? contents.replace(pattern, () => entry)
        : `${contents.trimEnd()}\n${entry}\n`;
      save(contents);
      process.stdout.write("Saved.\n");
    }
    process.stdout.write(`\nDone. Credentials saved in ${fileName} (owner access only).\n`);
  } catch (error) {
    if (!cancellation.signal.aborted) {
      throw error;
    }
    process.stdout.write("\nStopped. Previously saved answers are kept.\n");
    process.exitCode = 130;
  } finally {
    readline.close();
    mutedOutput.destroy();
  }
}

await main().catch((error: unknown) => {
  // Do not include exception details that could contain pasted credentials.
  process.stderr.write(
    `${error instanceof SetupError ? error.message : "Credential setup could not finish. Check the terminal and local file permissions."}\n`,
  );
  process.exitCode = 1;
});

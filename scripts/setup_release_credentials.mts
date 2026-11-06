import { createHmac, randomUUID } from "node:crypto";
import { chmodSync, existsSync, lstatSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputPath = path.join(projectRoot, ".env.release.local");
const fields = [
  "AMO_JWT_ISSUER",
  "AMO_JWT_SECRET",
  "CWS_PUBLISHER_ID",
  "CWS_CLIENT_ID",
  "CWS_CLIENT_SECRET",
  "CWS_REFRESH_TOKEN",
  "CWS_EXTENSION_ID",
  "AMO_ADDON_ID",
] as const;
type Field = (typeof fields)[number];
type Credentials = Partial<Record<Field, string>>;

class SetupError extends Error {
  name = "SetupError";
}

function checkPath() {
  if (existsSync(outputPath) && !lstatSync(outputPath).isFile()) {
    throw new SetupError("The credential path must be a regular file.");
  }
  const ignored = spawnSync("git", ["check-ignore", "--quiet", outputPath], { cwd: projectRoot });
  if (ignored.status !== 0) {
    throw new SetupError("The credential file must be untracked and ignored by Git.");
  }
}

function load(): Credentials {
  if (!existsSync(outputPath)) {
    return {};
  }
  // Use the same dotenv parser as release commands. Never forward its output or errors.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !fields.includes(key as Field)),
  );
  const result = spawnSync(
    process.execPath,
    [
      `--env-file=${outputPath}`,
      "-e",
      `process.stdout.write(JSON.stringify(Object.fromEntries(${JSON.stringify(fields)}.map(k => [k, process.env[k] ?? ""]))))`,
    ],
    { cwd: path.parse(projectRoot).root, env, encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new SetupError("Could not load the private credential file.");
  }
  return JSON.parse(result.stdout) as Credentials;
}

function encode(value: string) {
  const quote = ["'", "`"].find((candidate) => !value.includes(candidate));
  if (quote === undefined || /\p{Cc}/u.test(value)) {
    throw new SetupError(
      "Credentials must be single-line values without both apostrophes and backticks.",
    );
  }
  return `${quote}${value.replaceAll("$", String.raw`\$`)}${quote}`;
}

function save(values: Credentials) {
  const contents = [
    "# Private release credentials. Managed with release:setup; never commit this file.",
    ...fields.map((field) => `${field}=${encode(values[field] ?? "")}`),
    "",
  ].join("\n");
  const temporaryPath = `${outputPath}.${randomUUID()}.tmp`;
  writeFileSync(temporaryPath, contents, { mode: 0o600, flag: "wx" });
  renameSync(temporaryPath, outputPath);
  chmodSync(outputPath, 0o600);
}

function requireValue(values: Credentials, field: Field) {
  const value = values[field];
  if (value === undefined || value === "") {
    throw new SetupError(`Missing ${field}.`);
  }
  return value;
}

function validate(field: Field, value: string) {
  if (value === "" || /\p{Cc}/u.test(value)) {
    throw new SetupError("Enter one nonempty credential value, without a label or assignment.");
  }
  if (field === "AMO_JWT_ISSUER" && !/^user:\d+:\d+$/u.test(value)) {
    throw new SetupError("AMO_JWT_ISSUER must be the JWT issuer, in user:number:number format.");
  }
  if (field === "CWS_CLIENT_ID" && !/^[\w-]+\.apps\.googleusercontent\.com$/u.test(value)) {
    throw new SetupError(
      "CWS_CLIENT_ID must be the Google OAuth client ID ending in .apps.googleusercontent.com.",
    );
  }
  if (field === "CWS_EXTENSION_ID" && !/^[a-p]{32}$/u.test(value)) {
    throw new SetupError("CWS_EXTENSION_ID must be the 32-letter Chrome extension ID.");
  }
  if (field === "CWS_REFRESH_TOKEN" && value.startsWith("ya29.")) {
    throw new SetupError("This is an access token. Copy the refresh token instead.");
  }
}

async function request(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    throw new SetupError(
      `Authentication check failed with HTTP ${response.status}. No store changes were made.`,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

async function verifyChrome(values: Credentials) {
  const token = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: requireValue(values, "CWS_CLIENT_ID"),
      client_secret: requireValue(values, "CWS_CLIENT_SECRET"),
      refresh_token: requireValue(values, "CWS_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  if (typeof token.access_token !== "string") {
    throw new SetupError("Chrome did not return an access token.");
  }
  const publisher = encodeURIComponent(requireValue(values, "CWS_PUBLISHER_ID"));
  const extension = encodeURIComponent(requireValue(values, "CWS_EXTENSION_ID"));
  await request(
    `https://chromewebstore.googleapis.com/v2/publishers/${publisher}/items/${extension}:fetchStatus`,
    {
      headers: { Authorization: `Bearer ${token.access_token}` },
    },
  );
  console.log(
    "Chrome credentials verified: access to the configured extension. No store changes made.",
  );
}

async function verifyMozilla(values: Credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: requireValue(values, "AMO_JWT_ISSUER"),
      jti: randomUUID(),
      iat: now,
      exp: now + 60,
    }),
  ).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", requireValue(values, "AMO_JWT_SECRET"))
    .update(unsigned)
    .digest("base64url");
  const addon = encodeURIComponent(requireValue(values, "AMO_ADDON_ID"));
  const result = await request(`https://addons.mozilla.org/api/v5/addons/addon/${addon}/`, {
    headers: { Authorization: `JWT ${unsigned}.${signature}` },
  });
  const manifest = JSON.parse(
    readFileSync(path.join(projectRoot, "src/manifest.firefox.json"), "utf8"),
  ) as {
    browser_specific_settings: { gecko: { id: string } };
  };
  if (result.guid !== manifest.browser_specific_settings.gecko.id) {
    throw new SetupError(
      "Mozilla returned an add-on with a different GUID from the packaged manifest.",
    );
  }
  const ownerId = /^user:(\d+):\d+$/u.exec(requireValue(values, "AMO_JWT_ISSUER"))?.[1];
  const authors = result.authors as Array<{ id: number }> | undefined;
  if (ownerId === undefined || !(authors ?? []).some((author) => String(author.id) === ownerId)) {
    throw new SetupError(
      "The Mozilla credential account is not a listed developer of this add-on.",
    );
  }
  console.log(
    "Mozilla credentials verified: developer account and packaged add-on GUID match. No store changes made.",
  );
}

async function main() {
  const [command = "help", ...args] = process.argv.slice(2);
  if (command === "" || command === "help" || command === "--help") {
    console.log(
      [
        "Release credential setup (values never printed)",
        "  status                         Show configured/missing field names",
        "  set KEY --from-file PATH       Import one value from a private entry card file",
        "  clear KEY                      Clear one saved field",
        "  reset                          Discard all saved values; keep default public target IDs",
        "  verify [chrome|mozilla|all]     Read-only authentication checks (default: all)",
        `Fields: ${fields.join(", ")}`,
        "Copy each value from its named field. No sequential prompts or secret command arguments.",
      ].join("\n"),
    );
    return;
  }
  checkPath();
  const values = command === "reset" ? {} : load();
  if (command === "status" && args.length === 0) {
    for (const field of fields) {
      console.log(`${field}: ${(values[field] ?? "") === "" ? "missing" : "configured"}`);
    }
  } else if (command === "reset" && args.length === 0) {
    save({ CWS_EXTENSION_ID: "glcnfmnbmknbphfgjgbokbbchahmiakk", AMO_ADDON_ID: "ccxplite" });
    console.log("Discarded saved credentials. Default public extension/add-on IDs retained.");
  } else if ((command === "set" || command === "clear") && fields.includes(args[0] as Field)) {
    const field = args[0] as Field;
    if (command === "clear" && args.length === 1) {
      values[field] = "";
    } else if (command === "set" && args.length === 3 && args[1] === "--from-file") {
      const value = readFileSync(args[2], "utf8").trim();
      validate(field, value);
      values[field] = value;
    } else {
      throw new SetupError("Use set KEY --from-file PATH or clear KEY.");
    }
    save(values);
    console.log(`${field}: ${command === "set" ? "saved" : "cleared"}.`);
  } else if (
    command === "verify" &&
    args.length <= 1 &&
    ["all", "chrome", "mozilla", undefined].includes(args[0])
  ) {
    if (args[0] !== "mozilla") {
      await verifyChrome(values);
    }
    if (args[0] !== "chrome") {
      await verifyMozilla(values);
    }
  } else {
    throw new SetupError("Unknown setup command or field. Run release:setup help.");
  }
}

await main().catch((error: unknown) => {
  console.error(
    error instanceof SetupError
      ? error.message
      : "Credential setup failed. Check private input, connectivity, and file permissions.",
  );
  process.exitCode = 1;
});

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fields, loadCredentials, requireValue } from "./setup_release_credentials.mjs";
import { ReleaseEngine, verifyArtifacts } from "./release/engine.mjs";
import {
  loadPacket,
  loadState,
  lock,
  packetDirectory,
  readJson,
  saveJson,
  saveState,
} from "./release/files.mjs";
import {
  baseline,
  collectGithubArtifacts,
  previousRelease,
  publishGithub,
  writeChanges,
} from "./release/github.mjs";
import {
  changesStoreNotes,
  compareVersions,
  descriptionVersion,
  noteDescriptions,
  checkApproval,
  chromeLocales,
  emptyState,
  makePlan,
  normalizeText,
  packetDigest,
  recordBrowserReceipt,
  recordReadyCheck,
  validateSnapshot,
  versionParts,
} from "./release/model.mjs";
import type { DraftNotes, Packet, PackageSnapshot, Snapshot, State } from "./release/model.mjs";
import { createStores } from "./release/stores.mjs";

const browserNextActions: Readonly<Partial<Record<string, string>>> = {
  NEEDS_CHROME_LISTING:
    "Agent: capture fresh Chrome descriptions, run chrome-check, apply and save the exact approved descriptions through the browser, record chrome-observed, then run again.",
  NEEDS_CHROME_PACKAGE_READY:
    "Agent: re-read the staged Chrome package/status pages, record chrome-ready with the approved draft version, then run again.",
};

function credentials() {
  const values = loadCredentials();
  for (const field of fields) {
    if ((process.env[field] ?? "") !== "") {
      values[field] = process.env[field];
    }
  }
  return values;
}

function targets() {
  const values = credentials();
  const target = {
    publisherId: requireValue(values, "CWS_PUBLISHER_ID"),
    extensionId: requireValue(values, "CWS_EXTENSION_ID"),
    addonId: requireValue(values, "AMO_ADDON_ID"),
    addonGuid: "ccxp-lite@hsiii.dev",
  };
  if (target.extensionId !== "glcnfmnbmknbphfgjgbokbbchahmiakk") {
    throw new Error("This workflow is scoped to the configured ccxpLite Chrome item.");
  }
  return target;
}

function services(packet: Packet) {
  return createStores(packet.targets, credentials());
}

function verifyTargets(packet: Packet) {
  if (JSON.stringify(targets()) !== JSON.stringify(packet.targets)) {
    throw new Error("Configured store targets changed; prepare and review a new packet.");
  }
}

function review(packet: Packet, state: State) {
  if (packet.plan === undefined) {
    throw new Error("Draft the notes and create a plan before review.");
  }
  verifyArtifacts(packet);
  const digest = packetDigest(packet);
  const lines = [
    `# ccxpLite ${packet.version}`,
    "",
    `Review digest: ${digest}`,
    "",
    `Source: ${packet.commit}`,
    `GitHub: https://github.com/sago-cream/ccxp-lite/releases/tag/v${packet.version}`,
    "",
    `Chrome: ${packet.baselines.chrome.version} -> ${packet.version}; publisher ${packet.targets.publisherId}; item ${packet.targets.extensionId}.`,
    `Mozilla: ${packet.baselines.mozilla.version} -> ${packet.version}; listed add-on ${packet.targets.addonId}; GUID ${packet.targets.addonGuid}.`,
    "",
    "Behavior: submit both for normal store review/publication; preserve Chrome rollout and listing visibility. Store review completion is independent.",
    "",
    `Chrome validation: ${state.chrome.uploaded === true ? "uploaded" : "not yet complete"}.`,
    `Mozilla validation: ${state.mozilla.uploaded === true ? "passed" : "not yet complete"}.`,
    "",
  ];
  for (const [kind, file] of Object.entries(packet.artifacts)) {
    lines.push(`- ${kind}: ${file.path}; ${file.size} bytes; SHA-256 ${file.sha256}`);
  }
  if (packet.updateNotes && packet.plan.chrome !== undefined && packet.plan.mozilla !== undefined) {
    for (const locale of chromeLocales) {
      lines.push(
        "",
        `## Chrome ${locale} - complete description`,
        "",
        "````text",
        packet.plan.chrome.after[locale],
        "````",
      );
    }
    for (const [locale, text] of Object.entries(packet.plan.mozilla)) {
      lines.push("", `## Mozilla ${locale} - one-line release notes`, "", text);
    }
  } else {
    lines.push(
      "",
      "Patch release: leave both Chrome descriptions and all Mozilla public release notes unchanged.",
    );
  }
  lines.push(
    "",
    "Approve this digest, wording, three package hashes, targets, and submission behavior together.",
    "",
  );
  const file = path.join(packetDirectory(packet.version), "review.md");
  writeFileSync(file, lines.join("\n"));
  return { digest, review: file };
}

async function prepare(version: string, options: ReadonlyMap<string, string>) {
  const directory = packetDirectory(version);
  const packetPath = path.join(directory, "packet.json");
  if (existsSync(packetPath)) {
    throw new Error(
      "This packet already exists. Resume it; do not overwrite its artifacts or baseline evidence.",
    );
  }
  const source = collectGithubArtifacts(version);
  const target = targets();
  const store = createStores(target, credentials());
  const results = await Promise.all([store.chrome.status(), store.mozilla.addon()]);
  const [chrome, mozilla] = results;
  if (chrome.published.length !== 1 || mozilla.current_version === null) {
    throw new Error("Establish one published baseline per store before preparing a packet.");
  }
  const previous = previousRelease(version);
  const currentMozilla = await store.mozilla.version(mozilla.current_version.version);
  if (currentMozilla === undefined || currentMozilla.channel !== "listed") {
    throw new Error("Cannot read Mozilla's previous release notes.");
  }
  const updateNotes = changesStoreNotes(previous.tag_name.slice(1), version);
  const versionsForNotes = updateNotes ? await store.mozilla.versions() : [];
  const publicWithNotes = updateNotes
    ? versionsForNotes
        .filter(
          (entry) =>
            entry.channel === "listed" &&
            (entry.file.status === "public" || entry.file.status === 4) &&
            compareVersions(entry.version, currentMozilla.version) <= 0 &&
            Object.values(entry.release_notes ?? {}).some((text) => text.trim() !== ""),
        )
        .toSorted((a, b) => compareVersions(b.version, a.version))[0]
    : undefined;
  const previousNotes = publicWithNotes ?? currentMozilla;
  const packet: Packet = {
    schema: 1,
    version,
    commit: source.commit,
    previousGithub: previous.tag_name.slice(1),
    updateNotes,
    targets: target,
    artifacts: source.artifacts,
    baselines: {
      github: baseline(previous.tag_name.slice(1), "github"),
      chrome: baseline(chrome.published[0], "chrome", options.get("--chrome-baseline-ref")),
      mozilla: baseline(
        mozilla.current_version.version,
        "mozilla",
        options.get("--mozilla-baseline-ref"),
      ),
    },
    noteBaselines: updateNotes
      ? {
          mozilla: baseline(previousNotes.version, "mozilla", options.get("--mozilla-note-ref")),
        }
      : undefined,
    mozillaLocales:
      Object.keys(previousNotes.release_notes ?? {}).length > 0
        ? Object.keys(previousNotes.release_notes ?? {})
        : [mozilla.default_locale],
    createdAt: new Date().toISOString(),
  };
  mkdirSync(directory, { recursive: true });
  if (!packet.updateNotes) {
    packet.plan = {};
  }
  saveJson(packetPath, packet);
  saveState(version, emptyState());
  saveJson(path.join(directory, "baselines.json"), {
    chrome,
    mozilla: {
      version: currentMozilla.version,
      notes: previousNotes.release_notes,
      notesVersion: previousNotes.version,
      defaultLocale: mozilla.default_locale,
    },
    githubNotes: previous.body,
  });
  saveJson(path.join(directory, "changes.json"), writeChanges(packet));
  saveJson(path.join(directory, "notes.json"), {
    chrome: { en: "", "zh-TW": "" },
    mozilla: Object.fromEntries(packet.mozillaLocales.map((locale) => [locale, ""])),
  });
  return {
    directory,
    updateStoreNotes: packet.updateNotes,
    next: packet.updateNotes
      ? "Capture both Chrome descriptions, run context, read all note-baseline intervals in changes.json, draft notes, and run plan."
      : "Stage uploads, review the package targets, and obtain approval.",
  };
}

function optionsFrom(args: readonly string[]): ReadonlyMap<string, string> {
  const options = new Map<string, string>();
  const allowed = new Set([
    "--chrome-baseline-ref",
    "--chrome-en-note-ref",
    "--chrome-listings",
    "--chrome-zh-note-ref",
    "--digest",
    "--file",
    "--mozilla-baseline-ref",
    "--mozilla-note-ref",
    "--notes",
  ]);
  for (let index = 0; index < args.length; index += 2) {
    if (!allowed.has(args[index]) || index + 1 >= args.length || options.has(args[index])) {
      throw new Error("Use named options with exactly one value each; see release:flow help.");
    }
    options.set(args[index], args[index + 1]);
  }
  return options;
}

function required(options: ReadonlyMap<string, string>, name: string): string {
  const value = options.get(name);
  if (value === undefined) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function chromeCheck(packet: Packet, state: State, snapshot: Snapshot) {
  checkApproval(packet, state);
  verifyArtifacts(packet);
  validateSnapshot(packet, snapshot);
  if (
    Date.now() - Date.parse(snapshot.observedAt) > 5 * 60 * 1000 ||
    Date.parse(snapshot.observedAt) < Date.parse(state.approval?.approvedAt ?? "")
  ) {
    throw new Error("Read the current Chrome descriptions after approval before checking them.");
  }
  const plan = packet.plan?.chrome;
  if (plan === undefined) {
    throw new Error("Patch releases do not modify Chrome descriptions.");
  }
  const actions = chromeLocales.map((locale) => {
    const current = normalizeText(snapshot.descriptions[locale]);
    return {
      locale,
      action:
        current === normalizeText(plan.after[locale])
          ? "read-back-only"
          : "replace-description-and-save-draft",
      before: plan.before[locale],
      after: plan.after[locale],
    };
  });
  // eslint-disable-next-line no-param-reassign -- Record the fresh listing check in the journal.
  state.chrome.browserCheck = { digest: packetDigest(packet), observedAt: snapshot.observedAt };
  saveState(packet.version, state);
  return {
    url: snapshot.url,
    digest: packetDigest(packet),
    actions,
    next: "Use the authenticated browser to apply only these actions, save each locale, re-read both saved descriptions, and record chrome-observed. No human action is required after the approved review.",
  };
}
export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  const [action = "help", version, ...rest] = args;
  if (action === "help" || action === "--help") {
    console.log(
      [
        "Agent-driven ccxpLite release flow; values and tokens are never printed.",
        "github VERSION --notes PATH              Publish/verify GitHub via the existing release script (clean updated main)",
        "prepare VERSION                          Download/verify its three GitHub artifacts and gather store baselines",
        "context VERSION --chrome-listings PATH     Resolve previous note versions before drafting prose",
        "plan VERSION --notes PATH --chrome-listings PATH  Build exact localized text (non-patch releases)",
        "withdraw VERSION                         Withdraw approval before revising an unsubmitted plan",
        "stage VERSION                            Upload/validate both packages without submitting or changing notes",
        "review VERSION                           Write the complete review and its approval digest",
        "approve VERSION --digest SHA256          Record explicit user approval of that exact review",
        "run VERSION                              Resume both stores; request agent browser work when Chrome needs notes",
        "chrome-restage VERSION                   Re-upload the same approved package over an unsubmitted draft",
        "chrome-ready VERSION --file PATH         Verify the staged Chrome package version after approval",
        "chrome-check VERSION --file PATH         Check fresh Chrome observations; emit exact browser actions",
        "chrome-observed VERSION --file PATH      Verify both saved descriptions against the approved packet",
        "status VERSION                           Read remote status and reconcile uncertain submissions without retries",
        "inspect                                  Read current store identity/baselines without writing to either store",
        "Packets: .build/releases/VERSION/. Load private credentials with Bun --env-file or the ignored local config.",
        "The release skill drafts prose, obtains one approval, and performs Chrome's dashboard-only metadata step.",
      ].join("\n"),
    );
    return;
  }
  if (action === "inspect") {
    const store = createStores(targets(), credentials());
    const [chrome, mozilla] = await Promise.all([store.chrome.status(), store.mozilla.addon()]);
    const currentVersion =
      mozilla.current_version === null
        ? undefined
        : await store.mozilla.version(mozilla.current_version.version);
    console.log(
      JSON.stringify(
        {
          chrome,
          mozilla: {
            guid: mozilla.guid,
            version: mozilla.current_version?.version,
            channel: currentVersion?.channel,
            locale: mozilla.default_locale,
          },
        },
        undefined,
        2,
      ),
    );
    return;
  }
  versionParts(version);
  const options = optionsFrom(rest);
  const supported = [
    "github",
    "prepare",
    "plan",
    "context",
    "withdraw",
    "stage",
    "review",
    "approve",
    "run",
    "chrome-check",
    "chrome-ready",
    "chrome-restage",
    "chrome-observed",
    "status",
  ];
  if (!supported.includes(action)) {
    throw new Error("Unknown release-flow action; see help.");
  }
  if (action === "github") {
    publishGithub(version, required(options, "--notes"));
    console.log(`GitHub v${version} and all three assets verified. Continue with prepare.`);
    return;
  }
  if (action === "prepare") {
    console.log(
      JSON.stringify(
        await lock(targets(), async () => await prepare(version, options)),
        undefined,
        2,
      ),
    );
    return;
  }
  const packet = loadPacket(version);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Validate the schema of JSON loaded from disk.
  if (packet.schema !== 1 || packet.version !== version) {
    throw new Error("Unsupported or mismatched packet.");
  }
  verifyTargets(packet);
  await lock(packet.targets, async () => {
    const state = loadState(version);
    const engine = new ReleaseEngine(packet, state, services(packet), () => {
      saveState(version, state);
    });
    switch (action) {
      case "chrome-restage": {
        await engine.restageChrome();
        console.log(
          "Chrome draft receipt reset; resume run/stage to upload the same verified artifact. Other store progress and approval are preserved.",
        );
        break;
      }

      case "chrome-ready": {
        verifyArtifacts(packet);
        recordReadyCheck(packet, state, readJson<PackageSnapshot>(required(options, "--file")));
        saveState(version, state);
        console.log("Chrome staged version matches the approved package. Resume run promptly.");
        break;
      }

      case "withdraw": {
        if (
          state.chrome.submitted === true ||
          state.mozilla.submitted === true ||
          state.chrome.inFlight !== undefined ||
          state.mozilla.inFlight !== undefined
        ) {
          throw new Error(
            "Do not change an accepted or uncertain submission. Resolve it before revising the release.",
          );
        }
        Reflect.deleteProperty(state, "approval");
        Reflect.deleteProperty(state.chrome, "readyCheck");
        Reflect.deleteProperty(state.chrome, "browserCheck");
        Reflect.deleteProperty(state.chrome, "browserReceipt");
        saveState(version, state);
        console.log("Approval withdrawn. Revise the plan, review it, and obtain fresh approval.");
        break;
      }

      case "context": {
        if (!packet.updateNotes || packet.noteBaselines === undefined) {
          throw new Error("Patch releases do not need public-note context.");
        }
        if (state.approval !== undefined) {
          throw new Error("Withdraw approval before changing the note context.");
        }
        const snapshot = readJson<Snapshot>(required(options, "--chrome-listings"));
        validateSnapshot(packet, snapshot);
        packet.noteBaselines.chrome = {
          en: baseline(
            descriptionVersion(noteDescriptions(snapshot).en),
            "chrome",
            options.get("--chrome-en-note-ref"),
          ),
          "zh-TW": baseline(
            descriptionVersion(noteDescriptions(snapshot)["zh-TW"]),
            "chrome",
            options.get("--chrome-zh-note-ref"),
          ),
        };
        saveJson(path.join(packetDirectory(version), "packet.json"), packet);
        saveJson(path.join(packetDirectory(version), "changes.json"), writeChanges(packet));
        console.log(
          "Note baselines resolved. Draft each summary from the note intervals in changes.json, then plan.",
        );
        break;
      }

      case "plan": {
        if (state.approval !== undefined) {
          throw new Error(
            "This plan is already approved; withdraw approval before revising an unsubmitted plan.",
          );
        }
        if (packet.updateNotes) {
          const snapshot = readJson<Snapshot>(required(options, "--chrome-listings"));
          for (const locale of chromeLocales) {
            if (
              packet.noteBaselines?.chrome?.[locale].version !==
              descriptionVersion(noteDescriptions(snapshot)[locale])
            ) {
              throw new Error(
                "Run context with these Chrome descriptions before drafting and planning notes.",
              );
            }
          }
        }
        packet.plan = makePlan(
          packet,
          options.has("--notes") ? readJson<DraftNotes>(required(options, "--notes")) : undefined,
          options.has("--chrome-listings")
            ? readJson<Snapshot>(required(options, "--chrome-listings"))
            : undefined,
        );
        saveJson(path.join(packetDirectory(version), "packet.json"), packet);
        console.log(JSON.stringify(review(packet, state)));

        break;
      }

      case "review": {
        console.log(JSON.stringify(review(packet, state)));
        break;
      }

      case "approve": {
        verifyArtifacts(packet);
        if (required(options, "--digest") !== packetDigest(packet) || packet.plan === undefined) {
          throw new Error("Approval digest does not match the review.");
        }
        if (
          state.chrome.uploaded !== true ||
          state.mozilla.uploaded !== true ||
          state.chrome.inFlight !== undefined ||
          state.mozilla.inFlight !== undefined ||
          state.chrome.error !== undefined ||
          state.mozilla.error !== undefined
        ) {
          throw new Error("Complete package uploads and validation before requesting approval.");
        }
        await Promise.all([engine.chromeBaseline(), engine.mozillaBaseline()]);
        state.approval = { digest: packetDigest(packet), approvedAt: new Date().toISOString() };
        saveState(version, state);
        console.log("Recorded approval. Run the flow to submit the exact approved packet.");

        break;
      }

      case "chrome-check": {
        console.log(
          JSON.stringify(
            chromeCheck(packet, state, readJson<Snapshot>(required(options, "--file"))),
            undefined,
            2,
          ),
        );
        break;
      }

      case "chrome-observed": {
        recordBrowserReceipt(packet, state, readJson<Snapshot>(required(options, "--file")));
        saveState(version, state);
        console.log("Both saved Chrome descriptions match the approved packet. Resume run.");

        break;
      }

      case "status": {
        await Promise.allSettled([engine.reconcileChrome(), engine.reconcileMozilla()]).then(
          (results) => {
            for (const [index, store] of (["chrome", "mozilla"] as const).entries()) {
              const result = results[index];
              if (result.status === "rejected") {
                state[store].error =
                  result.reason instanceof Error
                    ? result.reason.message
                    : "Reconciliation remains unresolved.";
              }
            }
          },
        );
        const [chrome, mozilla] = await Promise.all([
          engine.services.chrome.status(),
          engine.services.mozilla.version(version),
        ]);
        saveState(version, state);
        console.log(
          JSON.stringify(
            {
              approvalValid: state.approval?.digest === packetDigest(packet),
              local: state,
              remote: {
                chrome,
                mozilla:
                  mozilla === undefined
                    ? undefined
                    : {
                        id: mozilla.id,
                        version: mozilla.version,
                        status: mozilla.file.status,
                        hasSource: mozilla.source !== null && mozilla.source !== undefined,
                        notes: mozilla.release_notes,
                      },
              },
            },
            undefined,
            2,
          ),
        );

        break;
      }

      default: {
        await engine.execute(action === "stage" ? "stage" : "run");
        console.log(
          JSON.stringify(
            {
              chrome: state.chrome,
              mozilla: state.mozilla,
              next:
                browserNextActions[state.chrome.remoteState ?? ""] ??
                "Resume run while validation is pending; submitted is distinct from public.",
            },
            undefined,
            2,
          ),
        );
        if (state.chrome.error !== undefined || state.mozilla.error !== undefined) {
          process.exitCode = 1;
        }
        break;
      }
    }
  });
}
if (import.meta.main) {
  await main().catch((error: unknown) => {
    let message = "Release flow failed.";
    if (error instanceof SyntaxError) {
      message = "Invalid JSON input; contents suppressed.";
    } else if (error instanceof Error) {
      ({ message } = error);
    }
    console.error(message);
    process.exitCode = 1;
  });
}

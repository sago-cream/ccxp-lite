import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { Window } from "happy-dom";
import { expect, test } from "vitest";

const root = path.resolve("test/browser-fixtures");

test("work-log visual fixture retains host landmarks and sanitized data", () => {
  const window = new Window({
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  const html = readFileSync(path.join(root, "work-log.html"), "utf8");
  window.document.write(html);
  const doc = window.document;
  expect(doc.querySelector("center #insTask #insForm table.datatable4")).not.toBeNull();
  expect(doc.querySelector("#queTask #queForm table.datatable4")).not.toBeNull();
  expect(doc.querySelector("#divTitle")).not.toBeNull();
  expect(doc.querySelector("#noticeDiv2")).not.toBeNull();
  expect(doc.querySelector("#trLabSerial [name='I_LAB_SERIAL']")?.getAttribute("value")).toBe(
    "fixture-task",
  );
  expect(doc.querySelector("[name='I_TASK_NOTE']")?.getAttribute("value")).toBe("Fixture work");
  for (const input of doc.querySelectorAll("[name='ACIXSTORE']")) {
    expect(input.getAttribute("value")).toBe("fixture");
  }
  expect(html).not.toContain("ccxp-lite-main-skin");
  expect(html).not.toContain("chrome-extension:");
  expect(doc.querySelector("script[src]")).toBeNull();
});

test("all host CSS URLs resolve to bundled fixture assets", () => {
  const assets = JSON.parse(readFileSync(path.join(root, "host-assets.json"), "utf8")) as Record<
    string,
    { file: string; contentType: string }
  >;
  for (const [url, asset] of Object.entries(assets)) {
    expect(existsSync(path.join(root, asset.file))).toBe(true);
    if (asset.contentType !== "text/css") {
      continue;
    }
    const css = readFileSync(path.join(root, asset.file), "utf8");
    for (const match of css.matchAll(/url\(["']?([^\s)"']+)/gu)) {
      if (match[1].startsWith("data:")) {
        continue;
      }
      const resolved = new URL(match[1], `https://www.ccxp.nthu.edu.tw${url}`).pathname;
      expect(assets).toHaveProperty(resolved);
    }
  }
});

test("legacy visual fixtures are complete, inert, and use synthetic staff records", () => {
  const catalog = JSON.parse(readFileSync(path.join(root, "coverage.json"), "utf8")) as {
    pages: Array<{ file: string }>;
  };
  for (const { file } of catalog.pages) {
    const html = readFileSync(path.join(root, file), "utf8");
    expect(html).not.toContain("[Truncated]");
    expect(html).not.toContain("chrome-extension:");
    expect(html).not.toContain("codex-agent-overlay");
    if (!file.startsWith("staff-")) {
      continue;
    }
    const window = new Window({
      settings: {
        disableJavaScriptEvaluation: true,
        disableJavaScriptFileLoading: true,
        disableCSSFileLoading: true,
      },
    });
    window.document.write(html);
    expect(window.document.querySelector("script")).toBeNull();
    const rows = [...window.document.querySelectorAll(".k-grid tbody tr")];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.textContent).toContain("TEST000001");
      expect(row.matches('[data-uid="fixture"]')).toBe(true);
    }
    for (const input of window.document.querySelectorAll("input[type='hidden']")) {
      expect(input.getAttribute("value")).toBe("fixture");
    }
  }
});

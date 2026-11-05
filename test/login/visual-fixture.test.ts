import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Window } from "happy-dom";
import { expect, test } from "vitest";

test("live login capture preserves controls and sanitized form associations", () => {
  const window = new Window({
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  window.document.write(readFileSync("test/browser-fixtures/login.html", "utf8"));
  const { document } = window;
  const form = document.querySelector("form[name='form1']");
  expect(form?.getAttribute("action")).toBe("/ccxp/INQUIRE/pre_select_entry.php");
  for (const name of ["account", "passwd", "passwd2"]) {
    const input = document.querySelector(`input[name='${name}']`);
    expect(input?.getAttribute("value")).toBe("");
  }
  expect(document.querySelector("input[name='fnstr']")?.getAttribute("form")).toBe(form?.id);
  expect(document.querySelector("input[name='fnstr']")?.getAttribute("value")).toBe("fixture");
  expect(document.querySelector("input[type='submit']")?.getAttribute("value")).toBe(
    "\u767B\u5165",
  );
  expect(document.querySelector("script")).toBeNull();
  expect(document.querySelectorAll(".tabcontent").length).toBe(6);
});

test("login provenance identifies the exact retained host images", () => {
  const provenance = JSON.parse(
    readFileSync("test/browser-fixtures/login.provenance.json", "utf8"),
  ) as { hostAssets: Array<{ file: string; sha256: string }> };
  for (const asset of provenance.hostAssets) {
    const bytes = readFileSync(`test/browser-fixtures/${asset.file}`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
  }
});

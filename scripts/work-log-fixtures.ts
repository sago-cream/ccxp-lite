import { readFileSync } from "node:fs";
import path from "node:path";
import type { Route, Page, Frame } from "playwright";

export const workLogPath = "/ccxp/INQUIRE/PE/1/14D/PE14D1.php";
const fixtureRoot = path.resolve("test/browser-fixtures");
const assetMap = JSON.parse(
  readFileSync(path.join(fixtureRoot, "host-assets.json"), "utf8"),
) as Record<string, { file: string; contentType: string } | undefined>;

export async function routeWorkLogFixture(route: Route): Promise<boolean> {
  const url = new URL(route.request().url());
  if (url.origin !== "https://www.ccxp.nthu.edu.tw") {
    return false;
  }
  const asset = assetMap[url.pathname];
  if (asset) {
    await route.fulfill({
      contentType: asset.contentType,
      body: readFileSync(path.join(fixtureRoot, asset.file)),
    });
    return true;
  }
  if (url.pathname !== workLogPath) {
    return false;
  }
  let html = readFileSync(path.join(fixtureRoot, "work-log.html"), "utf8");
  const fields = new URLSearchParams(route.request().postData() ?? "");
  if (fields.get("S_SUBMIT") !== "Loading Data" && fields.has("I_LAB_SERIAL")) {
    // Deterministic offline response only. Never forward a form to CCXP.
    const date = `${Number(fields.get("I_TASK_DT_Year")) - 1911}${fields.get("I_TASK_DT_Month")}${fields.get("I_TASK_DT_Day")}`;
    const cells = [
      "1",
      date,
      `${fields.get("I_TASK_A_TM_Hour")}:${fields.get("I_TASK_A_TM_Minute")}~${fields.get("I_TASK_Z_TM_Hour")}:${fields.get("I_TASK_Z_TM_Minute")}`,
      "2",
      "fixture-task",
      "Fixture department",
      "Fixture work",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    const escape = (text: string) =>
      text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    html = html.replace(
      "<!-- fixture-record -->",
      `<tr>${cells.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`,
    );
    html = html.replace("</body>", "<script>alert('Add successfully!');</script></body>");
  }
  await route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
  return true;
}

export async function assertWorkLogReady(scope: Page | Frame): Promise<Record<string, unknown>> {
  await scope.locator("body.ccxp-lite-main-skin").waitFor();
  await scope.locator("#ccxp-lite-work-log-nav #divTitle").waitFor();
  await scope.locator("#insTask #ccxp-lite-batch").waitFor();
  await scope
    .locator("#insTask .ccxp-lite-work-log-actions .ccxp-lite-action-control-primary")
    .waitFor();
  const evidence = await scope.evaluate(() => {
    const note = document.querySelector<HTMLInputElement>('[name="I_TASK_NOTE"]');
    const panel = document.querySelector("#insTask");
    if (!note || !panel) {
      throw new Error("Missing live-derived work-log form landmarks");
    }
    const css = getComputedStyle(note);
    return {
      language: document.documentElement.dataset.ccxpLiteWorkLogLanguage,
      noteWidth: note.getBoundingClientRect().width,
      noteHeight: note.getBoundingClientRect().height,
      radius: css.borderRadius,
      hostTable: panel.querySelector("table")?.classList.contains("datatable4"),
      theme: getComputedStyle(document.documentElement)
        .getPropertyValue("--ccxp-lite-primary")
        .trim(),
    };
  });
  if (
    (evidence.language ?? "") === "" ||
    evidence.hostTable !== true ||
    evidence.theme === "" ||
    evidence.noteWidth < 250 ||
    evidence.noteHeight < 35 ||
    evidence.radius === "0px"
  ) {
    throw new Error(
      `Work-log capture lacks the production styling pipeline: ${JSON.stringify(evidence)}`,
    );
  }
  return evidence;
}

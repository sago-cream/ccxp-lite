import type { Meta, StoryObj } from "@storybook/html-vite";
import "@ccxp-lite/ui/interactive-page.css";
import { localized, surface } from "./helpers.js";

const meta = {
  title: "Foundations/Native page classes",
  tags: ["!autodocs"],
} satisfies Meta;
export default meta;
type Story = StoryObj;

function example(markup: string) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return surface(template.content);
}

function formMarkup(locale: unknown) {
  const text = (zh: string, en: string) => localized(locale, zh, en);
  return `<section class="ccxp-ui">
  <div class="ccxp-page ccxp-stack">
    <div class="ccxp-field">
      <h1 class="ccxp-title">${text("介面建議", "Interface feedback")}</h1>
      <p class="ccxp-copy ccxp-muted">${text("使用共用 classes 的組合範例。", "A composition example using the shared page classes.")}</p>
    </div>
    <form class="ccxp-panel ccxp-stack">
      <div class="ccxp-grid">
        <div class="ccxp-field">
          <label class="ccxp-label" for="native-class-category">${text("問題類型", "Issue type")}</label>
          <select class="ccxp-control" id="native-class-category">
            <option>${text("版面與顯示", "Layout and display")}</option>
            <option>${text("操作流程", "Interaction and workflow")}</option>
          </select>
        </div>
        <div class="ccxp-field">
          <label class="ccxp-label" for="native-class-email">Email</label>
          <input class="ccxp-control" id="native-class-email" type="email" autocomplete="off">
        </div>
      </div>
      <div class="ccxp-field">
        <label class="ccxp-label" for="native-class-description">${text("您的建議", "Your feedback")}</label>
        <textarea class="ccxp-control" id="native-class-description" rows="4" aria-describedby="native-class-help"></textarea>
        <p class="ccxp-caption" id="native-class-help">${text("600px 以下改為單欄；操作列可以換行。", "Below 600px the grid becomes one column; actions can wrap.")}</p>
      </div>
      <div class="ccxp-row">
        <button class="ccxp-button ccxp-button-primary" type="button">${text("送出建議", "Send feedback")}</button>
        <button class="ccxp-button" type="button">${text("取消", "Cancel")}</button>
        <a class="ccxp-link" href="#native-class-help">${text("使用說明", "Usage notes")}</a>
      </div>
    </form>
  </div>
</section>`;
}

export const ResponsiveForm: Story = {
  render: (_args, context) => example(formMarkup(context.globals.locale)),
  parameters: {
    docs: { source: { code: formMarkup("en"), language: "html" } },
  },
};

function typographyMarkup(locale: unknown) {
  const text = (zh: string, en: string) => localized(locale, zh, en);
  return `<section class="ccxp-ui">
  <div class="ccxp-page ccxp-stack">
    <h1 class="ccxp-title">${text("頁面標題", "Page title")}</h1>
    <p class="ccxp-copy">${text("內文沿用共用字型與間距。", "Body copy uses the shared type and spacing tokens.")}</p>
    <p class="ccxp-copy ccxp-muted">${text("使用 ccxp-muted 搭配其他文字 class。", "Combine ccxp-muted with another text class for secondary text.")}</p>
    <p class="ccxp-caption">${text("欄位提示或補充說明。", "Caption for a field hint or supporting detail.")}</p>
    <p class="ccxp-error" role="status">${text("同時以文字說明錯誤原因。", "Explain the error in text as well as color.")}</p>
    <a class="ccxp-link" href="#native-class-typography-note">${text("可用鍵盤聚焦的連結", "Keyboard-focusable link")}</a>
    <p class="ccxp-caption" id="native-class-typography-note">${text("使用 Tab 檢視焦點外框。", "Use Tab to inspect the focus outline.")}</p>
  </div>
</section>`;
}

export const Typography: Story = {
  render: (_args, context) => example(typographyMarkup(context.globals.locale)),
  parameters: {
    docs: { source: { code: typographyMarkup("en"), language: "html" } },
  },
};

function statesMarkup(locale: unknown) {
  const text = (zh: string, en: string) => localized(locale, zh, en);
  return `<section class="ccxp-ui">
  <div class="ccxp-page ccxp-stack">
    <h1 class="ccxp-title">${text("控制項與狀態", "Control and status examples")}</h1>
    <div class="ccxp-panel ccxp-stack">
      <div class="ccxp-field">
        <label class="ccxp-label" for="native-class-invalid">Email</label>
        <input class="ccxp-control" id="native-class-invalid" type="email" value="example" aria-invalid="true" aria-describedby="native-class-error">
        <p class="ccxp-caption ccxp-error" id="native-class-error">${text("請輸入完整的 email。", "Enter a complete email address.")}</p>
      </div>
      <p class="ccxp-notice" role="status">${text("提示須有適當的 HTML 語意。", "Provide the appropriate HTML role for a status notice.")}</p>
      <div class="ccxp-row">
        <button class="ccxp-button ccxp-button-primary" type="button">${text("主要操作", "Primary action")}</button>
        <button class="ccxp-button" type="button">${text("次要操作", "Secondary action")}</button>
        <button class="ccxp-button ccxp-button-primary" type="button" disabled>${text("停用操作", "Disabled action")}</button>
      </div>
    </div>
  </div>
</section>`;
}

export const ControlStates: Story = {
  render: (_args, context) => example(statesMarkup(context.globals.locale)),
  parameters: {
    docs: { source: { code: statesMarkup("en"), language: "html" } },
  },
};

export type CatalogLocale = "zh-TW" | "en";

export function catalogLocale(value: unknown): CatalogLocale {
  return value === "en" ? "en" : "zh-TW";
}

const labels: Readonly<Record<string, string>> = {
  "Start here": "從這裡開始",
  "Design guidelines": "設計指南",
  "Composition recipes": "元件組合指南",
  Foundations: "設計基礎",
  Tokens: "設計變數",
  Components: "元件",
  Recipes: "組合範例",
  Composition: "元件組合",
  "Action button": "操作按鈕",
  "Form field": "表單欄位",
  "Help popover": "說明浮窗",
  Navigation: "導覽",
  Docs: "文件",
  Primary: "主要操作",
  Secondary: "次要操作",
  Danger: "危險操作",
  Disabled: "停用",
  "Long Label": "長標籤",
  Account: "帳號",
  "With Help": "附說明",
  Closed: "收合",
  Open: "展開",
  "Long Text": "長文字",
  Search: "搜尋",
  Empty: "空白狀態",
  Breadcrumb: "麵包屑導覽",
  "Layout Switch": "版面切換",
  Confirmation: "確認視窗",
  "Search With Instructions": "搜尋與操作說明",
  Loading: "載入中",
  "Error And Retry": "錯誤與重試",
  "All Tokens": "所有變數",
  Spacing: "間距",
  Surfaces: "表面",
  Dialog: "對話框",
  Typography: "字體排版",
  Controls: "互動設定",
};

export function catalogLabel(locale: unknown, label: string): string {
  return catalogLocale(locale) === "en" ? label : (labels[label] ?? label);
}

# 元件組合指南

## 附說明的欄位

標籤持續顯示，說明浮窗只放補充資訊。將原始輸入框搬入控制項插槽以保留表單行為，移除欄位時呼叫 `help.destroy()`。

```ts
import { createFieldRow, mountInfoPopover } from "@ccxp-lite/ui";

const help = mountInfoPopover(doc, "請輸入您的學號或帳號。", "帳號格式");
const row = createFieldRow(doc, {
  fieldId: originalInput.id,
  labelText: "帳號",
  columnCount: 1,
  accessory: help.element,
});
row.controlSlot.append(originalInput);
// 將 row.element 加入表單表格，並登記 help.destroy 以便清理。
```

## 附說明的搜尋

使用 `createSidebarSearch` 並提供無障礙名稱。以 `mountInfoPopoverContent` 加入補充說明，必要指引持續顯示。控制器負責篩選結果。

## 確認

使用 `createRemovePinnedDialog`，提供清楚的標題、操作後果，以及「取消」搭配「確認」或「移除」。開啟時聚焦「取消」，處理 Escape 與背景點擊、限制焦點範圍，關閉後還原焦點。功能控制器先完成驗證，待使用者確認後才送出。

## 載入中、空白與錯誤

`createSkeletonStack` 搭配載入狀態與 `aria-busy`。以 `createEmptyState` 說明空白結果及下一步。錯誤提供具體原因，必要時加入「重試」。請求與重試留在功能控制器。

## 樣式

```ts
import "@ccxp-lite/tokens/tokens.css";
import "@ccxp-lite/ui/styles.css";
```

每個 iframe 文件都須安裝樣式。以程式套用設計變數：

```ts
import { applyTokens } from "@ccxp-lite/tokens";
applyTokens(frameDocument.documentElement);
```

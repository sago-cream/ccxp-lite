# 元件組合指南

**組合範例／元件組合** 中的互動範例由正式使用的元件庫建立，資料與回呼僅供展示。在 CCXP 頁面組合元件時，請遵循下列職責分工。

## 附說明的欄位

以 `createFieldRow` 建立標籤與控制項插槽，並以 `mountInfoPopover` 提供簡短說明。說明收合時仍保留可見標籤。適配器將原始輸入框搬入插槽，保留名稱、值、表單關聯與事件監聽器。移除視圖時，一併清理說明浮窗。

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
// 將 row.element 加入既有表單表格，並登記 help.destroy 以便清理。
```

## 附操作說明的搜尋工具列

使用 `createSidebarSearch`，並提供在地化的無障礙名稱。透過 `mountInfoPopoverContent` 在旁邊放置補充說明；必要的操作指引應持續顯示。控制器負責篩選與結果管理，原始語言切換連結則由頁面適配器搬移。

## 送出前確認

共用視圖提供標題、說明，以及次要／主要或危險操作。相容入口名為 `createRemovePinnedDialog`；工讀紀錄也使用它，搭配主要操作與功能模組提供的內容。在具體使用情境需要新契約之前，保留此 API。

控制器在正確的文件中掛載視圖，將焦點放到「取消」，處理 Escape、背景點擊與取消操作，限制鍵盤焦點範圍，還原啟動控制項的焦點，並釋放事件監聽器。確認動作才呼叫所屬功能，單純呈現視圖不會發出請求。

工讀日期應使用經過平日篩選與重複檢查的有效計畫。保留日期／時間欄位、Arial 數字樣式，以及筆數下方的 12px 間距。不要在元件庫或 Storybook 中重寫批次處理或驗證演算法。

## 載入中、空白與錯誤

以 `createSkeletonStack` 建立佔位畫面，搭配可讀的載入狀態，並在更新中的區域設定 `aria-busy`。以 `createEmptyState` 呈現空白結果與下一步。錯誤須有具體說明，必要時提供次要的「重試」操作。重試、逾時、導覽目標與請求取消，都留在目的頁面的控制器中。

「錯誤與重試」範例使用展示用回呼，真正的目的頁面導覽行為由封裝擴充功能測試涵蓋。

## 套用設計變數

```ts
import "@ccxp-lite/tokens/tokens.css";
import "@ccxp-lite/ui/styles.css";
```

對於框架或其他文件，請在該文件安裝樣式，或套用相同的產生變數對照表：

```ts
import { applyTokens } from "@ccxp-lite/tokens";
applyTokens(frameDocument.documentElement);
```

在 `packages/tokens/src/index.ts` 新增值，執行 `bun run design:build` 重新產生資源，並檢查受影響的範例。擴充功能會自動使用傳統腳本橋接，不要在未經打包的內容腳本中加入 ESM 匯入。

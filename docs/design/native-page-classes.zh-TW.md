# 原生 CCXP 頁面 classes

以 ccxpLite 的 tokens、字級及紫色互動語言為基礎。匯入 `@ccxp-lite/ui/interactive-page.css` 與共用 token 樣式，並在一般互動頁的容器套用 `ccxp-ui`。原生部署將此 CSS 包入 `/ccxp/INQUIRE/sa/portal/ui.css`；擴充套件不預設載入。頁面樣式只作用於此容器；不會自動重設原系統或列印文件。

| Class                 | 用途／使用情境                                            |
| --------------------- | --------------------------------------------------------- |
| `ccxp-ui`             | 明確啟用共用 tokens、字型、顏色與 box sizing              |
| `ccxp-page`           | 置中頁面、960px 最大寬度、手機縮小內距                    |
| `ccxp-stack`          | 垂直排列區塊，間距 24px                                   |
| `ccxp-row`            | 可換行的水平控制列，間距 12px                             |
| `ccxp-grid`           | 桌面雙欄、600px 以下單欄；子項可縮小                      |
| `ccxp-panel`          | 有結構邊框的白底區塊，桌面 24px／手機 16px 內距           |
| `ccxp-title`          | 頁面標題，沿用 26px／700 token                            |
| `ccxp-copy`           | 一般說明文，移除預設 margin 並允許長字串換行              |
| `ccxp-muted`          | 次要文字顏色；可與其他 class 組合                         |
| `ccxp-caption`        | 14px 補充說明，例如欄位提示                               |
| `ccxp-field`          | 標籤、控制項與提示的垂直群組，間距 8px                    |
| `ccxp-label`          | 欄位標籤字重；搭配原生 `label`／`for`                     |
| `ccxp-control`        | input／select／textarea，至少 44px 高，保留原生語意與焦點 |
| `ccxp-button`         | 次要按鈕或動作連結，至少 44px 高                          |
| `ccxp-button-primary` | 與 `ccxp-button` 合用，主要動作的紫色填色                 |
| `ccxp-link`           | 內文連結與可見的鍵盤焦點                                  |
| `ccxp-notice`         | 提示或狀態的淺灰背景；語意由 HTML 的 role 決定            |
| `ccxp-error`          | 錯誤文字；同時寫出原因，不能僅靠顏色                      |

```html
<main class="ccxp-ui">
  <div class="ccxp-page ccxp-stack">
    <h1 class="ccxp-title">頁面標題</h1>
    <form class="ccxp-panel ccxp-stack">
      <div class="ccxp-field">
        <label for="note" class="ccxp-label">說明</label>
        <textarea id="note" class="ccxp-control"></textarea>
      </div>
      <button class="ccxp-button ccxp-button-primary">送出</button>
    </form>
  </div>
</main>
```

來源是 `packages/ui/styles/interactive-page.css`；tokens 在 `packages/tokens/src/index.ts`。原生 CCXP 改版以 `介面建議` 作為完整使用範例。主機適配、登入驗證、資料驗證與送出處理留在使用端程式。

範例載入同一份樣式，支援目錄的語言及裝置尺寸控制；沒有後端連線或送出處理。

只在已檢視的一般互動頁啟用。列印、簽名、送件與行政文件保留原字型、間距、表格與分頁，不載入此樣式，不加入 `ccxp-ui`。

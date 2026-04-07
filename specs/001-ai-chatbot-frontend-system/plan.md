# Plan — 震南官網 AI 客服聊天機器人前端系統

**Feature Branch**: `001-ai-chatbot-frontend-system`
**Created**: 2026-04-01
**Status**: Draft
**Based on**: spec.md v1 + design.md v1
**Scope**: 前台聊天 Widget + 後台管理介面（不含 auth / login / RBAC）

---

## 1. 計畫目標

本 `plan.md` 的任務是將 `spec.md` 定義的完整產品範圍，依據 `design.md` 的技術設計決策，整理成一份**可被單人開發者按序推進的實作計畫**。

### 1.1 承接關係

| 文件 | 角色 |
|------|------|
| `spec.md` | 定義「做什麼」：產品功能範圍、驗收條件、使用者需求 |
| `design.md` | 定義「怎麼做」：元件切分、狀態設計、API 整合、技術架構 |
| `plan.md`（本文件） | 定義「何時做、順序與分工」：Phase 排序、工作流拆分、依賴管理 |
| `task.md`（待生成） | 定義「每個可執行的工作單元」：具體可 check-off 的任務清單 |

### 1.2 本期明確排除

以下項目**一律不納入本期 plan**，即使 spec 中有殘留描述：

- 後台登入頁、auth store、middleware / route guard
- Token / refresh cookie / session 驗證
- Login 測試（E2E / 單元）
- RBAC、多角色、權限控制
- 帳號管理 / SSO / LDAP

本期後台視為**無需驗證即可直接存取的管理介面**，聚焦在支援 AI 客服營運。

---

## 2. 規劃前提與範圍

### 2.1 技術棧固定

| 類別 | 技術 |
|------|------|
| 框架 | Nuxt 4 |
| UI 元件庫 | Nuxt UI v3（基於 Reka UI + Tailwind CSS） |
| 樣式系統 | Tailwind CSS v4 |
| 語言 | TypeScript |
| 狀態管理 | Pinia |
| 表單驗證 | vee-validate |
| 串流 | SSE（預設，TBD：後端可能為 WebSocket） |
| 測試 | Vitest + Vue Test Utils + Playwright |

### 2.2 完整功能範圍（本 plan 全覆蓋）

**前台**：Widget 收合展開、多輪對話、串流回覆、快捷提問、留資表單、轉人工、機密攔截、Prompt Injection 攔截、低信心度提示、回覆失敗／timeout／retry／interrupted、降級模式、滿意度回饋、多語系（繁中／英文，預留第三語系）、RWD、Session 恢復、事件追蹤埋點

**後台**：Dashboard、知識庫管理（含版本歷史、批次匯入）、對話紀錄查詢（含匯出）、Lead 管理、Ticket 管理、意圖／模板管理、快捷提問管理、Widget 設定（含即時預覽）、稽核事件、回饋紀錄、營運報表

### 2.3 開發前提

- 以**單人開發者**可獨立推進為前提，不做需要跨人協作才能進行的並行切割
- 後端 API 在各 Phase 實作期間可能尚未就緒，前端需搭配 mock 策略推進
- Phase 1 以前端可獨立驗證的互動邏輯為主，不強依賴後端 API
- Widget Config API、Chat Session API、Streaming API 為高優先依賴，需優先與後端確認

---

## 3. 實作策略

### 3.1 整體節奏：先前台、後後台、先核心、後擴充

```
Phase 0（基礎建設）
  → Phase 1（前台聊天核心 MVP）
    → Phase 2（前台進階互動完整化）
      → Phase 3（後台基礎頁面）
        → Phase 4（後台內容管理）
          → Phase 5（後台維運工具）
            → Phase 6（品質、埋點、無障礙、多語系完整化）
```

### 3.2 高風險 / 高依賴項目優先

以下項目會影響後續多個功能的實作，應在對應 Phase 最早期解決：

1. **SSE / WebSocket 串流接入** → 影響整個前台聊天體驗，Phase 1 必須確認
2. **Widget Config API 契約** → 影響 Launcher 狀態文案、快捷提問、降級觸發邏輯
3. **Chat Session API** → 影響 Session 建立、恢復、歷史訊息載入
4. **API client 基礎建設** → 所有 API 呼叫的基礎，Phase 0 完成
5. **Shared types / VM types** → 影響元件與 composable 的型別安全，Phase 0 建立基礎

### 3.3 Mock 策略

在後端 API 未就緒期間，前端採用以下 mock 策略：

- **MSW（Mock Service Worker）** 或 **Nuxt `devtools` + $fetch mock**：在開發環境模擬 API 回應
- **Streaming mock**：以 `ReadableStream` 模擬 SSE 串流，每 100ms 推送一個 token
- 各 Phase 的 mock 資料定義為 TypeScript typed fixtures，後期直接替換為真實 API 呼叫

### 3.4 元件驅動開發

優先建立元件，再組合至頁面。元件本身應可獨立渲染，不依賴全局 store 注入（除非必要）。訊息型元件（`UserMessageItem`、`AiStreamingItem` 等）以本地 fixture / demo page 驗證，不引入 Storybook 作為本期正式工具鏈。

---

## 4. 工作流拆分（Workstreams）

本計畫拆為以下 8 條工作流，各 Phase 中的任務會從對應工作流取出：

| # | 工作流 | 說明 |
|---|--------|------|
| WS-A | 技術基礎建設 | Nuxt 設定、API client、types、plugins、主題設定 |
| WS-B | 前台 Widget Shell | ChatWidget、ChatLauncher、ChatPanel 收合展開動畫、layout 骨架 |
| WS-C | 前台聊天核心 | Session、訊息列表、串流回覆、狀態機、Message Renderer |
| WS-D | 前台進階互動 | 留資表單、轉人工、回饋、降級、低信心度、語系切換 |
| WS-E | 後台基礎 | Admin layout、共用元件、Dashboard、對話紀錄、Lead/Ticket |
| WS-F | 後台內容管理 | 知識庫、意圖/模板、快捷提問、Widget 設定 |
| WS-G | 後台維運工具 | 稽核事件、回饋紀錄、營運報表 |
| WS-H | 品質與完整化 | i18n 英文、埋點、無障礙、效能、E2E 補全、RWD 細化 |

---

## 5. Phase / Milestone 規劃

### Phase 0 — 技術基礎建設

**目標**：建立整個專案可運作的技術地基，確保後續所有 Phase 都有共用的骨架可依附。

**範圍**：

- Nuxt 4 專案結構確認（feature-based 目錄、`app/features/chat/`、`app/features/admin/`）
- `app.config.ts` 設定（Nuxt UI 主題 token、品牌色）
- `tailwind.config.ts` 延伸色設定（`chat-user-bubble`、`chat-ai-bubble`、`intercept-warning` 等）
- `nuxt.config.ts` 基礎設定（runtimeConfig、i18n module、modules）
- API client（`services/api/client.ts`）：`$fetch` 封裝、`baseURL`、全域 5xx interceptor、timeout 設定
- Shared TypeScript types（`types/chat.ts`、`types/admin.ts`、`types/api.ts`）：ChatMessageVM、WidgetConfigVM、ChatSession、Lead、Ticket、KnowledgeEntry、Intent、AuditEvent、Feedback 等 VM type 基礎定義
- Pinia 初始化，store 骨架（`useChatWidgetStore`、`useChatSessionStore`、`useWidgetConfigStore`）
- Nuxt UI plugin 確認可用，`useToast()` 可運作
- vee-validate plugin 設定
- i18n 基礎（`zh-TW/common.json`、`en/common.json`，預留 locale key 結構）
- `layouts/default.vue`（極簡前台 layout）、`layouts/admin.vue`（後台 layout 骨架）
- `error.vue`（404 / 500 全域錯誤頁）
- `utils/format.ts`（時間格式、數字格式）、`utils/markdown.ts`（Markdown 渲染基礎）
- `utils/errorReporter.ts`（未知錯誤上報骨架，TBD：Sentry 或後端 API）
- `utils/analytics.ts`（事件追蹤骨架，send to backend API）
- Nuxt Charts 安裝與驗證（安裝 `nuxt-charts`，確認折線圖與圓餅圖可於 Nuxt 4 專案中正常渲染）
- 後台「進入後台」入口按鈕（前台 `/` 頁面右上角低調 `UButton variant="ghost"`，`navigateTo('/admin/dashboard')`）

**主要輸出**：可運作的 Nuxt 4 專案骨架、所有共用基礎設施建立完成、主題設定完成

**依賴關係**：無前置依賴，本 Phase 是所有後續 Phase 的基礎

**完成定義（DoD）**：
- [ ] `npm run dev` 可正常啟動，`/` 與 `/admin/dashboard` 路由可存取
- [ ] Nuxt UI 元件（`UButton`、`UInput`）可正常渲染
- [ ] Nuxt Charts 可在 Nuxt 4 專案中渲染折線圖與圓餅圖（無 console 錯誤）
- [ ] Pinia store 初始化無錯誤
- [ ] API client 可呼叫，mock endpoint 可回傳資料
- [ ] TypeScript 編譯無錯誤
- [ ] i18n 基礎文案可顯示（繁中）

---

### Phase 1 — 前台聊天 Widget 核心 MVP

**目標**：完成前台 Widget 從收合到展開、完整多輪對話、串流回覆、快捷提問、攔截提示、Session 建立與恢復、降級模式的**可互動 MVP**。

**範圍**：

**Widget Shell（WS-B）**：
- `ChatWidget` 根元件（管理 isOpen 狀態）
- `ChatLauncher`（桌機膠囊版、手機 FAB）
- `ChatPanel`（展開態容器，桌機 panel、手機全螢幕）
- 展開 / 收合動畫（CSS transition）
- Widget 布局五區：Header、Info Bar、Message Area、Quick Replies Bar、Input Bar + Disclaimer
- RWD 斷點邏輯（桌機 ≥ 1024px、平板 768–1023px、手機 < 768px）

**聊天核心（WS-C）**：
- `useChatSession` composable：session 建立、localStorage 讀寫、session 恢復流程（帶 token 呼叫歷史 API → 過期清除重建）
- `useChat` composable：訊息發送、訊息列表管理、快捷提問點擊
- `useStreaming` composable：SSE 接收、token append、狀態機（idle→sending→streaming→completed／error／timeout／interrupted）、30 秒 timeout 計時器
- `services/streaming.ts`：SSE 連線管理、ReadableStream 解析
- `services/api/chat.ts`：createSession、getHistory、sendMessage（streaming）
- Message Renderer：依 `type` 渲染對應元件（`UserMessageItem`、`AiMessageItem`、`AiStreamingItem`、`SystemErrorItem`、`SystemTimeoutItem`、`SystemInterceptedItem`、`SystemLowConfidenceItem`、`SystemFallbackItem`）
- 自動 scroll to bottom（新訊息追加後）
- 重新開始對話（清除 session、重建）

**Widget Config（WS-C）**：
- `useWidgetConfig` composable：每次使用者**展開 Widget 時**重新呼叫 Widget Config API，不快取至 localStorage，確保後台修改文案後使用者下次展開即可看到最新設定
- 若 API 失敗，fallback 至靜態 i18n 文案（`i18n/locales/zh-TW/common.json`）
- `useWidgetConfigStore`：儲存 config、isOnline、isLoaded（僅作為本次展開期間的記憶體快取）
- 降級模式觸發邏輯（config API 失敗 / status: offline）

**元件清單**：
- `ChatWidget`、`ChatLauncher`、`ChatPanel`、`ChatHeader`、`ChatInfoBar`、`ChatMessageArea`、`ChatQuickReplies`、`ChatInputBar`、`ChatDisclaimer`
- `UserMessageItem`、`AiMessageItem`（含 Markdown 渲染）、`AiStreamingItem`（含打字游標動畫）
- `SystemInterceptedItem`（機密攔截 / Prompt Injection，含鎖頭 / 盾牌 icon）
- `SystemLowConfidenceItem`（低信心度提示條）
- `SystemErrorItem`（錯誤 + 重試）、`SystemTimeoutItem`（timeout + 重試）
- `SystemFallbackItem`（降級模式提示）

**主要輸出**：可互動的前台 Widget MVP，多輪對話 + 串流回覆可驗證（搭配 mock）

**依賴關係**：依賴 Phase 0 完成（API client、types、store 骨架、layout）

**待確認項（TBD）**：
- 後端串流協議：SSE 或 WebSocket？（影響 `useStreaming` 的實作方式）
- Widget Config API 回應結構（影響 Widget 初始化 fallback 邏輯）
- Chat Session API 回應結構與 session 過期機制（401 或 404？）

**完成定義（DoD）**：
- [ ] Widget 可從收合點擊展開，動畫流暢
- [ ] 桌機 panel / 手機全螢幕布局正確
- [ ] 可建立 session，歡迎訊息與快捷提問顯示
- [ ] 點擊快捷提問送出訊息，串流回覆逐字顯示
- [ ] 多輪對話可連續問答
- [ ] 頁面重整後 session 恢復，歷史訊息顯示
- [ ] 攔截訊息（機密 / Injection）以專屬樣式呈現
- [ ] 低信心度提示條出現於 AI 回覆底部
- [ ] 回覆失敗顯示 `SystemErrorItem`，點擊重試可重送
- [ ] Timeout 30 秒後顯示 `SystemTimeoutItem`
- [ ] 降級模式啟動：Launcher 灰色狀態燈、Panel 顯示 fallback 提示、Input Bar disabled
- [ ] 降級模式下聯絡捷徑仍可點擊

---

### Phase 2 — 前台進階互動完整化

**目標**：補完前台所有互動功能，包含留資表單、轉人工、滿意度回饋、語系切換、埋點基礎。

**範圍**：

**留資表單（WS-D）**：
- `LeadFormCard` 元件（inline 卡片，嵌入訊息流）
- 表單欄位：姓名（必填）、公司名稱（必填）、電話 or Email（至少一個必填）、詢問品項（選填）、備註（選填）
- vee-validate 驗證規則（必填、email 格式、phone 格式）
- 提交流程：`POST /api/chat/lead` → 成功轉確認訊息 → `leadFormState.submitted = true`
- 提交失敗 inline 錯誤提示
- 同一 session 已提交後再次觸發顯示「已登記」提示，不重複渲染表單

**轉人工（WS-D）**：
- `HandoffStatusCard` 元件（inline 卡片，四種狀態：requested / waiting / connected / unavailable）
- `useHandoff` composable：發送轉接請求、管理 handoffState
- 轉接狀態更新：polling `GET /api/chat/handoff/status`（10 秒間隔，TBD：或改 SSE event）
- unavailable 狀態：顯示服務時間（Widget Config 提供）+ 引導留資按鈕
- 轉接成功後 Input Bar 鎖定

**滿意度回饋（WS-D）**：
- `MessageFeedback` 元件（讚 / 倒讚 icon button，附於每則 `ai-text` 訊息底部）
- 倒讚後展開原因選填（TBD：chips 選項清單，預設 4–5 個選項）
- `useFeedback` composable：fire-and-forget API 呼叫，失敗 console 記錄
- `services/api/chat.ts` 補充：`POST /api/chat/feedback`

**語系切換（WS-D）**：
- Header 語系切換下拉（`UDropdownMenu`，選項：繁體中文 / English）
- 切換後 i18n locale 更新，所有靜態文案即時更新
- 語系偏好儲存至 `localStorage.chat_locale`，初始化時讀取
- i18n 英文文案補完（`i18n/locales/en/` 完整填充）
- 快捷提問文案依語系從 Widget Config 取對應語系版本

**埋點基礎（WS-D / WS-H）**：
- `utils/analytics.ts` 補完事件定義與發送邏輯：
  - Widget 開啟 / 收合
  - 快捷提問點擊（含文案）
  - 訊息送出
  - 留資表單開啟 / 提交
  - 轉人工觸發
  - 滿意度回饋（讚 / 倒讚）
  - 語系切換
- 埋點 API：`POST /api/analytics/event`

**主要輸出**：前台功能 100% 完整（含留資、轉人工、回饋、多語系、埋點）

**依賴關係**：依賴 Phase 1 完成（Widget Shell、聊天核心）

**待確認項（TBD）**：
- 轉人工狀態更新：polling 或 SSE event？
- 滿意度倒讚原因：chips 選項內容（後端 / 甲方提供）
- 埋點後端 API 端點規格

**完成定義（DoD）**：
- [ ] 留資表單在訊息流中正確觸發並渲染
- [ ] 表單驗證規則完整（必填、email / phone 格式）
- [ ] 提交成功轉為確認訊息，同 session 再次觸發顯示「已登記」
- [ ] 轉人工流程四種狀態正確切換
- [ ] 無客服時顯示服務時間 + 引導留資
- [ ] 每則 AI 回覆底部顯示讚 / 倒讚，點擊後狀態變色
- [ ] 倒讚原因選填可送出
- [ ] 語系切換後所有文案即時更新（繁中 / 英文）
- [ ] 快捷提問依語系顯示對應文案
- [ ] 埋點事件在對應操作時被觸發並送出

---

### Phase 3 — 後台基礎頁面

**目標**：建立後台管理介面的骨架，完成 Dashboard、對話紀錄、Lead 管理、Ticket 管理，讓管理者可立即開始使用核心查詢功能。

**範圍**：

**後台共用基礎（WS-E）**：
- `layouts/admin.vue` 完整實作：左側導覽列（含各功能頁連結）、頂部 topbar、主內容區
- 左側導覽列：Dashboard、知識庫、對話紀錄、Lead、Ticket、意圖/模板、快捷提問、Widget 設定、稽核事件、回饋紀錄、報表
- 共用元件：`AdminDataTable`（`UTable` + `UPagination` 封裝）、`AdminFilterBar`、`AdminStatCard`、`AppEmptyState`、`AppErrorState`、`AppStatusBadge`（`UBadge` 封裝）、`AppModal`（二次確認）

**Dashboard（WS-E）**：
- 統計卡片（5 個）：今日對話數、本月對話數、AI 自助解答率、待處理 Ticket 數、本月新增 Lead 數
- 對話量趨勢折線圖（近 7 / 30 天，tab 切換）— `AdminLineChart`（Nuxt Charts 折線圖）
- 意圖分布圓餅圖（近 30 天）— `AdminPieChart`（Nuxt Charts 圓餅圖）
- 最新 5 筆稽核事件列表（可點擊跳至詳情）
- 空狀態處理（無資料時卡片顯示 0，圖表顯示空狀態插圖）
- `services/api/admin/dashboard.ts`：統計資料 API

**對話紀錄查詢（WS-E）**：
- 列表頁：Session ID、開始時間、對話輪數、語系、狀態、是否有回饋
- 篩選：時間範圍（日期選擇器）、語系、狀態、是否含機密攔截、是否含 Prompt Injection
- 關鍵字搜尋（debounce 300ms）
- 分頁（每頁 20 筆）、排序
- 匯出 CSV（`POST /api/admin/conversations/export`，後端非同步，前端輪詢下載連結或直接下載）
- 詳情頁：Session 基本資訊、對話訊息列表（`ConversationViewer`，模擬聊天氣泡樣式）、信心度 / 攔截事件標記、回饋摘要
- `services/api/admin/conversations.ts`

**Lead 管理（WS-E）**：
- 列表頁：姓名、公司、聯絡方式、詢問品項、建立時間、狀態
- 篩選：狀態、時間範圍；搜尋：姓名 / 公司關鍵字
- 詳情頁：完整留資資訊、關聯對話連結、狀態切換下拉、備註欄位（管理者內部備註）
- `services/api/admin/leads.ts`

**Ticket 管理（WS-E）**：
- 列表頁：Ticket ID、主旨、建立時間、狀態（開啟 / 進行中 / 已關閉）、優先級
- 篩選：狀態、優先級、時間範圍
- 詳情頁：問題描述、關聯對話連結、處理紀錄（時間軸）、狀態變更 + 備註輸入
- 本期狀態流：開啟 → 進行中 → 已關閉（不做 escalation）
- `services/api/admin/tickets.ts`

**主要輸出**：可用的後台管理骨架，Dashboard + 對話紀錄 + Lead + Ticket 頁面完整可操作

**依賴關係**：依賴 Phase 0（admin layout 骨架、shared types）；Phase 3 與 Phase 2 可部分並行（前後台互不依賴）

**待確認項（TBD）**：
- Dashboard 統計資料 API 結構（欄位定義）
- 對話紀錄匯出：後端同步返回 CSV 或非同步？
- Lead 指派業務：本期後台顯示狀態即可，不整合 CRM

**完成定義（DoD）**：
- [ ] 後台 admin layout 正確（左側導覽列、topbar、內容區）
- [ ] Dashboard 5 個統計卡片正確顯示
- [ ] Dashboard 圖表（折線圖 / 圓餅圖）正確渲染
- [ ] 對話紀錄列表可依條件篩選，分頁正確
- [ ] 對話詳情頁以氣泡樣式顯示完整對話，攔截事件有標記
- [ ] Lead 列表可篩選，詳情頁狀態可更新
- [ ] Ticket 列表可篩選，詳情頁可更新狀態並新增備註
- [ ] 所有列表頁空狀態 / 錯誤狀態 / 維護狀態正確呈現

---

### Phase 4 — 後台內容管理

**目標**：完成後台四個核心內容管理模組，讓管理者可維護 AI 客服的知識庫、意圖、快捷提問與 Widget 設定。

**範圍**：

**知識庫管理（WS-F）**：
- 列表頁：標題、分類、狀態（草稿 / 已發佈 / 已停用）、最後更新時間、操作
- 篩選：分類、狀態、關鍵字搜尋（debounce）
- 刪除二次確認 Modal（`AppModal`）
- 新增 / 編輯頁：標題（必填）、分類選擇（含新增分類入口）、狀態切換、內容編輯器（TBD：Markdown 編輯器 + 預覽切換）
- 版本歷史：`USlideover` 側抽屜，列出歷次修改時間，可展開差異比對，可還原（還原需確認彈窗）
- 批次匯入 Modal（`KnowledgeImportModal`）：格式說明 + 範本下載、上傳後顯示成功 / 失敗結果
- `services/api/admin/knowledge.ts`（CRUD + 版本 API + 匯入 API）

**意圖 / 模板管理（WS-F）**：
- 列表頁：意圖名稱、觸發關鍵字（前 3 個 + tooltip）、啟用狀態 toggle（`USwitch`）、操作
- 新增 / 編輯：以 `USlideover` 側抽屜形式（意圖名稱、觸發關鍵字 tag input、優先級、回覆模板內容）
- 意圖預覽：輸入測試問句，呼叫 API 預覽匹配與回覆模板
- `services/api/admin/intents.ts`

**快捷提問管理（WS-F）**：
- 頁面左右兩欄：左側編輯列表（拖曳排序 `QuickReplyDragList`）、右側即時預覽（顯示前台 Quick Replies Bar 外觀）
- 拖曳排序（`@vueuse/core` 的 `useSortable` 或其他拖曳方案）
- 每筆可展開編輯：繁中文案、英文文案、啟用狀態
- 新增 / 刪除（刪除需確認）
- 拖曳完成後立即呼叫排序更新 API
- `services/api/admin/quickReplies.ts`

**Widget 設定管理（WS-F）**：
- 頁面左右兩欄：左側設定表單、右側 Widget 即時預覽（`WidgetSettingsPreview`）
- 設定項目：CTA 文案（繁中 / 英文）、歡迎訊息（繁中 / 英文）、頁尾免責聲明（繁中 / 英文）、AI 標記文字、線上 / 繁忙 / 離線 / 降級文案、聯絡捷徑（最多 3 組）
- 修改任何欄位後右側預覽即時更新（純前端 local 預覽，不呼叫 API）
- 確認後「儲存設定」送出 `PUT /api/admin/widget-settings`
- `services/api/admin/widgetSettings.ts`

**主要輸出**：後台四個內容管理模組完整可操作，Widget 設定可即時預覽並儲存

**依賴關係**：依賴 Phase 3（admin 共用元件、`AdminDataTable`、`AppModal`）；知識庫版本功能需後端版本 API 支援

**待確認項（TBD）**：
- 知識庫編輯器：Markdown 編輯器選型（推薦 `@nuxtjs/mdc` 或 `CodeMirror`，TBD）
- 批次匯入格式：CSV / JSON 欄位定義、單次上限筆數（需後端提供範本）
- 快捷提問拖曳：排序 API 接受排序後的 ID 陣列

**完成定義（DoD）**：
- [ ] 知識庫列表、新增、編輯、刪除流程完整
- [ ] 版本歷史可查詢，可還原至指定版本
- [ ] 批次匯入 CSV / JSON，成功 / 失敗結果正確顯示
- [ ] 意圖列表可啟用 / 停用，新增 / 編輯以側抽屜操作
- [ ] 快捷提問可拖曳排序，順序更新 API 正確呼叫
- [ ] Widget 設定表單修改後右側預覽即時更新
- [ ] 所有設定儲存後重新載入頁面資料一致

---

### Phase 5 — 後台維運工具

**目標**：完成稽核事件、回饋紀錄、營運報表三個維運模組，讓管理者可稽核 AI 行為並分析運營趨勢。

**範圍**：

**稽核事件（WS-G）**：
- 列表頁：事件時間、事件類型（機密攔截 / Prompt Injection / 轉人工 / 低信心度）、Session ID、嚴重程度（高 / 中 / 低）
- 篩選：事件類型、時間範圍、嚴重程度
- 匯出 CSV
- 詳情頁：事件基本資訊、觸發上下文對話（`ConversationViewer` 子集）、系統判斷依據摘要
- `AuditEventBadge` 元件（事件類型 + 嚴重程度配色）
- `services/api/admin/audit.ts`

**回饋紀錄（WS-G）**：
- 列表頁：時間、Session ID、訊息摘要（前 50 字）、回饋類型（讚 / 倒讚 + 顏色標記）、倒讚原因
- 篩選：回饋類型、時間範圍
- 點擊 Session ID 跳至對話詳情頁
- `services/api/admin/feedback.ts`

**營運報表（WS-G）**：
- 頁面頂部時間範圍切換（近 7 天 / 近 30 天 / 自訂日期區間）
- 5 個報表圖表區塊（全部使用 Nuxt Charts，以 `defineAsyncComponent` 懶加載）：
  1. AI 自助解答率趨勢（`AdminLineChart`，Nuxt Charts 折線圖）
  2. 意圖分布圓餅圖（`AdminPieChart`，Nuxt Charts 圓餅圖）
  3. 滿意度趨勢（讚 vs 倒讚，`AdminLineChart` 雙線）
  4. Lead 與 Ticket 建立數趨勢（`AdminLineChart` 雙線）
  5. 機密攔截 / Prompt Injection 次數趨勢（`AdminLineChart` 雙線）
- 各區塊獨立匯出 CSV
- 圖表元件以 `defineAsyncComponent` 懶加載（Nuxt Charts 僅在報表頁載入，不影響其他頁面初始 bundle）
- `services/api/admin/reports.ts`

**主要輸出**：三個維運模組完整可查詢，報表圖表正確渲染

**依賴關係**：依賴 Phase 3 共用元件（`AdminDataTable`、`AdminFilterBar`、`AdminLineChart`、`AdminPieChart`）；報表需後端 API 提供對應時間範圍資料

**待確認項（TBD）**：
- 報表 API 資料粒度（日為單位 or 可調整？）
- 匯出全部報表（ZIP 壓縮多份 CSV）：本期實作或 TBD？

**完成定義（DoD）**：
- [ ] 稽核事件列表可依類型 / 嚴重程度篩選，詳情頁顯示上下文
- [ ] 稽核事件匯出 CSV 可下載
- [ ] 回饋紀錄列表可依類型篩選，可跳至對話詳情
- [ ] 報表頁五個圖表均可依時間範圍顯示正確資料
- [ ] 各圖表區塊可獨立匯出 CSV
- [ ] 報表圖表元件懶加載，不影響頁面初始載入速度

---

### Phase 6 — 品質完整化、RWD 細化、無障礙

**目標**：補完各 Phase 遺留的品質細節、完整化 RWD、無障礙標準、效能優化，確保系統達到 spec 驗收條件。

**範圍（WS-H）**：

**RWD 細化**：
- 前台 Widget 三個斷點（桌機 / 平板 / 手機）像素精修
- 手機版全螢幕展開 + 底部 Input Bar sticky 固定
- 平板版 panel 寬度（340px）
- 後台 admin layout 在 1024–1279px 寬度下左側導覽列收合行為（TBD）

**無障礙（Accessibility）**：
- 前台 Widget：`role="dialog"`（聊天面板）、`role="log"`（訊息列表）、`aria-live` 通知新訊息
- 所有 icon button `aria-label` 補全
- 鍵盤操作：Tab 導覽、Enter 送出、Escape 收合 Widget
- 色彩對比審核（4.5:1 最低標準）
- 後台：表單 label/input 綁定、Modal focus trap、`UTable` aria-label

**效能優化**：
- 前台 Widget 以 `defineAsyncComponent` 懶加載
- Widget 初始 bundle 目標審核（≤ 100KB gzipped）
- 報表圖表元件懶加載確認
- Nuxt `<Suspense>` + skeleton 在後台列表頁確認實作

**i18n 第三語系預留**：
- 確認 locale key 結構完整（zh-TW / en 均已定義的 key，第三語系可直接新增 JSON 檔案）
- 不填充實際翻譯，僅確認 fallback 機制正常

**主要輸出**：符合 spec 所有驗收條件的最終品質版本

**依賴關係**：依賴所有前置 Phase 完成（需要功能完整後才能做全面品質審核）

**完成定義（DoD）**：
- [ ] 前台 Widget 在 Chrome / Safari / Firefox 最新版 + iOS Safari 14+ + Android Chrome 90+ 正常顯示
- [ ] 三個斷點 RWD 布局符合設計規範
- [ ] 前台 Widget 鍵盤完全可操作
- [ ] 前台 Widget 色彩對比 ≥ 4.5:1 通過審核
- [ ] Widget 初始 bundle gzipped 大小符合目標
- [ ] i18n fallback 機制驗證（第三語系缺少翻譯時顯示繁中預設）

---

## 6. 模組級實作計畫

### 6.1 Chat Widget Shell

**目的**：提供 Widget 的物理外殼與動畫，管理收合 / 展開狀態，不含業務邏輯。

**關鍵設計**：
- 以 `position: fixed; bottom: 24px; right: 24px; z-index: 9999` 掛載
- Launcher 與 ChatPanel 以同一個根元件（`ChatWidget`）控制 `isOpen` toggle
- 展開動畫：桌機 panel 右側滑入，手機 full-screen slide-up
- `useChatWidgetStore.isOpen` 驅動 Launcher 隱藏 / Panel 顯示
- 手機版展開時對 `<body>` 加 `overflow: hidden`，收合時還原

**元件**：`ChatWidget`、`ChatLauncher`、`ChatPanel`、`ChatHeader`、`ChatInfoBar`、`ChatInputBar`、`ChatDisclaimer`

---

### 6.2 Chat Session / Message Renderer

**目的**：管理 session 生命週期與完整訊息列表，提供 type-driven 的訊息渲染框架。

**關鍵設計**：
- `useChatSession`：建立 session → 存 localStorage → 恢復 session（帶 token 呼叫歷史 API）→ 過期清除重建
- `useChatSessionStore`：持有 messages 陣列、sessionToken、sessionStatus、各 domain 狀態
- Message Renderer：`ChatMessageArea` 依每則訊息的 `type` 欄位渲染對應元件，無巨大 `v-if` 堆疊
- 訊息 VM type（`ChatMessageVM`）含：`id`、`type`、`content`、`timestamp`、`metadata`（含信心度、攔截標記等）
- 新訊息追加後自動 scroll to bottom（`nextTick` + `scrollIntoView` 或 `scrollTop`）

**元件**：所有訊息型元件（`UserMessageItem`、`AiMessageItem`、`AiStreamingItem`、所有 `System*Item`、`MessageFeedback`）

---

### 6.3 Streaming / Retry / Timeout / Interrupted

**目的**：以有限狀態機管理 AI 回覆的完整生命週期，確保任何情況都有明確 UI 回饋。

**關鍵設計**：
- `useStreaming`：持有 `streamingState`（idle / sending / streaming / completed / error / timeout / interrupted / cancelled）
- 狀態轉換由訊息列表 + streaming state 共同驅動 UI 渲染
- 30 秒 timeout timer 在 `sending` 時啟動，收到第一個 token 時清除
- 重試邏輯：不重建 session，以同一 session ID 重送最後一則 user 訊息
- `services/streaming.ts`：封裝 SSE 連線邏輯，對外暴露 `startStream(sessionToken, message)` 與 `cancelStream()` 介面
- 若後端改為 WebSocket，僅修改 `services/streaming.ts` 內部，`useStreaming` 介面不變

---

### 6.4 Lead Form / Handoff / Feedback

**目的**：三個前台進階互動，各有獨立的 composable 管理狀態，不污染主聊天流程。

**Lead Form（`useLeadForm`）**：
- 持有表單資料、驗證狀態、提交狀態（idle / submitting / submitted / error）
- 提交後設 `leadFormState.submitted = true`，儲存至 `useChatSessionStore`，阻止重複提交
- `LeadFormCard` 從 composable 取狀態，純 UI 展示

**Handoff（`useHandoff`）**：
- 持有 `handoffState`（normal / requested / waiting / connected / unavailable）
- 發送轉接請求後啟動 polling（10 秒間隔），直到狀態為 connected / unavailable 停止
- 轉接後清除 polling timer

**Feedback（`useFeedback`）**：
- 維護每則訊息的回饋狀態（`Map<messageId, FeedbackState>`）
- Fire-and-forget：API 呼叫失敗只 console.error，不影響 UI 狀態

---

### 6.5 Widget Config / i18n

**目的**：Widget 文案、快捷提問、聯絡捷徑等設定的載入、管理與 i18n 整合。

**關鍵設計**：
- `useWidgetConfig`：使用者**每次展開 Widget 時**呼叫 `GET /api/widget/config`，不快取至 localStorage，確保後台修改文案後使用者下次展開即可看到最新設定；將結果存入 `useWidgetConfigStore` 作為本次展開期間的記憶體快取
- Config API 失敗 fallback：使用靜態 i18n 文案（`i18n/locales/zh-TW/common.json`）
- 動態文案覆蓋：Widget Config 的文案覆蓋靜態 i18n（用 `computed` 優先取 config，fallback 取 i18n）
- 快捷提問完全由 Config API 提供（不在靜態 i18n 中定義），Config 失敗時不顯示快捷提問
- 降級模式：Config 的 `status: 'offline'` 觸發降級，每 60 秒重新探測

---

### 6.6 Admin Dashboard

**目的**：提供管理者即時掌握 AI 客服系統運作狀況的一覽頁面。

**關鍵設計**：
- 頁面載入時一次呼叫 Dashboard API 取得所有統計資料
- 5 個 `AdminStatCard`（`UCard` 封裝，含數字、標題、連結）
- `AdminLineChart` / `AdminPieChart`：以 **Nuxt Charts** 實作（折線圖與圓餅圖），維持 Nuxt 生態一致性
- 最新 5 筆稽核事件 inline 列表（可點擊跳至 `/admin/audit/:id`）
- 空狀態：無資料時卡片顯示 0，圖表顯示 `AppEmptyState`

---

### 6.7 Knowledge Management

**目的**：最複雜的後台模組，涵蓋 CRUD、版本歷史、批次匯入。

**關鍵設計**：
- 列表頁以 `AdminDataTable` 顯示，篩選條件存 URL query string（支援分頁書籤）
- 編輯頁：Markdown 編輯器（TBD 選型）+ 預覽切換（`@nuxtjs/mdc` 或 `CodeMirror`）
- 版本歷史：`USlideover` 側抽屜，列出版本列表，點開可查看該版本 diff（TBD：diff 格式由後端提供或前端計算）
- 還原操作：`AppModal` 二次確認後呼叫 `POST /api/admin/knowledge/:id/restore/:versionId`
- 批次匯入：`KnowledgeImportModal` 處理 multipart/form-data 上傳，解析後端回傳的 `{ success, failed, errors }` 結果

---

### 6.8 Conversations（對話紀錄）

**目的**：提供管理者查詢、篩選、查看完整對話的工具，同時支援 CSV 匯出。

**關鍵設計**：
- 篩選條件存 URL query string，支援頁面書籤
- `ConversationViewer`：後台詳情頁使用，模擬前台聊天氣泡樣式（共用訊息型元件的樣式，但去除 Feedback 按鈕）
- 攔截事件在訊息氣泡上以 `AuditEventBadge` 標記
- 匯出：呼叫匯出 API，後端返回下載 URL，前端 `window.location.href` 觸發下載（同步）或輪詢（非同步，TBD）

---

### 6.9 Leads / Tickets

**目的**：Lead 與 Ticket 的輕量列表管理，狀態更新為主要操作。

**關鍵設計**：
- 兩者結構相似，頁面邏輯可共用 `useAdminList` composable 骨架
- Lead 詳情：狀態下拉（`USelect`）+ 備註（`UTextarea`）+ 儲存，關聯對話連結
- Ticket 詳情：處理紀錄以時間軸樣式（`UTimeline` 或自訂），每次備註更新追加為新紀錄
- 刪除操作（若有）需二次確認

---

### 6.10 Intents / Templates

**目的**：讓管理者定義 AI 意圖與回覆模板，支援測試預覽。

**關鍵設計**：
- 列表頁 `USwitch` 即時切換啟用狀態（直接呼叫 PATCH API）
- 新增 / 編輯以 `USlideover` 形式，避免跳頁
- 觸發關鍵字使用 tag-input 元件（Nuxt UI 目前無內建，需自製或使用第三方）
- 意圖預覽：在 slideover 底部提供測試輸入框，呼叫 `POST /api/admin/intents/preview`

---

### 6.11 Quick Replies

**目的**：拖曳排序的快捷提問管理，並同步預覽前台效果。

**關鍵設計**：
- 拖曳排序使用 `@vueuse/integrations/useSortable` 或 `vue-draggable-plus`（TBD）
- 拖曳結束後 debounce 500ms 後呼叫排序 API（傳送 ID 陣列）
- 右側預覽面板：`WidgetSettingsPreview` 的快捷提問部分，pure UI，不呼叫 API

---

### 6.12 Widget Settings Preview

**目的**：即時預覽 Widget 設定變更，降低管理者出錯風險。

**關鍵設計**：
- 右側 `WidgetSettingsPreview` 為縮小版 Chat Panel，直接使用前台元件（`ChatLauncher`、`ChatPanel`），傳入 local 設定資料
- 設定表單任何欄位變更 → `computed widgetPreviewConfig` 更新 → 預覽 reactive 更新
- 「儲存設定」按鈕：提交成功後顯示 toast；失敗顯示欄位 inline 錯誤

---

### 6.13 Audit / Feedback / Reports

**目的**：三個唯讀查詢頁面（稽核為主讀，報表含匯出），需要後端資料粒度確認。

**關鍵設計**：
- 稽核事件嚴重程度以 `AppStatusBadge` 配色（高 → red、中 → yellow、低 → gray）
- 報表圖表使用 **Nuxt Charts**，以 `defineAsyncComponent` 懶加載，確保 Nuxt Charts 僅在報表頁載入，不影響其他頁面初始 bundle
- 時間範圍 picker：`AppDateRangePicker` 封裝 `UDatePicker`，切換後重新 fetch 所有圖表資料
- 匯出：各圖表獨立匯出 CSV，按鈕附 loading 狀態

---

## 7. 技術基礎建設計畫

### 7.1 Nuxt 4 專案結構確認

以 feature-based 目錄為主，關鍵目錄：

```
app/
  features/
    chat/           ← 前台聊天 domain
      components/
      composables/
      stores/
    admin/          ← 後台 admin domain
      components/
      composables/
      stores/
  components/       ← 跨 domain 共用 UI 元件
  composables/      ← 跨 domain 共用 composables
  layouts/
  pages/
  plugins/
  services/
    api/
      client.ts
      chat.ts
      admin/
    streaming.ts
  stores/
  types/
  utils/
i18n/locales/
```

### 7.2 app.config.ts — Nuxt UI 主題設定

於 `app/app.config.ts` 統一設定品牌色 token：
- 主色（primary）：震南品牌色（待設計稿確認色票）
- 語意色：success、warning、error
- 聊天氣泡背景色延伸至 `tailwind.config.ts` 的 `theme.extend.colors`（如 `chat-user-bubble`、`chat-ai-bubble`、`intercept-warning`）

### 7.3 API Client（`services/api/client.ts`）

- 使用 Nuxt 4 的 `$fetch` 封裝為 `createApiClient()`
- `baseURL`：`useRuntimeConfig().public.apiBase`
- 前台 chat 請求自動附加 session token（`X-Session-Token` header）
- 後台 admin 請求本期直接發送，不附加 Authorization
- 全域 5xx interceptor：顯示 `useToast()` 錯誤 toast
- 15 秒 timeout（串流請求不走此 timeout，由 `useStreaming` 自行計時）
- 環境變數：僅 `NUXT_PUBLIC_API_BASE` 暴露給前端

### 7.4 Shared Types / View Models（`types/`）

Phase 0 需先定義以下 VM types 骨架（後期依 API 契約補充）：

| Type | 說明 |
|------|------|
| `ChatMessageVM` | 前台訊息（type、content、timestamp、metadata） |
| `WidgetConfigVM` | Widget 設定（文案、捷徑、快捷提問、status） |
| `ChatSessionVM` | Session（token、status、locale） |
| `LeadFormData` | 留資表單資料 |
| `KnowledgeEntryVM` | 知識庫條目（列表 + 編輯） |
| `ConversationSummaryVM` | 對話列表項目 |
| `ConversationDetailVM` | 對話詳情 |
| `LeadVM` / `TicketVM` | Lead / Ticket |
| `IntentVM` | 意圖定義 |
| `QuickReplyVM` | 快捷提問 |
| `AuditEventVM` | 稽核事件 |
| `FeedbackVM` | 回饋紀錄 |
| `DashboardStatsVM` | Dashboard 統計資料 |
| `ReportDataVM` | 報表資料（時序列表） |

### 7.5 Pinia Stores

| Store | 用途 |
|-------|------|
| `useChatWidgetStore` | isOpen、mode（normal/fallback）、locale |
| `useChatSessionStore` | sessionToken、sessionStatus、messages、streamingState、handoffState、leadFormState、quickRepliesVisible |
| `useWidgetConfigStore` | config、isLoaded、isOnline |

後台無需 store，所有 page-local 狀態在 `setup()` 中管理。

### 7.6 Nuxt UI 設定確認

- `@nuxt/ui` module 載入確認
- `app.config.ts` 主題 token 設定完成
- `useToast()` 可在任意元件呼叫
- `UModal`、`USlideover` portal 掛載位置確認（不影響 Widget z-index）

### 7.7 i18n 基礎（`@nuxtjs/i18n`）

- module 設定：`defaultLocale: 'zh-TW'`，`locales: ['zh-TW', 'en']`
- lazy loading：各 locale JSON 分開打包
- locale key 結構：`common`、`chat`（前台）、`admin`（後台）三個命名空間
- 第三語系預留：新增第三個 locale 時只需新增 JSON 檔案，不需修改程式碼

### 7.8 測試基礎設施

- **Vitest** 設定（`vitest.config.ts`）：包含 `@vue/test-utils`、`@nuxt/test-utils/vitest`
- **Playwright** 設定（`playwright.config.ts`）：baseURL 指向開發環境，三個 viewport（1280px、768px、375px）
- **Mock API**：Phase 0 建立 mock fixtures 目錄（`tests/fixtures/`），含各 API 回應的 typed mock 資料
- **Test helpers**：共用的 test utilities（如 `mountWithPlugins()`）

---

## 8. 依賴與風險

### 8.1 外部依賴項

| # | 依賴項 | 影響模組 | 狀態 |
|---|--------|---------|------|
| D1 | 後端串流協議（SSE or WebSocket） | `useStreaming`、`services/streaming.ts` | TBD，Phase 1 前需確認 |
| D2 | Widget Config API 回應結構 | `useWidgetConfig`、降級觸發邏輯 | TBD，Phase 1 前需確認 |
| D3 | Chat Session API 結構與過期機制 | `useChatSession`，Session 恢復流程 | TBD，Phase 1 前需確認 |
| D4 | Lead / Handoff API 結構 | `useLeadForm`、`useHandoff` | TBD，Phase 2 前需確認 |
| D5 | 知識庫版本 diff API 格式 | `KnowledgeEditor` 版本歷史展示 | TBD，Phase 4 前需確認 |
| D6 | 批次匯入 CSV / JSON 欄位定義與上限 | `KnowledgeImportModal` | TBD，Phase 4 前需確認 |
| D7 | Ticket 狀態流是否簡化 | Ticket 詳情頁操作 | 本期預設：開啟→進行中→已關閉 |
| D8 | 報表 API 資料粒度（日 / 週 / 月） | `AdminLineChart`、`AdminPieChart` | TBD，Phase 5 前需確認 |
| D9 | 滿意度倒讚原因：chips 選項內容 | `MessageFeedback` UI | TBD，Phase 2 前需確認 |
| D10 | 埋點後端 API 端點規格 | `utils/analytics.ts` | TBD，Phase 2 前需確認 |
| D11 | 轉人工狀態更新：polling 或 SSE event | `useHandoff` 實作 | TBD，Phase 2 前需確認 |
| D12 | Widget 設計稿色票與字型 | `app.config.ts` 主題設定 | TBD，Phase 0 前需取得 |

### 8.2 技術風險

| # | 風險 | 影響 | 緩解策略 |
|---|------|------|---------|
| R1 | 後端改為 WebSocket 而非 SSE | `useStreaming` 需大改 | 將串流 transport 封裝在 `services/streaming.ts`，對外介面不變，替換成本可控 |
| R2 | Widget Config API 失敗 → 無法初始化 | Widget 完全無法使用 | 靜態 i18n fallback + 降級模式，確保最低可用 |
| R3 | Markdown 編輯器選型影響知識庫實作 | Phase 4 延期 | Phase 4 初期先用 `UTextarea` 純文字模式，Markdown editor 視選型確認後再替換 |
| R4 | Nuxt Charts 與 Nuxt 4 / Nuxt UI 整合相容性 | 報表頁或 Dashboard 圖表渲染異常 | Phase 0 安裝後立即建立最小驗證頁，確認折線圖與圓餅圖可正常渲染；圖表元件以 `defineAsyncComponent` 懶加載，隔離潛在相容問題 |
| R5 | Session token 並發問題（多 Tab 同時操作） | 串流訊息衝突 | 同一 localStorage session token，多 Tab 實際上共用，設計上接受此行為，後期可考慮 BroadcastChannel 通知 |
| R6 | 後台 API 尚未就緒，前端無法驗證 | 各 Phase 阻塞 | 全面 mock 策略（MSW 或 Nuxt devtools），讓前端可獨立開發驗證 |

---

## 9. 測試規劃

### 9.1 測試策略原則

- **P0 測試**（Phase 1 開始即建立）：核心串流狀態機、session 建立恢復、留資表單驗證
- **P1 測試**（Phase 2-3 補齊）：前台進階互動、後台 CRUD 基本流程
- **P2 測試**（Phase 4-5 補齊）：後台複雜功能（版本還原、批次匯入、拖曳排序）
- 每個模組交付時需同步提交對應測試

### 9.2 單元測試（Vitest，P0 優先）

| 模組 | 測試重點 | Priority |
|------|---------|---------|
| `useStreaming` | 串流狀態機各狀態轉換（idle→sending→streaming→completed/error/timeout/interrupted）| P0 |
| `useChatSession` | session 建立、恢復、過期清除、重建 | P0 |
| `useLeadForm` | 表單驗證規則（必填、email/phone 格式、重複提交保護） | P0 |
| `useHandoff` | handoffState 流轉 | P1 |
| `useFeedback` | fire-and-forget 邏輯、回饋狀態切換 | P1 |
| `useWidgetConfig` | Config 載入、fallback 至靜態文案、降級觸發 | P0 |
| `utils/format.ts` | 相對時間格式（剛剛 / N 分鐘前 / 今天 HH:MM）、字數計算 | P0 |
| `utils/markdown.ts` | Markdown 渲染輸出（粗體、條列、連結）| P1 |

### 9.3 元件測試（Vitest + Vue Test Utils，P1）

| 元件 | 測試重點 |
|------|---------|
| `ChatLauncher` | 狀態燈顏色（綠 / 黃 / 灰）、降級文案、點擊展開 |
| `ChatInputBar` | 字數限制（500）、Enter 送出、送出中鎖定（disabled）、取消按鈕 |
| `AiStreamingItem` | token append 動畫、打字游標顯示 |
| `SystemInterceptedItem` | 機密 vs Injection 不同文案 / icon |
| `LeadFormCard` | 表單驗證 UI 反饋、提交狀態、已提交狀態顯示 |
| `HandoffStatusCard` | 四種狀態正確渲染（requested / waiting / connected / unavailable）|
| `MessageFeedback` | 讚 / 倒讚點擊狀態、已回饋後可切換 |
| `AppStatusBadge` | 各狀態對應色彩語意正確 |

### 9.4 E2E 核心旅程（Playwright）

**前台 P0 旅程**（Phase 1 完成後建立）：

| 旅程 | 測試步驟 |
|------|---------|
| 開啟 Widget 並完成首次問答 | 點擊 Launcher → 展開 Panel → 看到歡迎訊息 → 送出訊息 → AI 串流回覆完成 |
| 快捷提問點擊流程 | 展開 Widget → 點擊「產品查詢」→ 訊息送出 → AI 回覆顯示 → 快捷提問列收起 |
| Session 恢復 | 完成一次對話 → 重整頁面 → 展開 Widget → 歷史訊息顯示 |
| 降級模式 | Mock AI 服務不可用 → 展開 Widget → fallback 提示顯示 → 聯絡捷徑可點擊 |

**前台 P1 旅程**（Phase 2 完成後建立）：

| 旅程 | 測試步驟 |
|------|---------|
| 留資表單完整流程 | AI 觸發留資 → 填寫表單 → 送出成功 → 確認訊息 → 再次觸發顯示「已登記」|
| 重新開始對話 | 點擊重置 → 對話清空 → 歡迎訊息重新出現 |
| 語系切換 | 切換至 English → 所有文案更新 → 快捷提問文案更新 |

**後台 P1 旅程**（Phase 3 完成後建立）：

| 旅程 | 測試步驟 |
|------|---------|
| 知識庫新增 / 編輯 | 進入知識庫列表 → 點擊新增 → 填寫內容 → 儲存 → 列表出現新條目 |
| 知識庫版本還原 | 編輯已有條目 → 修改儲存 → 進入版本歷史 → 選擇舊版本還原 → 內容恢復 |
| 對話紀錄查詢 | 進入對話紀錄 → 篩選時間範圍 → 點擊 Session → 詳情顯示完整對話 |
| Lead 狀態更新 | 進入 Lead 列表 → 點擊 Lead → 修改狀態 → 儲存 → 列表狀態更新 |

### 9.5 可延後的測試

以下測試優先度較低，可在 Phase 6 補全：
- 後台報表圖表渲染正確性（E2E 截圖比對）
- 多語系文案全覆蓋快照測試
- 完整 RWD 三個 viewport 快照比對
- 無障礙 axe-core 自動掃描
- Streaming Interrupted 狀態（網路模擬）

---

## 10. 產出物規劃

| Phase | 主要產出物 |
|-------|----------|
| Phase 0 | Nuxt 4 專案骨架、API client、共用 types、主題設定、i18n 基礎、前台「進入後台」入口按鈕 |
| Phase 1 | 前台 Widget 可互動 MVP（收合展開、多輪對話、串流回覆、快捷提問、攔截提示、Session 恢復、降級模式） |
| Phase 2 | 前台留資表單、轉人工流程、滿意度回饋、語系切換（繁中 / 英文）、埋點基礎 |
| Phase 3 | 後台 admin layout、Dashboard、對話紀錄查詢（含詳情）、Lead 管理、Ticket 管理 |
| Phase 4 | 知識庫管理（含版本歷史、批次匯入）、意圖 / 模板管理、快捷提問管理（含拖曳）、Widget 設定（含即時預覽） |
| Phase 5 | 稽核事件查詢（含詳情）、回饋紀錄、營運報表（5 個圖表 + 匯出） |
| Phase 6 | RWD 精修、無障礙完善、效能優化、i18n 第三語系接口確認、E2E 補全 |

---

## 11. Definition of Done

以下條件全部達成，代表本期前端系統依 spec / design 完整交付：

### 前台 Widget

- [ ] Widget 收合 / 展開狀態正確，動畫流暢，三個 RWD 斷點布局符合設計規範
- [ ] 建立聊天 Session，歡迎訊息與快捷提問正確顯示
- [ ] 多輪對話可連續問答，頁面重整後 Session 恢復，歷史訊息顯示
- [ ] 快捷提問點擊觸發訊息發送，點擊後快捷提問列收起
- [ ] AI 串流回覆逐字顯示，動畫流暢，串流完成後 Markdown 正確渲染
- [ ] 回覆失敗 / Timeout / Interrupted 均有明確 UI 提示，重試機制可用
- [ ] 機密攔截 / Prompt Injection 顯示正確專屬樣式提示
- [ ] 低信心度提示條在對應 AI 回覆底部出現
- [ ] 降級模式正確觸發，聯絡捷徑與留資入口仍可用，每 60 秒重探服務狀態
- [ ] 留資表單驗證完整，成功提交後轉確認訊息，同 session 不重複提交
- [ ] 轉人工四種狀態正確流轉，非服務時間顯示服務時間 + 引導留資
- [ ] 每則 AI 回覆可點讚 / 倒讚，倒讚可填原因，回饋結果送出後端
- [ ] 繁體中文 / 英文語系切換正確套用所有前台文案（含快捷提問）
- [ ] 所有追蹤事件（開啟、快捷提問點擊、送出訊息、留資、轉人工、回饋、語系切換）正確觸發並送出

### 後台管理介面

- [ ] 後台無需驗證即可直接存取（`/admin/dashboard`、所有子路由）
- [ ] 前台「進入後台」按鈕正確導向 `/admin/dashboard`
- [ ] Dashboard 5 個統計卡片與 2 個圖表正確顯示
- [ ] 知識庫 CRUD 完整，版本歷史可查詢差異並還原，批次匯入顯示成功 / 失敗結果
- [ ] 對話紀錄可依條件篩選、查看詳情（含攔截標記）、匯出 CSV
- [ ] Lead / Ticket 可查看詳情並更新狀態
- [ ] 意圖 / 模板可 CRUD，可啟用 / 停用，可預覽意圖匹配
- [ ] 快捷提問可拖曳排序，順序正確更新
- [ ] Widget 設定修改後即時預覽面板正確反映，儲存後生效
- [ ] 稽核事件可依類型 / 嚴重程度篩選，詳情頁顯示上下文
- [ ] 回饋紀錄可依類型篩選，可跳至對話詳情
- [ ] 營運報表 5 個圖表均可依時間範圍顯示並匯出 CSV
- [ ] 所有列表頁空狀態 / 錯誤狀態 / 503 維護狀態正確呈現

### 安全性與穩定性

- [ ] 前端 bundle 中不含任何 OpenAI API Key、後端機密設定
- [ ] 前台 Prompt Injection 攔截：後端攔截後前端正確顯示專屬提示
- [ ] Widget 在 AI 服務模擬故障時降級模式正確啟動
- [ ] Streaming Timeout 30 秒無回應後顯示 `SystemTimeoutItem`

### 測試覆蓋

- [ ] P0 單元測試（`useStreaming`、`useChatSession`、`useLeadForm`、`useWidgetConfig`、`utils/format`）通過
- [ ] P0 E2E 前台核心旅程（首次問答、Session 恢復、降級模式）通過
- [ ] P1 後台 E2E 旅程（知識庫 CRUD、對話查詢、Lead 狀態更新）通過
- [ ] TypeScript 編譯無錯誤，`npm run build` 成功

---

*本 `plan.md` 覆蓋 `spec.md` 的完整功能範圍，Phase 標示為實作優先順序而非範圍縮減。後續 `task.md` 應依本文件的 Phase 順序、各模組描述及 DoD 生成可執行的工作單元，無需再詢問範圍邊界。*

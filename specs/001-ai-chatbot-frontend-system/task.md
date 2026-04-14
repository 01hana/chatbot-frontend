# Tasks — 震南官網 AI 客服聊天機器人前端系統

**Feature Branch**：`001-ai-chatbot-frontend-system`
**建立日期**：2026-04-01
**依據**：`spec.md`（最新）、`design.md`（最新）、`plan.md`（最新）
**開發模式**：單人開發，依序執行

---

> ## 🔒 拍板決策摘要（Finalized Decisions）
>
> 以下為已確認之設計決策，所有 Task 描述均以此為準：
>
> 1. **SSE 為官方串流方案**：`useStreaming`、`services/streaming.ts` 均採 `fetch + ReadableStream`；無 `EventSource`，無 WebSocket fallback；取消串流以 `AbortController.abort()` 實現，無 DELETE 端點
> 2. **sessionToken 以 path parameter 傳入**：儲存於 `localStorage` key `chat_session_token`；所有 session-scoped API 透過路徑 `/api/v1/chat/sessions/:sessionToken/...` 傳入；不以 `X-Session-Token` header 作為正式 contract
> 3. **Widget Config API 為強依賴**：`GET /api/v1/widget/config`；`status`（`online|offline|degraded`）、`welcomeMessage`、`quickReplies`、`disclaimer`、`fallbackMessage` 均為多語系物件（`Record<string, string>`）；`status: 'offline'` 或 `status: 'degraded'` 或 API 失敗均觸發降級模式
> 4. **Dashboard 本期納入**：`services/api/admin/dashboard.ts` 本期建立；`AdminStatCard` 統計卡片（對話數、Lead 數、Ticket 數、常見意圖、轉人工原因、最新稽核事件）、`AdminLineChart`、`AdminPieChart` 本期實作；路由 `/admin/dashboard`
> 5. **Feedback API 本期正式串接**：`POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback`，payload `{ value: 'up'|'down', reason? }`；`useFeedback.ts` 呼叫 API，fire-and-forget；`services/api/admin/feedback.ts` 提供後台查詢
> 6. **Handoff 簡化**：無 polling；`POST /api/v1/chat/sessions/:sessionToken/handoff` → 後端回傳 `{ accepted, action, leadId?, ticketId?, message }` → 前端顯示靜態「已轉交專人協助」；`HandoffStatusCard` 多狀態延後
> 7. **Ticket 本期納入**：`services/api/admin/tickets.ts` 本期建立；列表 + 詳情 + 狀態流（`open | in_progress | resolved | closed` 四態）+ 狀態更新（`PATCH .../status`）+ 備註新增（`POST .../notes`）
> 8. **Lead Form 欄位**：`name` 必填、`email` 必填、`company` 選填、`phone` 選填、`message` 選填；`language` 由前端自動帶入當前語系（`zh-TW` / `en`），不需訪客填寫；欄位名稱為 `message`（非 `備註` / `notes` / `inquiry`）
> 9. **不做 Email 通知**：本期不實作任何 Email 通知功能（Ticket 指派通知、Lead 提醒等均延後）
> 10. **API 路徑統一 `/api/v1/...`**：`/api/v1/chat/sessions/:sessionToken/...`、`/api/v1/widget/config`、`/api/v1/admin/...`

---

## 使用說明

- 任務依 Phase → Workstream → 實作順序排列
- 每個任務完成後勾選 `[ ]` → `[x]`
- **依賴**欄位列出必須先完成的任務編號；「無」代表可直接開始
- **完成條件**為可驗證的具體標準，不是抽象目標
- 本期一律不包含 auth / login / middleware / RBAC 相關任務

---

## Phase 0 — 技術基礎建設

> **目標**：建立所有後續 Phase 可依附的技術地基

### WS-A 技術基礎建設

---

- [x] **T-001** 確認 Nuxt 4 專案目錄結構並建立 feature-based 骨架
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：無
  - **實作內容**：
    - 確認 `app/` 目錄下已有標準 Nuxt 4 結構
    - 建立 `app/features/chat/` 目錄，並在下方新增 `components/`、`composables/`、`stores/` 子目錄
    - 建立 `app/features/admin/` 目錄，並在下方新增 `components/`、`composables/`、`stores/` 子目錄
    - 建立 `app/services/` 目錄，並在下方新增 `api/`（含 `admin/` 子目錄）、`streaming.ts` 占位檔
    - 建立 `app/types/` 目錄（`chat.ts`、`admin.ts`、`api.ts` 占位檔）
    - 建立 `tests/fixtures/` 目錄（mock 資料存放處）
    - 確認 `npm run dev` 可正常啟動
  - **完成條件**：`npm run dev` 啟動無錯誤；上述目錄結構存在；TypeScript 編譯無錯誤

---

- [x] **T-002** 設定 `nuxt.config.ts` 基礎模組與環境變數
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-001
  - **實作內容**：
    - 確認 `@nuxt/ui`、`@nuxtjs/i18n`、`@pinia/nuxt` 已在 `modules` 中載入
    - 設定 `runtimeConfig.public.apiBase`，對應環境變數 `NUXT_PUBLIC_API_BASE`
    - 設定 i18n module：`defaultLocale: 'zh-TW'`，`locales: ['zh-TW', 'en']`，`lazy: true`，`langDir: '../i18n/locales'`
    - 確認無多餘 server-side 環境變數暴露至前端
  - **完成條件**：`nuxt.config.ts` 包含正確的 modules 與 runtimeConfig；`useRuntimeConfig().public.apiBase` 在元件中可讀取

---

- [x] **T-003** 設定 `app.config.ts` Nuxt UI 主題 token 與品牌色
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-002
  - **實作內容**：
    - 在 `app/app.config.ts` 設定 Nuxt UI 主題 primary 色、success / warning / error 語意色（待設計稿色票確認前先填入合理預設值）
    - 建立集中管理的聊天與攔截顏色策略，包含：`chat-user-bubble`、`chat-ai-bubble`、`intercept-warning`、`intercept-injection`
    - 確認前台聊天相關元件可透過共用方式使用上述顏色，而不是在各元件內重複寫死色碼
    - 確認 `UButton`、`UInput`、`UCard` 在頁面上可正常渲染並套用主題色
  - **完成條件**：`UButton` / `UInput` 渲染時套用品牌主色；自訂 Tailwind 色類在樣式中可使用；TypeScript 編譯無錯誤

---

- [x] **T-004** 建立 API Client（`services/api/client.ts`）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-002
  - **實作內容**：
    - 封裝 `$fetch` 為 `createApiClient()`，設定 `baseURL` 從 `runtimeConfig.public.apiBase` 讀取
    - 前台 chat 請求：sessionToken 透過 path parameter 傳入（`/api/v1/chat/sessions/:sessionToken/...`），**不附加 `X-Session-Token` header** 作為正式 contract（header 為內部實作細節）
    - 後台 admin 請求：本期直接發送，不附加 Authorization header
    - 全域 5xx 錯誤 interceptor：呼叫 `useToast()` 顯示錯誤 toast
    - 一般請求 15 秒 timeout（串流請求另行處理）
    - 在 `tests/fixtures/` 建立 mock client helper，供測試使用
  - **完成條件**：呼叫 mock endpoint 可回傳資料；5xx 錯誤時顯示 toast；TypeScript 編譯無錯誤

---

- [x] **T-005** 定義 Shared TypeScript VM Types（`types/chat.ts`、`types/admin.ts`、`types/api.ts`）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-001
  - **實作內容**：
    - `types/chat.ts`：定義 `ChatMessageVM`（id、type、content、timestamp、metadata；**另含 `quickReplies?: string[]`（per-message KB chips）與 `rating?: FeedbackValue`（`null | 'up' | 'down'`，Phase 1 本地狀態）**）、`WidgetConfigVM`、`ChatSessionVM`、`LeadFormData`、`FeedbackValue`（`null | 'up' | 'down'`，取代原 `FeedbackState` Map 設計）、`HandoffState`、`StreamingState`（含七種狀態 enum）；**訊息型別 `ChatMessageType` 使用 `'ai'`（非 `'ai-text'`）**
    - `types/admin.ts`：定義 `KnowledgeEntryVM`、`ConversationSummaryVM`、`ConversationDetailVM`、`LeadVM`、`TicketVM`、`IntentVM`、`QuickReplyVM`、`AuditEventVM`、`FeedbackVM`、`DashboardStatsVM`（~~`ReportDataVM` 本期不定義，Reports 延後~~）
    - `types/api.ts`：定義通用 API 回應包裝型別（`ApiResponse<T>`、`PaginatedResponse<T>`）
    - 所有 VM type 均為 TypeScript interface 或 type，有 JSDoc 說明
  - **完成條件**：所有 VM type 可在其他檔案 import 使用；TypeScript 編譯無錯誤；`types/` 下無 `any` 型別

---

- [x] **T-006** 初始化 Pinia Stores 骨架（**四個 store**）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-005
  - **實作內容**：
    - 建立 `app/features/chat/stores/useChatWidgetStore.ts`：state 含 `isOpen: boolean`、`mode: 'normal' | 'fallback'`、`locale: string`
    - 建立 `app/features/chat/stores/useChatSessionStore.ts`：state 含 `sessionToken`、`sessionStatus`、`messages: ChatMessageVM[]`、`streamingState: StreamingState`、`handoffState: HandoffState`、`leadFormState`、`quickRepliesVisible: boolean`
    - 建立 `app/features/chat/stores/useWidgetConfigStore.ts`：state 含 `config: WidgetConfigVM | null`、`isLoaded: boolean`、`isOnline: boolean`
    - **建立 `app/features/chat/stores/useKnowledgeBaseStore.ts`**：Phase 1 暫時模擬後台知識資料庫；含模組層級常數 `KNOWLEDGE_BASE`（14 筆）與 `DEFAULT_RESPONSE`；匯出 `query(input)` 關鍵字比對函式與 `getWelcomeQuickReplies()`；**串接 API 後整個 store 移除**
    - 確認 Pinia plugin 已掛載（`@pinia/nuxt`）
  - **完成條件**：**四個** store 可在元件中 import 使用；store state 初始值正確；TypeScript 型別推導無錯誤; composition 寫法

---

- [x] **T-007** 設定 vee-validate plugin（`plugins/vee-validate.client.ts`）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-002
  - **實作內容**：
  - 確認 `app/plugins/vee-validate.client.ts` 已建立，並完成 vee-validate 驗證規則的全域註冊或共用驗證能力初始化
  - ~~新增自訂規則：`phoneOrEmail`（電話格式或 Email 格式，至少一個）~~ **（已移除：Lead Form 改為 name + email 必填，phone 選填，不再需要 `phoneOrEmail` 自訂規則）**
  - 以前端既有封裝的 Nuxt UI 表單元件為主，不直接依賴 vee-validate 的 `<Form>`、`<Field>`、`<ErrorMessage>` 作為主要畫面組件
  - 確認 `@nuxt/ui` 的 `UForm` 可與既有 `app/components/FormField` 封裝元件整合使用
  - 確認表單元件可接收驗證錯誤訊息、顯示欄位錯誤狀態，並支援後續 Lead Form 等表單場景重用
  - **完成條件**：
    - 在測試元件中，使用 `UForm` 搭配既有封裝的 `FormField` 元件可正確顯示驗證錯誤訊息
    - `name`（必填）、`email`（必填，格式驗證）規則可在各表單中自行定義；無需 `phoneOrEmail` 自訂規則
    - 不需要直接使用 vee-validate 的 `<Form>`、`<Field>`、`<ErrorMessage>` 也能完成表單驗證整合

---

- [x] **T-008** 建立 i18n 基礎文案檔案結構
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-002
  - **實作內容**：
    - 確認 `i18n/locales/zh-TW/` 與 `i18n/locales/en/` 目錄存在
    - 建立 `i18n/locales/zh-TW/common.json`：含 Widget 靜態 fallback 文案（歡迎訊息、CTA、免責聲明、降級提示、錯誤訊息等 key）
    - 建立 `i18n/locales/zh-TW/chat.json`：前台聊天相關文案 key
    - 建立 `i18n/locales/zh-TW/admin.json`：後台介面文案 key（操作按鈕、狀態標籤等）
    - 建立對應的 `i18n/locales/en/common.json`、`en/chat.json`、`en/admin.json`（暫填英文占位文案，Phase 2 補完）
    - 確認 `$t('common.welcome')` 等 key 在元件中可正確顯示
  - **完成條件**：`$t()` 可正確取得繁中文案；切換 locale 至 `en` 時顯示英文占位文案；key 結構完整（三個命名空間）

---

- [x] **T-009** 建立 `layouts/default.vue`（前台極簡 layout）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-003
  - **實作內容**：
    - 建立 `app/layouts/default.vue`：包含 `<slot />`（主內容區），不含 header / footer（Widget 為 fixed 元素）
    - 引入全域 CSS（`assets/css/main.css`）
    - 確認 `<NuxtPage />` 在此 layout 下可正常渲染
  - **完成條件**：`/` 路由使用 `default` layout 渲染；頁面無樣式衝突

---

- [x] **T-010** 建立 `layouts/admin.vue`（後台 layout 骨架）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-003
  - **實作內容**：
    - 建立 `app/layouts/admin.vue`：左側導覽列（`AdminSidebar` 占位元件）、頂部 topbar（`AdminTopbar` 占位元件）、右側主內容區 `<slot />`
    - 整體布局使用 Tailwind `flex`：左側固定寬 240px，右側 `flex-1 overflow-auto`
    - 確認 `/admin/dashboard` 路由使用此 layout（本期後台預設路由為 `/admin/dashboard`，Dashboard 本期納入範圍）
  - **完成條件**：`/admin/dashboard` 渲染時顯示骨架 layout（左側占位導覽、右側內容區）；無 console 錯誤

---

- [x] **T-011** 建立 `error.vue`（全域錯誤頁）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-003
  - **實作內容**：
    - 建立 `app/error.vue`：顯示錯誤代碼（404 / 500）、對應中文說明文案
    - 404 提示「找不到頁面，請確認網址」；500 提示「系統發生錯誤，請稍後再試」
    - 提供「回首頁」按鈕（`UButton`，導向 `/`）
    - 支援 Nuxt `useError()` 取得錯誤資訊
  - **完成條件**：手動觸發 404 路由時顯示 error.vue；500 錯誤時正確顯示對應文案

---

- [x] **T-012** 建立共用工具函式（`utils/format.ts`、`utils/markdown.ts`、`utils/errorReporter.ts`）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-001
  - **實作內容**：
    - `utils/format.ts`：
      - `formatDateTime(date: Date | string | number): string`：以 `zh-TW` locale 的 24 小時制輸出 `HH:mm`（例如 `14:30`），用於所有訊息時間戳顯示
      - `formatRelativeTime(date: Date | string | number): string`：保留實作（剛剛 / N 分鐘前 / 今天 HH:MM / 昨天 HH:MM / YYYY/MM/DD），目前前台訊息時間戳已改用 `formatDateTime`，此函式保留供未來需要相對時間情境使用
      - `formatNumber(n: number): string`：千分位格式（`toLocaleString('zh-TW')`）
      - `truncateText(str: string, maxLen: number): string`：超過 maxLen 時截斷並加「…」
    - `utils/markdown.ts`：`renderMarkdown(content: string): string`（使用輕量 library 如 `marked` 或 `markdown-it`，返回 sanitized HTML）
    - `utils/errorReporter.ts`：`reportError(err, context?)` 骨架（目前只 `console.error`，預留 Sentry 接入點）
    - `utils/analytics.ts`：定義 `AnalyticsEvent` 型別與 `trackEvent(event: AnalyticsEvent)` 骨架（目前只 `console.log`，預留接入點）
  - **完成條件**：`formatDateTime` 可正確輸出 `HH:mm` 24 小時制；`renderMarkdown` 能正確渲染粗體 / 條列 / 連結；`truncateText`、`formatNumber` 邊界案例正確；TypeScript 無錯誤

---

- [x] **T-013** 建立前台首頁 `app/pages/index/index.vue` 與「進入後台」入口按鈕
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-009
  - **實作內容**：
    - 在 `app/pages/index/index.vue`（或 `pages/index.vue`）右上角放置低調的 `UButton variant="ghost" size="sm"` 按鈕，文字「管理後台」
    - 點擊後執行 `navigateTo('/admin/dashboard')`
    - 確認此按鈕在頁面上視覺上不突兀（ghost 樣式、右上角絕對定位）
  - **完成條件**：前台 `/` 頁面右上角顯示「管理後台」按鈕；點擊後成功導向 `/admin/dashboard`

---

- [x] **T-014** 建立測試基礎設施（Vitest + Playwright 設定確認）
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-001
  - **實作內容**：
    - 確認 `vitest.config.ts` 已設定，包含 `@vue/test-utils`、`@nuxt/test-utils/vitest`
    - 確認 `playwright.config.ts` 已設定：`baseURL` 指向開發環境，三個 viewport（1280px、768px、375px）
    - 建立 `tests/fixtures/` 目錄，新增各 API 回應的 typed mock 資料檔（`chatFixtures.ts`、`adminFixtures.ts`）
    - 建立 `tests/helpers/mountWithPlugins.ts`：封裝 `@vue/test-utils` 的 `mount`，自動掛載 Pinia / i18n / Nuxt UI
    - 執行 `npm run test`（Vitest）確認可跑通一個空測試
  - **完成條件**：`npm run test` 執行無設定錯誤；Playwright 基礎設定可執行 `npx playwright test --list` 無錯誤；`mountWithPlugins` helper 可正常 import 使用

---

- [x] **T-015** 安裝並驗證 Nuxt Charts
  - **所屬 Phase**：Phase 0
  - **所屬 Workstream**：WS-A
  - **依賴**：T-002
  - **實作內容**：
    - 安裝 `nuxt-charts`（`npm install nuxt-charts`）
    - 依官方方式將 `nuxt-charts` 加入 `nuxt.config.ts` 的 `modules` 陣列
    - 建立最小驗證頁 `app/pages/admin/ChartsDemo.vue`（或 `tests/fixtures/charts-fixture.vue`），放入以下兩種圖表：
      - 折線圖（Line Chart）：帶入靜態 mock 時序資料（陣列格式）
      - 圓餅圖 / Donut 圖（Pie / Donut Chart）：帶入靜態分類 mock 資料
    - 確認兩種圖表在 `npm run dev` 下可正常渲染，無 console 錯誤
    - 確認 TypeScript 型別推導正確（無 `any` 型別警告）
    - 驗證通過後，驗證頁可保留作為開發參考，或刪除（依專案習慣決定）
  - **完成條件**：折線圖與圓餅圖均可在瀏覽器中正常渲染；無 console 錯誤；TypeScript 編譯通過；`nuxt-charts` 已正確列入 `nuxt.config.ts` modules

---

## Phase 1 — 前台聊天 Widget 核心 MVP

> **目標**：完成從收合到展開的完整 Widget MVP；KB mock 多輪對話、typing indicator、per-message feedback 與 quick-reply chips 可手動驗證；session 恢復與降級模式正常；P0 單元測試與 E2E 旅程通過。真實 SSE 串流待 T-034B 切換

### WS-B 前台 Widget Shell

---

- [x] **T-016** 建立 `ChatWidget` 根元件與展開收合狀態管理
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-B
  - **依賴**：T-006、T-009
  - **實作內容**：
    - 建立 `app/features/chat/components/ChatWidget.vue`：以 `position: fixed; bottom: 24px; right: 24px; z-index: 9999` 掛載
    - 從 `useChatWidgetStore` 讀取 `isOpen` 狀態，控制 Launcher FAB / `ChatPanel` 顯示切換
    - 手機版展開時對 `<body>` 加 `overflow: hidden`，收合時還原
    - 在 `app/pages/index/index.vue` 中引入 `<ChatWidget />`
    - > **[重構]** Launcher FAB 邏輯已直接內嵌於 `ChatWidget.vue`，不再是獨立檔案
  - **完成條件**：`ChatWidget` 在前台頁面右下角固定顯示；`useChatWidgetStore.isOpen` 可切換 Launcher / Panel 顯示；手機版展開時 body 無法滾動

---

- [x] **T-017** ~~建立 `ChatLauncher` 元件~~ → **已合併進 `ChatWidget`**
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-B
  - **依賴**：T-016
  - > **[重構]** `ChatLauncher.vue` 已刪除。Launcher FAB（圓形按鈕 + 點擊開啟）的邏輯移入 `ChatWidget.vue` template 直接實作，無需獨立檔案。

---

- [x] **T-018** 建立 `ChatPanel` 容器元件與展開 / 收合動畫
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-B
  - **依賴**：T-016
  - **實作內容**：
    - 建立 `app/features/chat/components/ChatPanel.vue`
    - 桌機：右側滑入 panel（寬 380px），使用 CSS `transition: transform 0.25s ease`
    - 手機：全螢幕 slide-up，使用 CSS `transition: transform 0.3s ease`
    - 平板（768–1023px）：寬 340px panel
    - Panel 直接包含 Header、Info Bar、Message Area、Quick Replies、Input Bar、Disclaimer 各區塊
  - **完成條件**：桌機展開動畫為右側滑入；手機展開動畫為 slide-up；三個斷點布局寬度正確；Panel 高度在手機全螢幕時覆蓋整個視口

---

- [x] **T-019** ~~建立 `ChatHeader`、`ChatInfoBar`、`ChatDisclaimer` 元件~~ → **已合併進 `ChatPanel`**
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-B
  - **依賴**：T-018
  - > **[重構]** `ChatHeader.vue`、`ChatInfoBar.vue`、`ChatDisclaimer.vue` 三個檔案已刪除。對應的 HTML 結構與邏輯（標題、關閉按鈕、Info Bar 條件顯示、Disclaimer 條件顯示）直接內嵌於 `ChatPanel.vue`，功能完整保留。

---

- [x] **T-020** 建立 `ChatInputBar` 元件
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-B
  - **依賴**：T-018
  - **實作內容**：
    - 建立 `app/features/chat/components/ChatInputBar.vue`
    - 包含 `<textarea>` 或 `UTextarea`：自動高度（`auto-resize`）、最大 500 字、超過字數限制時顯示紅色提示
    - 送出按鈕：送出中（`streamingState === 'streaming' | 'sending'`）時 disabled + loading 動畫
    - 串流進行中顯示「取消」按鈕，點擊後呼叫 `useStreaming.cancelStream()`
    - Enter 送出（Shift+Enter 換行）
    - 降級模式時整個 Input Bar disabled，顯示降級說明文字
  - **完成條件**：輸入 500 字後無法繼續輸入；Enter 送出訊息；串流進行中送出按鈕 disabled；降級模式 Input Bar 全 disabled

---

- [x] **T-021** 建立 `ChatQuickReplies` 元件
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-B
  - **依賴**：T-018
  - **實作內容**：
    - 建立 `app/features/chat/components/ChatQuickReplies.vue`
    - 橫向 chip 排列，來自 `useWidgetConfigStore.config.quickReplies`（依語系顯示對應文案）
    - 點擊後觸發 `useChat.sendMessage(text)`，並設定 `quickRepliesVisible = false`（點擊後收起）
    - Widget Config 失敗時不顯示（`quickReplies` 為空陣列）
    - 串流進行中 chip 全部 disabled
    - **Phase 1 現況說明**：目前每則 AI 回覆下方的 per-message quick-reply chips 已直接內嵌於 `AiMessageItem.vue`（來自 `message.quickReplies`）；`ChatQuickReplies` 作為全域預設 quick-reply 列保留，可視需求於 `ChatPanel` 中使用，不作為主要呈現入口
  - **完成條件**：元件可正確渲染 chips；點擊後送出訊息；Config 失敗時不顯示；串流中 disabled；per-message chips 已於 `AiMessageItem` 獨立顯示

---

### WS-C 前台聊天核心

---

- [x] **T-022** 建立 `services/api/chat.ts`（Chat API 封裝）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-004、T-005
  - **實作內容**：
    - 建立 `app/services/api/chat.ts`，封裝以下 API：
      - `createSession()` → `POST /api/v1/chat/sessions`，回傳 `ChatSessionVM`
      - `getSessionHistory(sessionToken)` → `GET /api/v1/chat/sessions/:sessionToken/history`，回傳 `ChatMessageVM[]`
      - `sendMessage(sessionToken, message)` → 返回 streaming endpoint URL（供 `services/streaming.ts` 使用）；呼叫 `POST /api/v1/chat/sessions/:sessionToken/messages`
      - **注意：不建立 `cancelStream()` 端點方法**，取消串流以 `AbortController.abort()` 實現（見 T-023）
    - 對應的 mock fixtures 建立於 `tests/fixtures/chatFixtures.ts`
  - **完成條件**：呼叫 mock `createSession()` 回傳含 `sessionToken` 的資料；TypeScript 型別正確推導

---

- [x] **T-023** 建立 `services/streaming.ts`（SSE 串流管理）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-022
  - **實作內容**：
    - 建立 `app/services/streaming.ts`，對外暴露：
      - `startStream(sessionToken, message, callbacks)` → 以 `fetch + ReadableStream`（非 `EventSource`）建立 SSE 連線，接收 token 並呼叫 `onToken(token)`；使用 `AbortController` 控制取消
      - `cancelStream()` → 呼叫 `AbortController.abort()`，關閉串流；**無 DELETE HTTP 端點**
    - **本期確認採用 `fetch + ReadableStream`，不使用 `EventSource`，無 WebSocket fallback**；協議固定，不考慮切換
    - 解析後端 SSE 事件格式：
      - `event: token` → `data: {"token":"..."}` → 呼叫 `onToken(token)`
      - `event: done` → `data: {"messageId":"uuid","action":"answer|handoff|fallback|intercepted","sourceReferences":[],"usage":{...}}` → 呼叫 `onDone(payload)`
      - `event: error` → `data: {"code":"string","message":"string"}` → 呼叫 `onError(payload)`
      - `event: timeout` → `data: {"message":"string"}` → 呼叫 `onTimeout()`
      - `event: interrupted` → `data: {"message":"string"}` → 呼叫 `onInterrupted()`
    - 開發環境 mock：`ReadableStream` 模擬 SSE，每 80ms 推送一個 `token` 事件
  - **完成條件**：mock streaming 可逐字 append token；`cancelStream()` 可中止串流；TypeScript 介面完整

---

- [x] **T-024** 實作 `useStreaming` composable（串流狀態機）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-023、T-006
  - **實作內容**：
    - 建立 `app/features/chat/composables/useStreaming.ts`
    - 管理 `streamingState`（idle / sending / streaming / completed / error / timeout / interrupted / cancelled）
    - 狀態轉換邏輯：`sendMessage()` → idle → sending → 收到第一 token → streaming → 串流結束 → completed
    - 30 秒 timeout timer：在 `sending` 狀態啟動，收到第一個 token 時清除；30 秒無回應 → timeout
    - Error 處理：網路錯誤 → error；使用者取消 → cancelled；後端中斷 → interrupted
    - 呼叫 `services/streaming.ts` 的 `startStream()` / `cancelStream()`
    - 將每個 token append 至 `useChatSessionStore.messages` 中最後一則 `AiStreamingItem`
  - **完成條件**：狀態機七種狀態均可觸發；30 秒 timeout 正確觸發；取消後 state 為 cancelled；token append 至正確的訊息物件

---

- [x] **T-025** 實作 `useChatSession` composable（Session 生命週期管理）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-022、T-006
  - **實作內容**：
    - 建立 `app/features/chat/composables/useChatSession.ts`
    - `initSession()` 流程：
      1. 讀取 `localStorage` 中 key 為 `chat_session_token` 的值（sessionToken）
      2. 若存在 → 呼叫 `getSessionHistory(sessionToken)` → `GET /api/v1/chat/sessions/:sessionToken/history` → 成功則恢復歷史訊息
      3. 若 API 回 401/404 → 清除 `localStorage.chat_session_token` → 建立新 session
      4. 若不存在 → 呼叫 `createSession()` → `POST /api/v1/chat/sessions` → 存入 `localStorage.chat_session_token`
    - `clearSession()` → 清除 localStorage（`chat_session_token`）+ 重置 store
    - `restartSession()` → clearSession + initSession
    - 將 sessionToken 存入 `useChatSessionStore`（使用 `sessionToken` 欄位）；後續 session-scoped API 呼叫均以 path parameter 傳入，**不附加 `X-Session-Token` header**
  - **完成條件**：初始化後 `sessionToken` 存在；頁面重整後歷史訊息恢復；session 過期後自動重建；TypeScript 無錯誤

---

- [x] **T-026** 實作 `useWidgetConfig` composable（Widget Config 載入）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-004、T-006
  - **實作內容**：
    - 建立 `app/features/chat/composables/useWidgetConfig.ts`
    - 於每次 `ChatWidget` 展開時（監聽 `useChatWidgetStore.isOpen` 變為 `true`）呼叫 `GET /api/v1/widget/config`（**正式確認之強依賴**）
    - 成功後存入 `useWidgetConfigStore.config`（`status`、`welcomeMessage`、`quickReplies`、`disclaimer`、`fallbackMessage` 均為多語系物件 `Record<string, string>` / `Record<string, string[]>`；`status` 值為 `'online' | 'offline' | 'degraded'`），設定 `isLoaded = true`、`isOnline = (config.status !== 'offline' && config.status !== 'degraded')`
    - 前台元件依 `locale` 取對應語系值（e.g., `config.welcomeMessage[locale] ?? config.welcomeMessage['zh-TW']`）
    - Config API 失敗：fallback 使用靜態 i18n 文案（`$t('common.*')`）；**失敗即觸發降級模式**，不快取至 localStorage
    - Config `status === 'offline'` 或 `status === 'degraded'` 或 API 失敗 → 觸發降級模式（`useChatWidgetStore.setMode('fallback')`）
    - 降級時每 60 秒重新探測（`setInterval`），恢復後退出降級模式
    - 不快取至 localStorage（每次展開重新取得）
  - **完成條件**：每次展開 Widget 時呼叫 `GET /api/v1/widget/config`；API 失敗時直接觸發降級模式並使用 fallback 文案；`status: 'offline'` 或 `status: 'degraded'` 時觸發降級模式；60 秒輪詢在降級時正確執行

---

- [x] **T-027** 實作 `useChat` composable（訊息列表管理 + 送出）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-024、T-025
  - **實作內容**：
    - 建立 `app/features/chat/composables/useChat.ts`
    - `sendMessage(text)` 流程（**Phase 1 Mock Branch**，串接 API 後替換）：
      1. 建立 `UserMessageItem`，append 至 `messages`
      2. 呼叫 `useKnowledgeBaseStore.query(text)` 取得模擬回應
      3. 等待隨機延遲（600–1300ms）模擬網路延遲
      4. append `ai` 型訊息（含 `content`、`quickReplies`、`rating: null`）
    - **原串流管線（startStreaming、AiStreamingItem placeholder）已暫時 comment out**，待 Phase 2 串接 SSE API 後啟用
    - 新增 `rateMessage(messageId, value: FeedbackValue)`：找到對應 `ai` 訊息，切換 `msg.rating`（再次點擊同值則取消，設為 `null`）
    - `clearMessages()` → 清空 store messages 陣列
    - 回傳：`{ messages, streamingState, sendMessage, cancelStream, clearMessages, retryLastMessage, rateMessage }`
  - **完成條件**：送出訊息後 UI 立即顯示使用者氣泡；KB mock 回應正確顯示；`rateMessage` 可切換 `rating` 狀態；`clearMessages` 正確清空

---

- [x] **T-028** 建立 Message Renderer（`ChatMessageArea`）與各訊息型元件
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-027、T-012
  - **實作內容**：
    - 建立 `app/features/chat/components/ChatMessageArea.vue`：`v-for` 遍歷 `messages`，依 `message.type` 透過 component registry map 動態渲染對應元件；轉發 `retry`、`rate`、`quick-reply` 事件至上層
    - **Empty State**（`messages.length === 0`）：顯示 Bot avatar + `useKnowledgeBaseStore.query('hello')` 歡迎訊息（`renderMarkdown` 渲染）+ per-message quick-reply chips（`UButton` outline variant）
    - 新訊息追加後自動 scroll to bottom（`nextTick` + `scrollIntoView`）
    - 建立以下訊息元件：
      - `UserMessageItem.vue`：右側藍色漸層氣泡 + 頭像 + 時間戳（使用 `formatDateTime(props.message.timestamp)` 輸出 `HH:mm` 24 小時制）
      - `AiMessageItem.vue`（Phase 1 主要 AI 訊息元件）：
        - 左側白色氣泡 + Bot 頭像 + `renderMarkdown` 渲染內容
        - 時間戳使用 `formatDateTime(props.message.timestamp)` 輸出 `HH:mm` 24 小時制
        - **Typing indicator 整合**：當 `message.type === 'ai-streaming'` 時顯示三點跳動動畫（取代獨立的 `AiStreamingItem`），content 有值後改用 streaming bubble；type flip 至 `'ai'` 後顯示完整訊息
        - **feedback 按鈕直接內嵌**（不使用 slot）：顯示於時間戳右側；讚 / 倒讚各一個 `UButton ghost`；點擊 emit `rate: [id, FeedbackValue]`；再次點擊同一個取消（`rating` 回 `null`）；點擊另一個覆蓋前一個狀態
        - **per-message quick-reply chips**：`message.quickReplies` 有值時顯示於訊息下方；點擊 emit `'quick-reply': [text]`
      - `AiStreamingItem.vue`：保留作為後續 Phase 2 真實 SSE 串流階段可使用的獨立元件（含打字游標 blinking `|` + 逐字 append）；Phase 1 KB mock 分支目前主要互動以 `AiMessageItem` 統一處理
      - `SystemErrorItem.vue`：警告 icon + 錯誤文案 + 「重試」按鈕（emit `retry`）
      - `SystemTimeoutItem.vue`：時鐘 icon + timeout 文案 + 「重試」按鈕（emit `retry`）
      - `SystemInterceptedItem.vue`：依 `metadata.interceptType` 顯示不同 icon 與文案
      - `SystemLowConfidenceItem.vue`：info icon + 低信心度提示文案
      - `SystemFallbackItem.vue`：降級提示 + 聯絡捷徑連結
  - **完成條件**：每種 type 訊息均可正確渲染；`AiMessageItem` typing indicator → 完整訊息切換正確；重試按鈕點擊後重送訊息；自動捲動至最新訊息；Empty State 顯示歡迎訊息與 KB chips；feedback 按鈕點擊後切換 `rating` 狀態、再點取消、切換覆蓋；per-message chips 顯示且點擊後送出訊息

---

- [x] **T-029** 完成 Phase 1 Widget 整合：確認完整對話流程可端對端驗證
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-016 ～ T-028
  - **實作內容**：
    - 整合所有 Phase 1 元件至前台頁面，使用 **KB mock 分支**驗證完整流程（真實 SSE 串流管線暫時 comment out，於 T-034B 切換）
    - 手動驗證項目（`npm run dev`）：
      1. 點擊 Launcher 展開 Widget
      2. 看到 Empty State 歡迎訊息（Bot avatar + `renderMarkdown` 渲染 + per-message quick-reply chips）
      3. 輸入訊息送出（Enter 送出；Shift+Enter 換行；中文輸入法組字期間 Enter 不觸發送出）
      4. typing indicator（三點跳動）顯示後，KB mock 延遲回覆出現（含 Markdown 渲染）
      5. 每一則 AI 回覆底部顯示 feedback 讚 / 倒讚 icon；點擊切換狀態；再次點擊取消；切換另一個覆蓋
      6. 每一則 AI 回覆下方顯示 per-message quick-reply chips；點擊後正常送出訊息
      7. 訊息時間戳顯示固定格式 `HH:mm`（24 小時制）
      8. 點擊 Header 重置按鈕 → 對話清空 → Empty State 重新出現（`handleReset()` → `restartSession()`）
      9. 重整頁面後重新展開 Widget → session localStorage 恢復歷史訊息
      10. 降級模式：手動設定 `config.status = 'offline'` → Widget 轉為降級狀態 → Input Bar disabled → fallback 提示顯示
    - 確認 `handleRate(messageId, value)` 正確呼叫 `rateMessage()`，訊息 `rating` 狀態更新
  - **完成條件**：所有手動驗證項目通過；KB mock 回覆正確；reset / rate / quick-reply 事件鏈正常；console 無未處理錯誤

---

### WS-C 測試（Phase 1）

---

- [x] **T-030** 撰寫 `useStreaming` 單元測試
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-024
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/useStreaming.test.ts`
    - 測試案例：
      - idle → sending → streaming → completed 狀態轉換
      - 30 秒 timeout timer 正確觸發（使用 `vi.useFakeTimers()`）
      - 取消串流後 state 為 cancelled
      - 網路錯誤後 state 為 error
      - token append 邏輯正確（多個 token 依序 append）
  - **完成條件**：所有測試案例通過；狀態轉換覆蓋 idle / sending / streaming / completed / error / timeout / interrupted / cancelled

---

- [x] **T-031** 撰寫 `useChatSession` 單元測試
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-025
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/useChatSession.test.ts`
    - 測試案例：
      - localStorage 無 token → 建立新 session → token 寫入 localStorage
      - localStorage 有 token → API 回傳歷史訊息 → 恢復 session
      - localStorage 有 token → API 回 401/404 → 清除 token → 重建 session
      - `restartSession()` 清除舊 session 並建立新 session
  - **完成條件**：四個測試案例全數通過；mock API 回傳正確模擬

---

- [x] **T-032** 撰寫 `useWidgetConfig` 單元測試
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-026
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/useWidgetConfig.test.ts`
    - 測試案例：
      - Widget 展開 → Config API 呼叫 → config 存入 store
      - Config API 失敗 → fallback 文案使用 i18n → 降級模式觸發
      - `status: 'offline'` → 降級模式觸發
      - `status: 'degraded'` → 降級模式觸發
      - 降級模式下 60 秒後重新探測（mock timer）
      - 不快取至 localStorage（每次展開重新取得）
  - **完成條件**：六個測試案例全數通過

---

- [x] **T-033** 撰寫 `utils/format.ts` 單元測試
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-012
  - **實作內容**：
    - 測試檔：`tests/unit/utils/format.test.ts`
    - 測試案例：
      - `formatDateTime`：
        - 傳入 `Date` 物件 → 正確輸出 `HH:mm`（24 小時制）
        - 傳入 ISO string → 正確輸出 `HH:mm`
        - 傳入 timestamp number → 正確輸出 `HH:mm`
        - 邊界：00:00、12:00、23:59 各輸出正確
      - `formatRelativeTime`（保留測試供日後使用）：30 秒內 → 「剛剛」；3 分鐘前 → 「3 分鐘前」；今天 → 「今天 HH:MM」；昨天 → 「昨天 HH:MM」；更早 → 「YYYY/MM/DD」
      - `truncateText`：超過 maxLen 時截斷並加「…」；剛好等於 maxLen 不截斷；空字串輸出空字串
  - **完成條件**：`formatDateTime` 三種輸入格式均正確輸出 `HH:mm`；`truncateText` 邊界案例通過；所有案例無 TypeScript 錯誤
  - **執行結果**：✅ 27/27 通過（含新增的 `formatDateTime` 7 案例）

---

- [x] **T-034** 撰寫 Phase 1 前台 E2E 測試（P0 核心旅程）
  - **所屬 Phase**：Phase 1
  - **所屬 Workstream**：WS-C
  - **依賴**：T-029、T-014
  - **實作內容**：
    - 測試檔：`tests/e2e/chat/widget-core.spec.ts`
    - 為下列元件加入 `data-testid`：`AiMessageItem`、`UserMessageItem`、`ChatPanel`、`ChatWidget`、`ChatInputBar`（共 11 個 testid）
    - E2E 旅程 J-01「開啟 Widget」：點擊 FAB → ChatPanel 顯示、FAB 消失
    - E2E 旅程 J-02「傳送訊息 → AI 回覆」：typing indicator（ai-streaming）出現 → AI 氣泡顯示、非空白
    - E2E 旅程 J-03「quick-reply chips 點擊」：點擊 chip → 訊息送出 → 第二輪 AI 回覆顯示
    - E2E 旅程 J-04「feedback 按鈕互動」：點讚 → toggle → 點倒讚
    - E2E 旅程 J-05「時間戳格式」：AI 與使用者訊息時間戳符合 `HH:mm` regex
    - E2E 旅程 J-06「Reset 按鈕」：對話清空後使用者訊息消失
    - E2E 旅程 J-07「關閉 Widget」：X 按鈕 → Panel 關閉 → FAB 重新出現
    - 三個 viewport 均執行（Desktop 1280px、Tablet 768px、Mobile 375px）
    - `playwright.config.ts` Mobile project 改用 Desktop Chrome + 375px viewport（避免 iPhone UA hydration 問題）
    - 關鍵修正：使用 `pressSequentially` 觸發 Vue v-model；用 `waitForSelector(attached)` 代替瞬間捕捉 typing indicator
  - **完成條件**：七個 E2E 旅程全數通過；三個 viewport 無版面破壞；測試以 KB mock 延遲回覆為準
  - **執行結果**：✅ 24/24 通過（8 旅程 × 3 viewports）

---

## Phase 2 — 前台進階互動完整化

> **目標**：補完留資表單、轉人工、回饋、語系切換、埋點

### WS-D 前台進階互動

---

- [ ] **T-034B** 將聊天流從 KB mock 切換回真實 API / SSE 串流
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-022、T-029
  - **實作內容**：
    - 移除 `useChat.ts` 中的 KB mock branch（`kbStore.query` + setTimeout 延遲），改為呼叫真實聊天 API
    - 啟用被 comment out 的串流管線：建立空 `AiStreamingItem`（`streamingState = 'sending'`）→ 呼叫 `useStreaming.startStream()` → token 逐字 append → 串流完成轉型為 `ai` 訊息
    - 補充錯誤終態處理（error / timeout / interrupted / cancelled）：append 對應 `SystemErrorItem` / `SystemTimeoutItem` 等
    - 移除或停用 `useKnowledgeBaseStore`（或改為純 Phase 1 遺留標記，確認已不進入送訊流程）
    - 將 `ChatMessageArea` Empty State 的歡迎訊息資料來源從 `kbStore.query('hello')` 改為 **Widget Config API** 提供的 `config.welcomeMessage`（`GET /api/v1/widget/config`）
    - 將 `useChatSession._appendWelcomeMessage()` 的 `quickReplies` 來源從 `kbStore.getWelcomeQuickReplies()` 改為 `config.quickReplies`（來自 Widget Config）
    - `sendMessage` 呼叫 `POST /api/v1/chat/sessions/:sessionToken/messages`，回應採 **`fetch + ReadableStream` SSE 串流**
  - **完成條件**：KB mock branch 已從 `useChat` 主流程移除；SSE 串流逐字顯示正確運作；`AiStreamingItem` 打字游標動畫正確；各錯誤終態訊息元件正確 append；`useKnowledgeBaseStore` 不再被聊天流呼叫；歡迎訊息與 quickReplies 均來自 Widget Config；console 無 mock TODO 警告

---

- [ ] **T-035** 建立 `services/api/chat.ts` 補充（Lead、Handoff、Feedback API）
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-022
  - **實作內容**：
    - 補充 `app/services/api/chat.ts`：
      - `submitLead(sessionToken, data: LeadFormData)` → `POST /api/v1/chat/sessions/:sessionToken/lead`
      - `requestHandoff(sessionToken)` → `POST /api/v1/chat/sessions/:sessionToken/handoff`，回傳 `{ accepted, action, leadId?, ticketId?, message }`
      - `submitFeedback(sessionToken, messageId, value: 'up' | 'down', reason?: string)` → `POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback`，payload `{ value, reason? }`
      - ~~`getHandoffStatus(sessionToken)`~~ **（已移除：Handoff 簡化為單次 POST，無需 polling status）**
    - 對應 mock fixtures 補充至 `tests/fixtures/chatFixtures.ts`（含 feedback 回應）
  - **完成條件**：三個 API 函式（`submitLead`、`requestHandoff`、`submitFeedback`）可呼叫；TypeScript 型別正確；mock fixtures 可用

---

- [ ] **T-036** 實作 `useLeadForm` composable
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-035、T-007
  - **實作內容**：
    - 建立 `app/features/chat/composables/useLeadForm.ts`
    - 管理 state：`formData: LeadFormData`、`status: 'idle' | 'submitting' | 'submitted' | 'error'`
    - `submitLead()` 流程：呼叫 API → 成功 → `status = 'submitted'`，存入 `useChatSessionStore.leadFormState.submitted = true` → 阻止同 session 重複提交
    - 提交失敗：`status = 'error'`，inline 錯誤提示
    - 驗證規則以 vee-validate 實作（規則層）：
      - `name`：**必填**
      - `email`：**必填**，格式驗證（標準 email 格式）
      - `company`：**選填**（無必填限制）
      - `phone`：**選填**（無必填限制）
      - `message`：**選填**（備注 / 詢問訊息）
      - `language`：**自動帶入**當前語系（`zh-TW` / `en`），不需訪客填寫，隨表單提交
      - ~~`phoneOrEmail` 自訂規則~~ **已移除**
    - 對外暴露欄位驗證狀態（`errors`、`validate()`），供上層的 `UForm` 與既有封裝的 `FormField` 元件消費；composable 本身不直接渲染任何表單 UI
  - **完成條件**：提交成功後 `status = 'submitted'`；同 session 再次觸發顯示已提交狀態；`name` + `email` 必填驗證有效；`company`、`phone`、`message` 為選填不觸發驗證錯誤；`errors` 物件可供上層元件讀取

---

- [ ] **T-037** 建立 `LeadFormCard` 元件
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-036、T-028
  - **實作內容**：
    - 建立 `app/features/chat/components/LeadFormCard.vue`：inline 卡片，嵌入訊息流（作為一種 `message.type = 'lead-form'` 渲染）
    - 使用 `UForm` 作為表單容器，欄位以既有封裝元件 `app/components/FormField` 渲染：
      - **姓名（name）**：必填
      - **Email**：必填，格式驗證
      - **公司（company）**：選填
      - **電話（phone）**：選填
      - **訊息（message）**：選填（備注 / 詢問訊息）
    - `language`：由 `useI18n().locale` 自動取得當前語系，隨表單資料提交，不顯示在表單 UI 中
    - 欄位錯誤狀態與錯誤訊息由 `FormField` 封裝元件承接，不直接使用 vee-validate 的畫面元件（`<Form>`、`<Field>`、`<ErrorMessage>`）
    - 表單資料、驗證狀態、提交流程均由 `useLeadForm` composable 提供
    - 提交中：送出按鈕顯示 loading 並 disabled；已提交：卡片整體替換為確認訊息（「感謝您，我們已收到您的資料！」）
    - 若 `useLeadForm.status === 'submitted'` 再次觸發，顯示「已登記」提示，不重渲染表單
  - **完成條件**：姓名與 Email 必填驗證有效；公司、電話、訊息空白送出不報錯；提交成功後卡片轉為確認訊息；已提交時再次觸發顯示「已登記」不重渲表單

---

- [ ] **T-038** 實作 `useHandoff` composable
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-035
  - **實作內容**：
    - 建立 `app/features/chat/composables/useHandoff.ts`
    - 管理 `handoffState`：`'idle' | 'requesting' | 'transferred'`（**簡化版，本期無 polling**）
    - `requestHandoff()` 流程：
      1. `handoffState = 'requesting'`
      2. 呼叫 `POST /api/v1/chat/sessions/:sessionToken/handoff` → 後端回傳 `{ accepted, action, leadId?, ticketId?, message }`
      3. 成功（`accepted === true`）→ `handoffState = 'transferred'`，顯示靜態訊息「已轉交專人協助」
      4. 失敗 → 顯示錯誤提示，`handoffState` 回到 `'idle'`
    - ~~Polling 邏輯~~ **已移除**（無 `setInterval`、無 `getHandoffStatus()` 呼叫）
    - 多狀態顯示（waiting / connected / unavailable）**延後至後期實作**
  - **完成條件**：`requestHandoff()` 呼叫後 `handoffState` 轉為 `'transferred'`；顯示靜態「已轉交專人協助」文案；API 失敗時回到 `'idle'`；無 polling 相關程式碼

---

- [ ] **T-039** 建立 `HandoffStatusCard` 元件
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-038、T-028
  - **實作內容**：
    - 建立 `app/features/chat/components/HandoffStatusCard.vue`：inline 卡片（`message.type = 'handoff-status'`）
    - **本期簡化版**：僅顯示靜態「已轉交專人協助」確認訊息（對應 `handoffState = 'transferred'`）
    - `requesting` 狀態：顯示 loading spinner（等待 API 回應中）
    - ~~多狀態顯示（waiting / connected / unavailable）~~ **延後實作**；`HandoffStatusCard` 多狀態版本於後期 sprint 補充
    - ~~`unavailable` 的「留下聯絡方式」按鈕~~ **延後**（本期 Handoff 直接觸發 Lead，不需 unavailable 引導流程）
  - **完成條件**：`requesting` 狀態顯示 spinner；`transferred` 狀態顯示靜態「已轉交專人協助」文案；無 polling 狀態渲染邏輯

---

- [ ] **T-040** 補強 `AiMessageItem` 內嵌 feedback 互動並建立 `useFeedback` composable（Feedback API 串接）
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-035、T-028
  - **實作內容**：
    - 建立 `app/features/chat/composables/useFeedback.ts`
      - `submitFeedback(sessionToken, messageId, value: 'up' | 'down', reason?)` → 呼叫 `services/api/chat.ts: submitFeedback`（`POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback`，payload `{ value, reason? }`）
      - fire-and-forget：先樂觀更新 `ChatMessageVM.feedbackValue`，API 失敗記錄 console error，不中斷對話流
      - 再次點擊相同值 → `feedbackValue = null`（取消）
    - `AiMessageItem` 的讚 / 倒讚按鈕補強：
      - 點擊後呼叫 `useFeedback.submitFeedback()`，payload 欄位為 `value`（非 `type`）
      - 點擊 `down` 後展開原因選填 chips（預設 4 個選項，TBD 選項內容）
      - 選擇原因後帶入 `reason` 參數再次呼叫 API
  - **完成條件**：讚 / 倒讚點擊後 `POST .../messages/:messageId/feedback` 被呼叫，payload `{ value: 'up'|'down' }`；`feedbackValue` 本地狀態正確切換（含取消邏輯）；API 失敗不影響 UI；`down` 後原因 chips 展開

---

- [ ] **T-041** 實作語系切換功能
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-019、T-008
  - **實作內容**：
    - 在 `ChatPanel` 內的 **header 區塊**（已直接內嵌於 `ChatPanel`，非獨立 `ChatHeader` 元件）實作語系切換 `UDropdownMenu`：選項「繁體中文 / English」
    - 切換後呼叫 `$i18n.setLocale(locale)` → 所有靜態文案即時更新
    - 語系偏好儲存至 `localStorage.chat_locale`；初始化時讀取（在 `useChatWidgetStore` 或 `useWidgetConfig` 初始化階段）
    - Widget Config 提供的動態文案依當前語系顯示對應版本（`quickReplies.zh-TW` vs `quickReplies.en`）
  - **完成條件**：切換至 English 後所有靜態文案更新；快捷提問顯示英文版本；`localStorage.chat_locale` 正確存寫；重整後語系保持

---

- [ ] **T-042** 補完英文 i18n 文案（`i18n/locales/en/`）
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-008、T-041
  - **實作內容**：
    - 填充 `i18n/locales/en/common.json`：所有 Widget 文案的英文版本（歡迎訊息、CTA、降級提示、錯誤訊息、系統提示等）
    - 填充 `i18n/locales/en/chat.json`：前台聊天文案英文版本（LeadFormCard 欄位 label、HandoffStatusCard 文案、AI 訊息回饋相關提示文案（讚 / 倒讚 tooltip、原因 chips 選項）等）
    - 填充 `i18n/locales/en/admin.json`：後台介面文案英文版本（預留，後台本期以繁中為主）
    - 確認 zh-TW / en 的 key 完全一致（無漏 key）
  - **完成條件**：切換至 English 後所有前台文案均顯示英文；無 i18n missing key 警告

---

- [ ] **T-043** 補完 `utils/analytics.ts` 事件追蹤實作
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-012、T-027、T-040、T-041
  - **實作內容**：
    - 定義 `AnalyticsEvent` union type（含所有事件：`widget_open`、`widget_close`、`quick_reply_click`、`message_sent`、`lead_form_open`、`lead_form_submit`、`handoff_requested`、`feedback_up`、`feedback_down`、`locale_switch`）
    - 實作 `trackEvent(event)` → `POST /api/analytics/event`（API 端點 TBD，失敗不影響主流程）
    - 在對應位置呼叫 `trackEvent`：
      - `useChatWidgetStore.setOpen()` → `widget_open` / `widget_close`
      - `ChatQuickReplies` 點擊 → `quick_reply_click`
      - `useChat.sendMessage()` → `message_sent`
      - `useLeadForm.submitLead()` → `lead_form_submit`
      - `useHandoff.requestHandoff()` → `handoff_requested`
      - `useFeedback.submitFeedback()` → `feedback_up` / `feedback_down`
      - 語系切換 → `locale_switch`
  - **完成條件**：對應操作時 `trackEvent` 被呼叫；API 失敗不影響 UI；TypeScript 事件型別完整

---

### WS-D 測試（Phase 2）

---

- [ ] **T-044** 撰寫 `useLeadForm` 單元測試
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-036
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/useLeadForm.test.ts`
    - 測試案例：
      - 姓名（`name`）為空時驗證失敗
      - Email 為空時驗證失敗
      - Email 格式不正確時驗證失敗（例如 `notanemail`）
      - 公司（`company`）為空時**不報驗證錯誤**（選填）
      - 電話（`phone`）為空時**不報驗證錯誤**（選填）
      - 訊息（`message`）為空時**不報驗證錯誤**（選填）
      - 提交 payload 包含 `language`（取自當前 i18n locale，如 `'zh-TW'`）
      - 提交成功後 `status = 'submitted'`，`leadFormState.submitted = true`
      - 已提交時再次提交被阻止（不重複呼叫 API）
  - **完成條件**：九個測試案例通過；`name` + `email` 必填驗證有效；`company`、`phone`、`message` 選填測試通過；`language` 自動帶入測試通過；~~`phoneOrEmail` 自訂規則測試~~ 已移除

---

- [ ] **T-045** 撰寫 `LeadFormCard` 元件測試
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-037、T-014
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/LeadFormCard.test.ts`
    - 測試案例：
      - `UForm + FormField` 正確渲染所有欄位（姓名、Email、公司、電話、訊息）
      - 空白提交後，姓名與 Email 欄位透過 `FormField` 顯示對應驗證錯誤訊息；公司、電話、訊息欄位不顯示錯誤
      - 提交中（`status = 'submitting'`）時，送出按鈕為 disabled + loading 狀態
      - 提交成功（`status = 'submitted'`）後，卡片顯示確認訊息而非表單
      - `useLeadForm.status === 'submitted'` 再次觸發時顯示「已登記」提示而非重渲表單
  - **完成條件**：五個測試案例通過；測試中不出現對 vee-validate 畫面元件（`<Form>`、`<Field>`、`<ErrorMessage>`）的直接斷言；必填 / 選填欄位行為符合拍板決策（`message` 亦為選填）

---

- [ ] **T-046** 撰寫 `HandoffStatusCard` 元件測試
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-039
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/HandoffStatusCard.test.ts`
    - 測試案例（對應本期簡化版）：
      - `handoffState = 'requesting'` → 顯示 loading spinner
      - `handoffState = 'transferred'` → 顯示靜態「已轉交專人協助」文案
    - ~~四狀態測試（waiting / connected / unavailable）~~ **延後**，待多狀態版本實作後補充
  - **完成條件**：兩個狀態渲染正確；無 polling / 多狀態相關斷言

---

- [ ] **T-047** 撰寫 `AiMessageItem` 內嵌 feedback 行為測試（含 API 呼叫斷言）
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-040
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/AiMessageItem.feedback.test.ts`
    - 測試案例：
      - 初始狀態（`rating: null`）兩個 icon 均未填充
      - 點擊讚 → 讚 icon 填充；`message.feedbackValue` 更新為 `'up'`；`POST .../messages/:messageId/feedback` 被呼叫（`{ value: 'up' }`）
      - 點擊倒讚 → 倒讚 icon 填充；原因 chips 展開；`message.feedbackValue` 更新為 `'down'`；API 被呼叫（`{ value: 'down' }`）
      - 已點讚後再點讚 → `feedbackValue` 切回 `null`（取消）
      - 已點讚後點倒讚 → 狀態切換為 `'down'`
      - API 失敗 → `feedbackValue` 本地狀態仍正確更新；不拋出錯誤（fire-and-forget）
  - **完成條件**：六個測試案例通過；驗證 `feedbackValue` 欄位與 UI 狀態一致；API 呼叫斷言使用 `value`（非 `type`）；API 失敗不影響 UI 狀態

---

- [ ] **T-048** 撰寫 Phase 2 前台 E2E 測試
  - **所屬 Phase**：Phase 2
  - **所屬 Workstream**：WS-D
  - **依賴**：T-043、T-034
  - **實作內容**：
    - 測試檔：`tests/e2e/chat/advanced-interactions.spec.ts`
    - E2E 旅程「留資表單完整流程」：AI 觸發留資表單 → 填寫欄位 → 送出成功 → 確認訊息 → 再次觸發顯示「已登記」
    - E2E 旅程「重新開始對話」：點擊重置 → 對話清空 → 歡迎訊息重新出現
    - E2E 旅程「語系切換」：切換至 English → 所有文案更新 → 快捷提問文案更新
  - **完成條件**：三個 E2E 旅程全數通過

---

## Phase 3 — 後台基礎頁面

> **目標**：建立後台管理介面骨架，Dashboard + 對話紀錄 + Lead + Ticket 可操作

### WS-E 後台基礎

---

- [ ] **T-049** 完整實作 `layouts/admin.vue`（含完整導覽列）
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-010
  - **實作內容**：
    - 完整實作 `AdminSidebar`（`app/features/admin/components/AdminSidebar.vue`）：
      - Logo + 系統名稱
      - 導覽項目（本期）：**Dashboard**、對話紀錄、Lead、**Ticket**、知識庫、意圖/模板、快捷提問、Widget 設定、稽核事件、回饋紀錄
      - ~~報表~~ **延後（本期 Reports 延後）**
      - 以 `<NuxtLink>` 實作，active 樣式（當前路由高亮）
      - **預設路由**：`/admin/dashboard`（進入後台後直接到 Dashboard）
    - 完整實作 `AdminTopbar`（`app/features/admin/components/AdminTopbar.vue`）：
      - 當前頁面標題（`useRoute().meta.title`）
      - 右側顯示「返回前台」按鈕（`navigateTo('/')`）
    - 確認 `layouts/admin.vue` 組合以上元件，主內容區 `<slot />` 正確渲染
  - **完成條件**：所有後台路由顯示完整 layout；導覽項目 active 狀態正確；「返回前台」按鈕可用；預設路由導向 `/admin/dashboard`

---

- [ ] **T-050** 建立後台共用元件庫
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-049、T-005
  - **實作內容**：
    - `AdminStatCard.vue`（`app/features/admin/components/`）：`UCard` 封裝，顯示數字、標題、可選連結
    - `AdminDataTable.vue`：`UTable` + `UPagination` 封裝，接收 `columns`、`rows`、`total`、`page` props，emit `update:page`、`update:sort`
    - `AdminFilterBar.vue`：篩選條件列，接收 filter 定義（欄位 label、type：select / date-range / keyword），emit `update:filters`
    - `AppStatusBadge.vue`：`UBadge` 封裝，依 `status` prop 對應語意色（active → green、inactive → gray、pending → yellow、error → red 等）
    - `AppEmptyState.vue`：空狀態插圖 + 說明文字 + 可選 CTA 按鈕
    - `AppErrorState.vue`：錯誤狀態 icon + 說明 + 重試按鈕
    - `AppModal.vue`：`UModal` 封裝，二次確認用途，接收 `title`、`description`、`confirmLabel`，emit `confirm`、`cancel`
  - **完成條件**：七個元件可正常 import 使用；`AdminDataTable` 可顯示 mock 資料並分頁；`AppModal` 點擊確認 / 取消正確 emit

---

- [ ] **T-051** 建立後台共用 API services（admin 目錄）
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-004、T-005
  - **實作內容**：
    - 建立 `app/services/api/admin/` 目錄
    - `dashboard.ts`：`getDashboardStats()` → `GET /api/v1/admin/dashboard`（含今日/本月對話數、AI 解答率、待處理 Ticket 數、本月新增 Lead 數、趨勢資料）
    - `conversations.ts`：`listConversations(params)` → `GET /api/v1/admin/conversations`；`getConversationDetail(id)` → `GET /api/v1/admin/conversations/:id`；`exportConversations(params)` → `POST /api/v1/admin/conversations/export`
    - `leads.ts`：`listLeads(params)`、`getLeadDetail(id)`、`updateLead(id, data)` → `/api/v1/admin/leads/...`
    - `tickets.ts`：`listTickets(params)` → `GET /api/v1/admin/tickets`；`getTicketDetail(id)` → `GET /api/v1/admin/tickets/:id`；`updateTicketStatus(id, status)` → `PATCH /api/v1/admin/tickets/:id/status`；`addTicketNote(id, note)` → `POST /api/v1/admin/tickets/:id/notes`
    - 各 service 對應 mock fixtures 建立於 `tests/fixtures/adminFixtures.ts`
  - **完成條件**：四個 service（`dashboard.ts`、`conversations.ts`、`leads.ts`、`tickets.ts`）可呼叫；mock fixtures 有對應型別的資料；TypeScript 無錯誤

---

- [ ] **T-052** 建立後台 Dashboard 頁面
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-050、T-051
  - **實作內容**：
    - 建立 `app/pages/admin/dashboard.vue`（`/admin/dashboard`，`/admin` 預設導向此頁）
    - 5 個 `AdminStatCard`：今日對話數、本月對話數、AI 自助解答率、待處理 Ticket 數（連結至 Ticket 列表篩選未處理）、本月新增 Lead 數（連結至 Lead 列表）
    - `AdminLineChart`（`app/features/admin/components/AdminLineChart.vue`）：Nuxt Charts 折線圖，近 7 / 30 天對話量趨勢，tab 切換天數
    - `AdminPieChart`（`app/features/admin/components/AdminPieChart.vue`）：Nuxt Charts Donut / 圓餅圖，近 30 天意圖分布（常見意圖 / 轉人工原因）
    - 最新 5 筆稽核事件 inline 列表，可點擊跳至 `/admin/audit/:id`
    - 資料來源：`getDashboardStats()` → `GET /api/v1/admin/dashboard`；**最少包含**：對話數、Lead 數、Ticket 數、常見意圖分布、轉人工原因分布、最新稽核事件
  - **完成條件**：Dashboard 頁面可存取；5 個統計卡片正確顯示數字；折線圖與圓餅圖可渲染（Nuxt Charts，無 console 錯誤）；最新稽核事件列表顯示；API 失敗時顯示 `AppErrorState`

---

- [ ] **T-053** 建立對話紀錄列表頁（`/admin/conversations`）
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-050、T-051
  - **實作內容**：
    - 建立 `app/pages/admin/conversations/index.vue`
    - 使用 `AdminDataTable` 顯示欄位：Session ID、開始時間、對話輪數、語系、狀態、是否有回饋
    - 使用 `AdminFilterBar` 篩選：時間範圍、語系、狀態、是否含機密攔截、是否含 Prompt Injection
    - 關鍵字搜尋（debounce 300ms）
    - 分頁（每頁 20 筆）、可點擊欄位標題排序
    - 篩選條件存 URL query string（支援分頁書籤）
    - 匯出 CSV 按鈕（呼叫 `exportConversations()`，下載回傳 URL）
    - 點擊列跳至 `/admin/conversations/:id`
  - **完成條件**：列表可篩選、排序、分頁；關鍵字 debounce 300ms；URL query string 反映篩選狀態；匯出按鈕可觸發下載

---

- [ ] **T-054** 建立 `ConversationViewer` 元件與對話詳情頁
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-053、T-028
  - **實作內容**：
    - 建立 `app/features/admin/components/ConversationViewer.vue`：模擬前台聊天氣泡樣式（共用訊息型元件的樣式基礎，去除 `MessageFeedback` 按鈕，只讀顯示）；攔截事件以 `AuditEventBadge` 標記
    - 建立 `AuditEventBadge.vue`（`app/features/admin/components/`）：事件類型（機密攔截 / Injection / 轉人工 / 低信心度）配色 badge
    - 建立 `app/pages/admin/conversations/[id].vue`：
      - Session 基本資訊（ID、時間、語系、輪數）
      - `ConversationViewer` 顯示完整對話
      - 回饋摘要（讚/倒讚數、倒讚原因分布）
  - **完成條件**：詳情頁以氣泡樣式顯示對話；攔截事件有 badge 標記；回饋摘要正確顯示

---

- [ ] **T-055** 建立 Lead 管理列表與詳情頁
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-050、T-051
  - **實作內容**：
    - 建立 `app/pages/admin/leads/index.vue`：`AdminDataTable` 顯示姓名、公司、聯絡方式、詢問品項、建立時間、狀態；篩選：狀態、時間範圍；搜尋：姓名 / 公司關鍵字
    - 建立 `app/pages/admin/leads/[id].vue`：完整留資資訊、關聯對話連結（可跳至對話詳情）、狀態切換下拉（`USelect`）、管理者備註欄位（`UTextarea`）、「儲存」按鈕
    - 儲存後呼叫 `updateLead()` API，成功後顯示 toast
  - **完成條件**：列表可篩選搜尋；詳情頁狀態下拉可更新；備註可儲存；操作後 toast 提示

---

- [ ] **T-056** 建立 Ticket 管理列表與詳情頁
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-050、T-051
  - **實作內容**：
    - 建立 `app/features/admin/composables/useTickets.ts`：
      - `tickets`（列表）、`ticket`（詳情）、`loading`、`error` state
      - `fetchTickets(params)`、`fetchTicketDetail(id)`、`updateTicketStatus(id, status)` → `PATCH /api/v1/admin/tickets/:id/status`、`addTicketNote(id, note)` → `POST /api/v1/admin/tickets/:id/notes` 方法
    - 建立 `app/pages/admin/tickets/index.vue`：
      - `AdminDataTable` 顯示：Ticket ID、主旨、建立時間、狀態（`AppStatusBadge`，四態：`open` 藍 / `in_progress` 黃 / `resolved` 綠 / `closed` 灰）、優先級
      - `AdminFilterBar` 篩選：狀態（四態全選項）、優先級、時間範圍
      - 點擊列跳至 `/admin/tickets/:id`
    - 建立 `app/pages/admin/tickets/[id].vue`：
      - 問題描述、關聯對話連結（跳至對話詳情頁）
      - 處理紀錄時間軸（每次狀態變更或備註以時間軸樣式顯示）
      - 狀態變更下拉（`open → in_progress → resolved → closed` 四態）+ 備註輸入 + 「送出」按鈕
      - 送出後呼叫 `updateTicketStatus()` / `addTicketNote()`，成功顯示 toast
  - **完成條件**：Ticket 列表可篩選分頁，四態 badge 正確配色；詳情頁可更新狀態（四態）；備註可送出；處理紀錄時間軸正確顯示；API 呼叫路徑分離（`PATCH .../status` + `POST .../notes`）；API 失敗時顯示 `AppErrorState`

---

### WS-E 測試（Phase 3）

---

- [ ] **T-057** 撰寫後台 E2E 測試（Phase 3 核心旅程）
  - **所屬 Phase**：Phase 3
  - **所屬 Workstream**：WS-E
  - **依賴**：T-052、T-055、T-056、T-054
  - **實作內容**：
    - 測試檔：`tests/e2e/admin/admin-basics.spec.ts`
    - E2E 旅程「Dashboard 載入」：進入 `/admin/dashboard` → 統計卡片顯示數字 → 折線圖與圓餅圖可渲染
    - E2E 旅程「對話紀錄查詢」：進入 `/admin/conversations` 列表 → 選擇時間範圍篩選 → 點擊 Session → 詳情顯示完整對話
    - E2E 旅程「Lead 狀態更新」：進入 Lead 列表 → 點擊 Lead → 修改狀態 → 儲存 → toast 提示 → 列表狀態更新
    - E2E 旅程「Ticket 狀態更新」：進入 Ticket 列表 → 點擊 Ticket → 更新狀態為「進行中（`in_progress`）」→ 新增備註 → 送出 → 時間軸新增紀錄；補充「更新狀態為 `resolved`」旅程驗證四態流轉
  - **完成條件**：四個 E2E 旅程全數通過

---

## Phase 4 — 後台內容管理

> **目標**：完成知識庫、意圖/模板、快捷提問、Widget 設定四個內容管理模組

### WS-F 後台內容管理

---

- [ ] **T-058** 建立後台內容管理 API services
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-051
  - **實作內容**：
    - `app/services/api/admin/knowledge.ts`：`listKnowledge(params)`、`getKnowledgeEntry(id)`、`createKnowledge(data)`、`updateKnowledge(id, data)`、`deleteKnowledge(id)`、`getVersionHistory(id)`、`restoreVersion(id, versionId)`、`importKnowledge(formData: FormData)`
    - `app/services/api/admin/intents.ts`：`listIntents(params)`、`createIntent(data)`、`updateIntent(id, data)`、`deleteIntent(id)`、`toggleIntent(id, enabled)`、`previewIntent(testInput)`
    - `app/services/api/admin/quickReplies.ts`：`listQuickReplies()`、`updateQuickReply(id, data)`、`reorderQuickReplies(ids: string[])`、`deleteQuickReply(id)`、`createQuickReply(data)`
    - `app/services/api/admin/widgetSettings.ts`：`getWidgetSettings()`、`updateWidgetSettings(data)`
    - 補充對應 mock fixtures
  - **完成條件**：四個 service 可呼叫；TypeScript 型別正確；mock fixtures 完整

---

- [ ] **T-059** 建立知識庫列表頁與刪除確認流程
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-050、T-058
  - **實作內容**：
    - 建立 `app/pages/admin/knowledge/index.vue`
    - `AdminDataTable` 顯示：標題、分類、狀態（草稿 / 已發佈 / 已停用，`AppStatusBadge`）、最後更新時間、操作（編輯 / 刪除）
    - `AdminFilterBar` 篩選：分類、狀態；關鍵字搜尋（debounce）
    - 刪除按鈕觸發 `AppModal` 二次確認 → 確認後呼叫 `deleteKnowledge()` → 成功後 toast + 列表重整
    - 「新增知識庫」按鈕 → 跳至 `/admin/knowledge/new`
    - 篩選條件存 URL query string
  - **完成條件**：列表可篩選排序；刪除需二次確認；刪除成功後列表更新

---

- [ ] **T-060** 建立知識庫新增 / 編輯頁（含編輯器）
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-059
  - **實作內容**：
    - 建立 `app/pages/admin/knowledge/new.vue` 與 `app/pages/admin/knowledge/[id]/edit.vue`（共用同一 `KnowledgeEditorForm` 元件）
    - 欄位：標題（必填，`UInput`）、分類選擇（`USelect`，含「新增分類」入口）、狀態切換（`USelect`：草稿 / 已發佈 / 已停用）
    - 內容編輯區：Phase 4 先使用 `UTextarea` 純文字模式（Markdown 編輯器選型 TBD，後期替換為 `CodeMirror` 或 `@nuxtjs/mdc`）
    - 「儲存」按鈕：新增頁呼叫 `createKnowledge()`，編輯頁呼叫 `updateKnowledge()`；成功後 toast + 跳回列表
    - 表單驗證：標題必填
  - **完成條件**：新增頁可建立條目並跳回列表；編輯頁載入現有資料可修改；標題驗證有效

---

- [ ] **T-061** 建立知識庫版本歷史 `USlideover` 與還原流程
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-060
  - **實作內容**：
    - 在 `app/pages/admin/knowledge/[id]/edit.vue` 右上角新增「版本歷史」按鈕
    - 點擊後開啟 `USlideover`（`KnowledgeVersionHistory.vue`）：
      - 列出歷次版本（時間、修改者 TBD、版本號）
      - 點擊版本可展開差異比對（diff 格式：TBD 後端提供，或前端簡單行差異）
      - 每個版本有「還原至此版本」按鈕 → 觸發 `AppModal` 確認彈窗 → 確認後呼叫 `restoreVersion()` → 成功後 toast，關閉 slideover，重新載入編輯頁內容
  - **完成條件**：版本列表可展開；還原需二次確認；還原成功後編輯頁顯示還原後的內容

---

- [ ] **T-062** 建立 `KnowledgeImportModal`（批次匯入 CSV / JSON）
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-059
  - **實作內容**：
    - 在知識庫列表頁新增「批次匯入」按鈕 → 開啟 `KnowledgeImportModal`（`UModal` 封裝）
    - Modal 內容：
      - 支援格式說明（CSV / JSON，欄位說明文字，TBD 後端定義）
      - 範本下載連結（CSV 範本、JSON 範本）
      - 檔案上傳區（`<input type="file">`，限 `.csv` / `.json`）
      - 上傳中 loading 狀態
      - 上傳後顯示結果：成功筆數、失敗筆數、失敗原因列表（對應後端 `{ success, failed, errors }`）
    - 上傳使用 `multipart/form-data`，呼叫 `importKnowledge(formData)`
  - **完成條件**：Modal 可開啟；上傳 CSV / JSON 檔案後顯示結果；失敗原因正確列出

---

- [ ] **T-063** 建立意圖 / 模板管理列表與側抽屜編輯
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-050、T-058
  - **實作內容**：
    - 建立 `app/pages/admin/intents/index.vue`
    - `AdminDataTable` 顯示：意圖名稱、觸發關鍵字（前 3 個 + tooltip 顯示全部）、優先級、啟用狀態（`USwitch`，即時呼叫 `toggleIntent()`）、操作（編輯 / 刪除）
    - 「新增意圖」+ 「編輯」均開啟 `USlideover`（`IntentEditorDrawer.vue`）：
      - 意圖名稱（必填）
      - 觸發關鍵字 tag-input（自製簡易 tag input，或引入 `@morev/vue-tags-input`，TBD）
      - 優先級（`USelect`）
      - 回覆模板內容（`UTextarea`）
      - 測試預覽：輸入框 + 「預覽」按鈕 → 呼叫 `previewIntent()` → 顯示匹配意圖名稱與回覆模板
    - 刪除需 `AppModal` 確認
  - **完成條件**：`USwitch` 即時切換啟用狀態；側抽屜新增 / 編輯功能完整；測試預覽正確顯示結果

---

- [ ] **T-064** 建立快捷提問管理頁（含拖曳排序）
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-058
  - **實作內容**：
    - 建立 `app/pages/admin/quick-replies/index.vue`
    - 左右兩欄布局：左側編輯列表（60% 寬）、右側 Widget 快捷提問預覽（40% 寬）
    - 左側 `QuickReplyDragList`（`app/features/admin/components/`）：
      - 使用 `vue-draggable-plus` 或 `@vueuse/integrations/useSortable` 實作拖曳排序（TBD，先確認 Nuxt 4 相容性）
      - 每筆可展開 inline 編輯：繁中文案、英文文案、啟用狀態 `USwitch`
      - 新增 / 刪除按鈕（刪除需確認）
      - 拖曳完成後 debounce 500ms 呼叫 `reorderQuickReplies(ids)` API
    - 右側預覽 `WidgetQuickRepliesPreview`（`app/features/admin/components/`）：pure UI，使用左側 list 的當前資料，依語系切換顯示，不呼叫 API
  - **完成條件**：拖曳排序可執行；排序後 API 正確呼叫（傳 ID 陣列）；右側預覽即時反映左側資料

---

- [ ] **T-065** 建立 Widget 設定管理頁（含即時預覽）
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-058、T-016 ～ T-021
  - **實作內容**：
    - 建立 `app/pages/admin/widget-settings/index.vue`
    - 設定表單（100% 寬）
    - 設定表單欄位：
      - CTA 文案（繁中 / 英文 `UInput`）
      - 歡迎訊息（繁中 / 英文 `UTextarea`）
      - 頁尾免責聲明（繁中 / 英文 `UTextarea`）
      - AI 標記文字（`UInput`）
      - 線上 / 離線 / 降級文案（各一個 `UInput`）
      - 聯絡捷徑（最多 3 組，每組：名稱 + URL，可新增 / 刪除）
    - 「儲存設定」按鈕 → 呼叫 `updateWidgetSettings()` → 成功 toast；失敗顯示 inline 錯誤
  - **完成條件**：儲存成功 toast；重新整理後設定值正確（重載 API 資料）

---

### WS-F 測試（Phase 4）

---

- [ ] **T-066** 撰寫後台 E2E 測試（Phase 4 內容管理旅程）
  - **所屬 Phase**：Phase 4
  - **所屬 Workstream**：WS-F
  - **依賴**：T-060、T-061、T-062、T-063、T-064、T-065
  - **實作內容**：
    - 測試檔：`tests/e2e/admin/content-management.spec.ts`
    - E2E 旅程「知識庫新增 / 編輯」：進入列表 → 點擊新增 → 填寫標題與內容 → 儲存 → 列表出現新條目
    - E2E 旅程「知識庫版本還原」：編輯已有條目 → 修改儲存 → 進入版本歷史 → 選擇舊版本還原 → 內容恢復
    - E2E 旅程「快捷提問拖曳排序」：進入快捷提問頁 → 拖曳調整順序 → 確認排序 API 呼叫
    - E2E 旅程「Widget 設定即時預覽」：進入 Widget 設定頁 → 修改 CTA 文案 → 右側預覽即時更新 → 儲存 → toast 顯示
  - **完成條件**：四個 E2E 旅程全數通過

---

## Phase 5 — 後台維運工具

> **目標**：完成稽核事件、回饋紀錄、營運報表三個維運模組

### WS-G 後台維運工具

---

- [ ] **T-067** 建立後台維運 API services
  - **所屬 Phase**：Phase 5
  - **所屬 Workstream**：WS-G
  - **依賴**：T-051
  - **實作內容**：
    - `app/services/api/admin/audit.ts`：`listAuditEvents(params)` → `GET /api/v1/admin/audit`；`getAuditEventDetail(id)` → `GET /api/v1/admin/audit/:id`；`exportAuditEvents(params)` → `POST /api/v1/admin/audit/export`
    - `app/services/api/admin/feedback.ts`：`listFeedback(params)` → `GET /api/v1/admin/feedback`（後台回饋紀錄查詢；前台 Feedback API `POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback` 於 Phase 2 已正式串接，此 service 提供後台查詢介面）
    - ~~`app/services/api/admin/reports.ts`~~ **延後（Reports 本期延後）**
    - 補充對應 mock fixtures
  - **完成條件**：`audit.ts`、`feedback.ts` 兩個 service 可呼叫；mock fixtures 含時序資料；TypeScript 正確；`reports.ts` 本期不建立

---

- [ ] **T-068** 建立稽核事件列表與詳情頁
  - **所屬 Phase**：Phase 5
  - **所屬 Workstream**：WS-G
  - **依賴**：T-050、T-054、T-067
  - **實作內容**：
    - 建立 `app/pages/admin/audit/index.vue`：
      - `AdminDataTable`：事件時間、事件類型（`AuditEventBadge`）、Session ID、嚴重程度（`AppStatusBadge`：高 → red、中 → yellow、低 → gray）
      - `AdminFilterBar` 篩選：事件類型、時間範圍、嚴重程度
      - 匯出 CSV 按鈕（呼叫 `exportAuditEvents()`）
    - 建立 `app/pages/admin/audit/[id].vue`：
      - 事件基本資訊（類型、時間、Session ID、嚴重程度）
      - 觸發上下文對話（`ConversationViewer` 子集，僅顯示觸發事件前後數則）
      - 系統判斷依據摘要（後端提供文字）
  - **完成條件**：列表可依類型 / 嚴重程度篩選；匯出 CSV 可下載；詳情頁顯示上下文對話；嚴重程度配色正確

---

- [ ] **T-069** 建立回饋紀錄列表頁
  - **所屬 Phase**：Phase 5
  - **所屬 Workstream**：WS-G
  - **依賴**：T-050、T-067
  - **實作內容**：
    - 建立 `app/pages/admin/feedback/index.vue`
    - `AdminDataTable` 顯示：時間、Session ID（可點擊跳至對話詳情）、訊息摘要（前 50 字截斷）、回饋類型（讚 / 倒讚，`AppStatusBadge` 配色）、倒讚原因
    - `AdminFilterBar` 篩選：回饋類型、時間範圍
    - 點擊 Session ID 跳至 `/admin/conversations/:sessionId`
    - **注意**：前台 Feedback API `POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback` 已於 Phase 2 正式串接；後台此頁面顯示後端管理的歷史回饋紀錄（`GET /api/v1/admin/feedback`）
  - **完成條件**：列表可依類型篩選；Session ID 連結正確跳轉；訊息截斷顯示正確

---

- [ ] **T-070** 建立 `AppDateRangePicker` 元件
  - **所屬 Phase**：Phase 5
  - **所屬 Workstream**：WS-G
  - **依賴**：T-050
  - **實作內容**：
    - 建立 `app/components/AppDateRangePicker.vue`：封裝 `UDatePicker`（或其他 Nuxt UI 日期選擇方案）
    - 支援三個快捷選項：近 7 天、近 30 天、自訂日期區間
    - 自訂日期區間：顯示起始 / 結束日期選擇器
    - emit `update:dateRange` 事件（`{ start: string, end: string }`）
    - 供報表頁與篩選 bar 使用
  - **完成條件**：快捷選項切換正確；自訂日期區間可選擇；emit 事件格式正確

---

- [ ] **T-071** ~~建立營運報表頁（含 5 個圖表 + 懶加載 + CSV 匯出）~~ ⚠️ **本期延後（DEFERRED）**
  - **所屬 Phase**：Phase 5
  - **所屬 Workstream**：WS-G
  - **依賴**：T-052、T-067、T-070
  - > **[延後]** 後端本期不提供 Reports API（`GET /api/v1/admin/reports`）。`app/pages/admin/reports/` 目錄、`AdminLineChart`、`AdminPieChart` 元件、`AppDateRangePicker` 組合報表版本均延後至後期 sprint。`services/api/admin/reports.ts` 本期不建立。

---

### WS-G 測試（Phase 5）

---

- [ ] **T-072** ~~撰寫後台 E2E 測試（Phase 5 維運工具旅程）~~ ⚠️ **部分延後（DEFERRED）**
  - **所屬 Phase**：Phase 5
  - **所屬 Workstream**：WS-G
  - **依賴**：T-068、T-069
  - **實作內容**：
    - 測試檔：`tests/e2e/admin/operations.spec.ts`
    - E2E 旅程「稽核事件查詢」：進入稽核事件列表 → 依類型篩選 → 點擊事件 → 詳情頁顯示上下文
    - ~~E2E 旅程「報表時間範圍切換」~~ **延後（Reports 頁面本期未實作）**
  - **完成條件**：稽核事件查詢旅程通過；Reports 旅程延後至報表頁實作後補充

---

## Phase 6 — 品質完整化

> **目標**：補完 RWD 細化、無障礙、效能優化、i18n fallback 確認、完整測試覆蓋

### WS-H 品質與完整化

---

- [ ] **T-073** 前台 Widget RWD 三斷點精修
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-029
  - **實作內容**：
    - 桌機（≥ 1024px）：Panel 寬 380px，右下角固定，無全螢幕
    - 平板（768–1023px）：Panel 寬 340px，右下角固定
    - 手機（< 768px）：全螢幕展開，底部 Input Bar sticky（`position: sticky; bottom: 0`），Header 固定
    - 確認 ChatPanel 在各斷點下高度正確（手機視口 100dvh，避免 iOS Safari 工具列遮擋）
    - 修正各斷點下可能的 overflow / z-index 問題
  - **完成條件**：三個斷點各自布局符合規格；手機版 Input Bar sticky；iOS Safari 無工具列遮擋問題

---

- [ ] **T-074** 補強前台 Widget 無障礙（Accessibility）
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-029
  - **實作內容**：
    - `ChatPanel`：加 `role="dialog"`、`aria-label="AI 客服聊天室"`、`aria-modal="true"`
    - `ChatMessageArea`：加 `role="log"`、`aria-live="polite"`（新訊息追加時 screen reader 通知）
    - 所有 icon button（收合、送出、讚 / 倒讚、重試）補全 `aria-label`
    - `ChatInputBar` `<textarea>` 加 `aria-label`
    - 鍵盤操作：Tab 導覽所有可互動元素、Enter 送出訊息、Escape 收合 Widget（`@keydown.escape` on ChatPanel）
    - 色彩對比審核（使用 Chrome DevTools 或 axe-core）：確認主要文字 / 背景對比度 ≥ 4.5:1
  - **完成條件**：`role` / `aria-*` 屬性正確設定；鍵盤可完整操作 Widget；對比度審核通過

---

- [ ] **T-075** 補強後台無障礙基礎
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-049
  - **實作內容**：
    - 所有表單欄位的 `<label>` 與 `<input>` 正確關聯（`for` / `id` 或 `aria-labelledby`）
    - `AppModal`（`UModal`）確認 focus trap 運作（開啟 Modal 時 focus 移至 Modal，關閉後 focus 返回觸發元素）
    - `AdminDataTable` 加 `aria-label` 說明表格用途
    - 所有 icon-only 按鈕補全 `aria-label`
  - **完成條件**：後台表單 label 全部正確關聯；Modal focus trap 有效；`aria-label` 補全

---

- [ ] **T-076** 前台 Widget Bundle 效能優化
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-029
  - **實作內容**：
    - 確認 `ChatWidget` 使用 `defineAsyncComponent` 懶加載（僅在需要時載入聊天相關 JS）
    - 執行 `npm run build` 後分析 bundle（`nuxt analyze` 或 `rollup-plugin-visualizer`），確認 Widget 初始 bundle gzipped ≤ 100KB（不含圖表 library）
    - 確認報表頁圖表元件確實懶加載（不在 initial bundle 中）
    - 若 bundle 超標，識別最大貢獻者並進行分割（code splitting）
  - **完成條件**：`npm run build` 成功；Widget 初始 bundle gzipped ≤ 100KB；報表圖表在 Network tab 中確認為延遲載入

---

- [ ] **T-077** 後台 admin layout 在中寬螢幕的導覽列收合行為
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-049
  - **實作內容**：
    - 在 1024–1279px 螢幕寬度下，左側導覽列自動收合為 icon-only（寬 60px），hover 展開
    - 或：1024–1279px 下左側導覽列隱藏，改為頂部 hamburger menu（TBD 擇一方式）
    - 確認主內容區在收合時正確填滿剩餘空間
    - 在 768px 以下不顯示後台（後台不需支援手機版，顯示「請使用桌機瀏覽」提示即可）
  - **完成條件**：1024–1279px 下導覽列收合或隱藏行為確定並實作；768px 以下顯示提示；無布局破壞

---

- [ ] **T-078** i18n 第三語系 fallback 機制驗證
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-042
  - **實作內容**：
    - 在 `nuxt.config.ts` i18n 設定加入 `fallbackLocale: 'zh-TW'`（或確認現有設定包含此項）
    - 建立 `i18n/locales/test-lang/common.json`（測試用第三語系），只填入部分 key（模擬缺少翻譯）
    - 確認缺少翻譯的 key 會 fallback 至 zh-TW 對應文案，而非顯示 key 名稱
    - 驗證完成後刪除 `test-lang` 目錄，確認現有 zh-TW / en 的 key 結構完整
  - **完成條件**：第三語系缺少 key 時 fallback 至繁中；無 i18n 警告或顯示 key 名稱

---

- [ ] **T-079** 補完 `utils/markdown.ts` 單元測試
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-012
  - **實作內容**：
    - 測試檔：`tests/unit/utils/markdown.test.ts`
    - 測試案例：
      - `**粗體**` → 輸出含 `<strong>` 的 HTML
      - `- 條列項目` → 輸出含 `<ul><li>` 的 HTML
      - `[連結](https://example.com)` → 輸出含 `<a href>` 的 HTML
      - XSS 注入嘗試（`<script>alert()</script>`）→ 輸出中不含 `<script>`（確認 sanitize 有效）
  - **完成條件**：四個測試案例通過；XSS 防禦確認

---

- [ ] **T-080** 補完 `useHandoff` 單元測試
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-038
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/useHandoff.test.ts`
    - 測試案例（對應本期簡化版）：
      - `requestHandoff()` 後 `handoffState` 轉為 `'requesting'`，API 呼叫發出
      - API 成功 → `handoffState` 轉為 `'transferred'`
      - API 失敗 → `handoffState` 回到 `'idle'`，顯示錯誤
    - ~~Polling 相關測試~~ **已移除**（本期無 polling）
  - **完成條件**：三個測試案例通過；無 polling timer mock 需求

---

- [ ] **T-081** 補完 `useFeedback` 單元測試
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-040
  - **實作內容**：
    - 測試檔：`tests/unit/features/chat/useFeedback.test.ts`
    - 測試案例：
      - `submitFeedback(token, messageId, 'up')` → `POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback` 被呼叫，帶入正確參數
      - 樂觀更新：呼叫後 `ChatMessageVM.rating` 即時更新為 `'up'`（不等待 API 回應）
      - `submitFeedback(token, messageId, 'down', reason)` → API 帶入 `reason` 參數
      - 再次送出相同 type → `rating` 切回 `null`（取消）
      - API 失敗（mock 500）→ console error 記錄；`rating` 狀態仍保持更新（fire-and-forget，不 rollback）
  - **完成條件**：五個測試案例通過；API 呼叫斷言正確；fire-and-forget 行為驗證

---

- [ ] **T-082** 補完元件測試（`ChatLauncher`、`ChatInputBar`、`AiStreamingItem`、`SystemInterceptedItem`）
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-017、T-020、T-028
  - **實作內容**：
    - `ChatLauncher` 測試（`tests/unit/features/chat/ChatLauncher.test.ts`）：
      - `mode = 'normal'`、config `status: 'online'` → 狀態燈綠色
      - `mode = 'normal'`、config `status: 'degraded'` → 狀態燈紅色
      - `mode = 'fallback'` → 狀態燈灰色，降級文案顯示
      - 點擊後 `useChatWidgetStore.setOpen` 被呼叫
    - `ChatInputBar` 測試（`tests/unit/features/chat/ChatInputBar.test.ts`）：
      - 輸入超過 500 字 → 顯示字數警告
      - Enter 鍵觸發 emit `submit`
      - `streamingState = 'streaming'` → 按鈕 disabled
      - `mode = 'fallback'` → 整個 bar disabled
    - `AiStreamingItem` 測試（`tests/unit/features/chat/AiStreamingItem.test.ts`）：
      - token append 後內容更新
      - 打字游標 `.cursor` element 存在
    - `SystemInterceptedItem` 測試（`tests/unit/features/chat/SystemInterceptedItem.test.ts`）：
      - `metadata.interceptType = 'secret'` → 顯示鎖頭 icon + 機密文案
      - `metadata.interceptType = 'injection'` → 顯示盾牌 icon + Injection 文案
  - **完成條件**：四個元件各測試案例全數通過

---

- [ ] **T-083** 補完 `AppStatusBadge` 元件測試
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-050
  - **實作內容**：
    - 測試檔：`tests/unit/components/AppStatusBadge.test.ts`
    - 測試案例：
      - `status = 'active'` → green badge
      - `status = 'pending'` → yellow badge
      - `status = 'error'` → red badge
      - `status = 'inactive'` → gray badge
  - **完成條件**：四個測試案例通過；色彩對應語意正確

---

- [ ] **T-084** 補完前台 E2E 測試（Phase 6 補充旅程）
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-034、T-048、T-029
  - **實作內容**：
    - 測試檔：`tests/e2e/chat/widget-quality.spec.ts`
    - E2E 補充旅程「串流 Timeout 處理」：mock 串流 API 不回應 → 30 秒後（使用 Playwright 快進時間或短 mock timeout）→ `SystemTimeoutItem` 顯示 → 點擊重試 → 新串流開始
    - E2E 補充旅程「機密攔截顯示」：mock 後端回傳 `type: 'system-intercepted'` → `SystemInterceptedItem` 以鎖頭 icon + 正確文案顯示
    - E2E 補充旅程「RWD 手機版布局」：375px viewport → 展開 Widget → 確認全螢幕覆蓋、Input Bar sticky
  - **完成條件**：三個補充旅程通過

---

- [ ] **T-085** 最終整合驗收：執行全部測試 + build 確認
  - **所屬 Phase**：Phase 6
  - **所屬 Workstream**：WS-H
  - **依賴**：T-030 ～ T-084（所有測試任務）
  - **實作內容**：
    - 執行 `npm run test`（Vitest）確認所有單元 / 元件測試通過
    - 執行 `npx playwright test` 確認所有 E2E 旅程通過（三個 viewport）
    - 執行 `npm run build` 確認 TypeScript 編譯無錯誤、build 成功
    - 手動在 Chrome / Safari / Firefox 最新版確認前台 Widget 正常顯示
    - 確認 bundle 中不含敏感設定（無 API Key、無 OpenAI key）
    - 對照 `plan.md` Section 11「Definition of Done」逐項確認
  - **完成條件**：所有 Vitest 測試通過；所有 Playwright E2E 通過；`npm run build` 成功；plan.md DoD 全部勾選

---

## 里程碑檢查點

| 里程碑              | 對應任務完成   | 可驗證產出                                                                                                                       |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **M0** Phase 0 完成 | T-001 ～ T-015 | `npm run dev` 可啟動；主題設定完成；API client + types + stores 就緒；「進入後台」按鈕可用（導向 `/admin/dashboard`）；Nuxt Charts 折線圖與圓餅圖可正常渲染 |
| **M1** Phase 1 完成 | T-016 ～ T-034 | 前台 Widget 可互動 MVP；多輪對話（KB mock 回覆）；reset / rating / quick-reply 互動；session 恢復；降級模式；P0 單元測試 + E2E 通過 |
| **M2** Phase 2 完成 | T-034B ～ T-048 | KB mock 切換為真實 `fetch + ReadableStream` SSE 串流；留資（name+email 必填，`company?` / `phone?` / `message?` 選填，`language?` 自動帶入語系）、轉人工（簡化靜態，`{ accepted, action, ... }` 回應）、Feedback API 正式串接（`POST .../messages/:messageId/feedback`，payload `{ value: 'up'|'down' }`，fire-and-forget）、語系切換、埋點；Phase 2 E2E 通過 |
| **M3** Phase 3 完成 | T-049 ～ T-057 | 後台基礎頁面可用（Dashboard + 對話紀錄 + Lead + Ticket）；後台 E2E 通過（Dashboard 載入 + 對話查詢 + Lead + Ticket） |
| **M4** Phase 4 完成 | T-058 ～ T-066 | 後台內容管理完整（知識庫版本歷史 + 批次匯入；意圖側抽屜；快捷提問拖曳；Widget 即時預覽）；Phase 4 E2E 通過 |
| **M5** Phase 5 完成 | T-067 ～ T-072 | 後台維運工具（稽核事件 + 回饋紀錄（`GET /api/v1/admin/feedback`）；**Reports 延後**）；Phase 5 E2E 通過（Reports 旅程延後） |
| **M6** Phase 6 完成 | T-073 ～ T-085 | 全系統品質達標；所有測試通過；build 成功；plan.md DoD 全勾 |

---

## 任務統計

| Phase    | 任務數                           | 涵蓋 Workstream |
| -------- | -------------------------------- | --------------- |
| Phase 0  | T-001 ～ T-015（15 個）          | WS-A            |
| Phase 1  | T-016 ～ T-034（19 個）          | WS-B、WS-C      |
| Phase 2  | T-034B、T-035 ～ T-048（15 個）  | WS-D            |
| Phase 3  | T-049 ～ T-057（9 個）           | WS-E            |
| Phase 4  | T-058 ～ T-066（9 個）           | WS-F            |
| Phase 5  | T-067 ～ T-072（6 個）           | WS-G            |
| Phase 6  | T-073 ～ T-085（13 個）          | WS-H            |
| **合計** | **86 個任務**                    | WS-A ～ WS-H    |

# Design — 震南官網 AI 客服聊天機器人前端系統

**Feature Branch**: `001-ai-chatbot-frontend-system`  
**Created**: 2026-03-30  
**Status**: Draft  
**Based on**: spec.md v1

---

## 技術棧（Tech Stack）

| 類別 | 技術 |
|------|------|
| 框架 | Nuxt 4 |
| UI 元件庫 | Nuxt UI（v4，基於 Reka UI + Tailwind CSS） |
| 樣式系統 | Tailwind CSS v4 |
| 語言 | TypeScript |
| 狀態管理 | Pinia |
| 表單驗證 | vee-validate |
| 串流 | SSE（EventSource / Fetch ReadableStream，TBD） |
| 圖表 | Nuxt Charts |
| 測試 | Vitest + Vue Test Utils + Playwright |

### 技術棧使用原則

**Nuxt UI 優先**：所有通用 UI 需求優先查找 Nuxt UI 的對應元件（`UButton`、`UInput`、`UModal`、`UTable`、`UBadge` 等），確認無法滿足再考慮自訂。不重複實作已有的通用元件。

**Tailwind CSS 負責 layout 與局部樣式**：Tailwind utility class 用於 spacing、layout（flex / grid）、breakpoints、sticky / fixed 定位、狀態色（hover / disabled / focus）、局部視覺調整。避免在元件中散落大量自訂 scoped CSS。

**品牌色與主題透過 Nuxt UI app config 統一管理**：主色、accent 色、語意色（success / warning / error）透過 `app/app.config.ts` 的 Nuxt UI theme token 集中設定，不在各元件中直接寫死顏色值。

**訊息型元件需自訂實作**：前台 chat 訊息氣泡、串流動畫、攔截提示等高度 domain-specific 的元件，不強求套用通用 UI 元件，以 Tailwind utility 組合完成，保留設計彈性。

**圖表層選用 Nuxt Charts**：本專案採用 Nuxt 4 + Nuxt UI + Tailwind CSS，圖表層選擇 Nuxt Charts，以降低整合成本並維持 Nuxt 生態一致性。後台所有折線圖（`AdminLineChart`）與圓餅圖（`AdminPieChart`）均以 Nuxt Charts 的對應元件實作，不引入 Chart.js、vue-chartjs 或 echarts。

---

## 1. 設計目標與範圍

本 design.md 的任務是將 spec.md 中定義的產品需求，轉譯為可落地實作的前端技術設計文件。文件將聚焦於：

1. **前台聊天 Widget 的完整互動與狀態設計**，確保 AI 客服體驗優先、可降級、可追溯
2. **後台管理介面的最小可用設計**，以支撐 AI 客服日常營運為主，不做複雜的企業治理流程
3. **整體前端架構的模組切分**，讓單人開發者可以按 Phase 分批實作

### 本期設計明確排除的範圍

以下項目在本期設計中一律視為「暫不實作」，即使 spec 中仍有殘留描述，設計文件均不採納：

- RBAC、角色權限矩陣、細粒度 action-level 權限
- 多角色（管理者 / 編輯 / 審核者 / 檢視者）差異
- 知識庫送審 / 核准 / 退回流程
- 403 無權限頁面
- 多角色導向登入後路由
- 帳號管理 / IAM / SSO / LDAP

後台本期設計原則：**單一管理者可操作所有功能。**

---

## 2. 設計原則

### 2.1 安全優先

前端永遠不持有、不傳遞、不顯示任何 OpenAI API Key 或後端機密設定。所有 AI 回覆均透過自有後端 API 中轉。後台本期不設置登入驗證，供開發與展示使用。

### 2.2 聊天體驗優先

前台 Widget 的互動體驗是產品核心。串流回覆、狀態轉換、錯誤恢復、降級模式等設計必須在任何網路條件下都能給出明確的 UI 回饋，不允許空白或無回應狀態。

### 2.3 可降級

AI 服務不可用時，Widget 不能消失，也不能顯示無意義的錯誤頁。降級模式要保留聯絡捷徑與留資入口，讓訪客仍有轉換路徑。

### 2.4 MVP First

功能按 Phase 分批實作。Phase 1 只做聊天核心，Phase 2 加入留資與後台基礎，後續 Phase 再補完管理功能。每個 Phase 均可獨立上線。

### 2.5 高可追溯性

每則對話、每個攔截事件、每筆回饋，都需有完整的資料路徑可從前台追溯到後台。訊息 ID、session ID、event ID 在前台 UI 與後台查詢介面間需能對應。

### 2.6 對單人開發者友善

模組切分要有清楚的邊界，不過度拆分。優先使用 Nuxt / Vue 原生能力，減少不必要的抽象層。composables 優先於複雜的 store，store 只有在跨元件共享才引入。

### 2.7 可維護性

i18n 資源、Widget 文案、快捷提問均走後台設定，不硬編碼在前端。元件責任單一，避免萬用元件。錯誤處理集中在 API client 層，不分散在各頁面。

---

## 3. 整體前端架構

### 3.1 專案結構策略

本專案採用**單一 Nuxt 4 專案**同時承載前台 Widget 與後台 Admin，理由如下：

- 共用 API client、types、utils、i18n 資源，減少重複維護
- 共用 Nuxt plugins（vee-validate、toast、UI library）
- 後台與前台僅路由不同，不需要兩個獨立部署單元
- 單人開發維護成本最低

前台 Widget 本期以**內嵌頁面形式**開發（即在 Nuxt 路由中有一個前台專用的 route 入口），後續可依需求抽離為 Web Component 或 iframe 嵌入形式（TBD）。

### 3.2 路由分層

```
/                       → 前台 Widget 頁面（含「進入後台」連結按鈕）
/chat                   → 前台聊天 Widget 主入口（可全頁面展示用於測試）
/admin                  → 自動導向 /admin/dashboard
/admin/dashboard        → 後台 Dashboard
/admin/knowledge        → 知識庫管理列表
/admin/knowledge/:id    → 知識庫條目編輯
/admin/conversations    → 對話紀錄列表
/admin/conversations/:id → 對話紀錄詳情
/admin/leads            → Lead 管理列表
/admin/leads/:id        → Lead 詳情
/admin/tickets          → Ticket 管理列表
/admin/tickets/:id      → Ticket 詳情
/admin/intents          → 意圖 / 模板管理
/admin/quick-replies    → 快捷提問管理
/admin/widget-settings  → Widget 文案與設定管理
/admin/audit            → 稽核事件列表
/admin/audit/:id        → 稽核事件詳情
/admin/feedback         → 回饋紀錄
/admin/reports          → 營運報表
```

### 3.3 Layout 分層

- `layouts/default.vue`：官網訪客前台使用，極簡 layout，僅提供 Widget 掛載點，不含後台導覽
- `layouts/admin.vue`：後台使用，含左側導覽列、頂部 topbar（管理者資訊）、主內容區
- `error.vue`：全域錯誤頁（404、500）

後台所有 `/admin/**` 路由均使用 `admin.vue` layout，無需登入驗證，直接可存取。

### 3.4 Domain 模組切分

前端採以 **feature / domain** 為主的組織方式，區分為兩個核心 domain：

**chat domain（前台）**
- Widget 的 UI 狀態、session 狀態、訊息列表、快捷提問、留資、轉人工、回饋、降級
- 對應 `app/features/chat/` 目錄

**admin domain（後台）**
- 知識庫、對話紀錄、Lead/Ticket、意圖/模板、快捷提問、Widget 設定、稽核、報表
- 對應 `app/features/admin/` 目錄

**shared（共用）**
- API client、error handler、i18n、analytics、UI 基礎元件
- 對應 `app/composables/`、`app/services/`、`app/components/`、`app/utils/`

### 3.5 各層責任分界

| 層級 | 職責 |
|------|------|
| `pages/` | 路由對應頁面，只做資料組裝與 layout 編排，不含商業邏輯 |
| `features/chat/` | 前台 chat domain 的元件、composables、store |
| `features/admin/` | 後台 admin domain 的元件、composables、store |
| `components/` | 跨 domain 共用的純 UI 元件（Button、Modal、Table 等） |
| `composables/` | 跨 domain 共用的邏輯（useAppToast、useFormat、useModal 等） |
| `services/` | API 呼叫封裝，對應後端 API 路徑，不含 UI 邏輯 |
| `stores/` | 跨元件共享的持久狀態（widget config store） |
| `middleware/` | 不設置路由守衛，後台路由無需登入可直接存取 |
| `plugins/` | 第三方 library 初始化 |
| `utils/` | 純函數工具（format、type guard 等） |
| `types/` | TypeScript type / interface 定義 |
| `i18n/locales/` | 多語系資源 |

### 3.6 i18n 策略

- 靜態基礎文案放在 `i18n/locales/zh-TW/` 與 `i18n/locales/en/`
- Widget 動態文案（歡迎訊息、CTA 文案、免責聲明）從後台 Widget Config API 取得後覆蓋靜態文案
- 快捷提問文案完全由後台 API 提供，不放靜態 i18n 資源
- 第三語系預留擴充接口（i18n locale key 保留，實際翻譯 TBD）

---

## 4. 路由與資訊架構

### 4.1 前台資訊架構

前台 Widget 並非傳統多頁面應用，而是一個**浮動在官網上層的單一聊天元件**，採狀態驅動的 UI 模式：

```
Widget 收合態（Launcher）
  └─ 點擊展開
Widget 展開態（Chat Panel）
  ├─ Header（品牌 / 狀態 / 語系切換 / 關閉）
  ├─ Info Bar（聯絡捷徑）
  ├─ Message Area（對話訊息區）
  │   ├─ 歡迎訊息
  │   ├─ 使用者訊息氣泡
  │   ├─ AI 回覆氣泡（含串流 / 錯誤 / 攔截 / 低信心度狀態）
  │   ├─ Lead Form 卡片（inline）
  │   └─ Handoff 狀態卡片（inline）
  ├─ Quick Replies Bar（快捷提問）
  ├─ Input Bar（輸入框 + 送出）
  └─ Disclaimer（頁尾說明）
```

### 4.2 後台資訊架構

後台為標準的管理後台結構，左側導覽列固定，右側為各功能頁面：

```
後台（含左側導覽）
  ├─ Dashboard
  ├─ 知識庫管理
  │   ├─ 列表（篩選 / 搜尋 / 匯入）
  │   ├─ 新增 / 編輯條目
  │   └─ 版本歷史
  ├─ 對話紀錄
  │   ├─ 列表（篩選 / 搜尋 / 匯出）
  │   └─ 詳情
  ├─ Lead 管理
  │   ├─ 列表
  │   └─ 詳情 / 狀態更新
  ├─ Ticket 管理
  │   ├─ 列表
  │   └─ 詳情 / 狀態更新
  ├─ 意圖 / 模板管理
  │   ├─ 列表
  │   └─ 新增 / 編輯
  ├─ 快捷提問管理
  ├─ Widget 設定（含即時預覽）
  ├─ 稽核事件
  │   ├─ 列表
  │   └─ 詳情
  ├─ 回饋紀錄
  └─ 營運報表
```

### 4.3 前台進入後台的入口按鈕

本期後台**不設置登入驗證**，供開發展示與快速迭代使用。為方便從前台直接導航至後台，前台頁面（`/` 或 `/chat`）提供一個低調的「後台管理」入口按鈕。

**按鈕設計**：
- 位置：前台頁面右上角或頁面底部角落（固定定位，不影響 Widget）
- 樣式：細小低調的 `UButton` variant="ghost"，文字為「後台管理」或齒輪 icon
- 點擊行為：`navigateTo('/admin/dashboard')`，直接進入後台 Dashboard，無需任何驗證

**不設置 middleware**：
- 不建立 `middleware/` 目錄下的任何路由守衛
- 後台所有 `/admin/**` 路由均可直接存取，無需登入
- `stores/` 中不建立 `adminAuth.ts`，不需要 auth store

**未來擴充**（本期暫不實作）：若後續需要加入登入保護，可新增 `middleware/admin-auth.ts` 具名 middleware 並套用至後台頁面，不影響現有前台路由設計。

---

## 5. 前台 Widget / Chat Panel 設計

### 5.1 Widget 收合態（Launcher）

Launcher 以 `position: fixed; bottom: 24px; right: 24px; z-index: 9999` 掛載於官網 DOM，不受官網頁面捲動影響。

**桌機版（≥ 768px）**：膠囊型 CTA，由左側圓形狀態燈 + 文案組成。
- 狀態燈顏色：綠色（線上）、黃色（繁忙）、灰色（離線 / 降級）
- 預設文案：「AI 客服在線，立即諮詢」（由 Widget Config 提供，支援多語系）
- 降級狀態文案：「客服諮詢（留言）」

**手機版（< 768px）**：縮小為圓型 FAB，顯示品牌 icon，狀態燈維持於右上角。

Launcher 本身不含任何 AI 呼叫，僅根據 Widget Config 初始化時帶回的 `status` 欄位決定顯示狀態。

### 5.2 Widget 展開態

展開時以 CSS transition / animation 執行滑入效果。

**桌機版（≥ 1024px）**：右側固定浮動 Panel，`width: 380px`（TBD），`height: 80vh`，`max-height: 700px`。Panel 不遮擋整個畫面，使用者可繼續瀏覽官網。

**平板版（768px–1023px）**：同桌機版，`width: 340px`。

**手機版（< 768px）**：全螢幕覆蓋，使用 fixed 定位，`inset: 0`，底部輸入區 sticky 固定。展開時對背景頁面加 `overflow: hidden`，收合時還原。

展開後立即執行 Widget 初始化流程（見第 9 節）。

### 5.3 聊天面板各區域設計

#### Header

固定於面板頂部，高度 56px。
- 左側：品牌 logo（16x16）+ 品牌名稱（震南企業）+ AI badge 標籤
- 中間：線上狀態文字（線上 / 繁忙 / 暫時無法使用）
- 右側：語系切換 icon button + 關閉 icon button

語系切換以下拉選單呈現（zh-TW / en），切換後所有 Widget 文案即時更新。

#### Info Bar（聯絡捷徑列）

固定於 Header 下方，高度 48px，水平排列最多 3 個捷徑。捷徑圖示為圓形 icon button，帶文字標籤。
- 電話：點擊觸發 `tel:` 協議
- 官網：點擊新開分頁連結
- 地點：點擊開啟 Google Maps URL

捷徑設定由後台 Widget Config 提供，若某捷徑未設定則不顯示。Info Bar 內容不隨 AI 狀態變更而消失。

#### Message Area（對話訊息區）

可滾動區域，`flex-direction: column`，新訊息追加至底部，自動 scroll to bottom。

訊息對齊規則：
- 使用者訊息：靠右，背景色為品牌主色淺版
- AI 訊息：靠左，含 AI avatar（品牌 icon 16px），背景色為灰白色
- 系統訊息（攔截提示、降級訊息、轉人工狀態）：置中，以特殊樣式區分

訊息時間以相對格式（剛剛 / N 分鐘前 / 今天 HH:MM）顯示於氣泡底部。

每則 AI 回覆訊息底部顯示 Feedback 區域（讚 / 倒讚 icon button）。

#### Quick Replies Bar（快捷提問列）

系統採用**兩層 chips 架構**，職責分離：

**Layer 1 — 全域 Quick Replies Bar（`ChatQuickReplies` 元件）**
- 位於 Message Area 與 Input Bar 之間，水平橫向捲動排列
- 資料來源：`useWidgetConfigStore.config?.quickReplies`（後台 Widget Config API 提供）
- 只在對話重置後或第一次開啟時顯示（`quickRepliesVisible === true`）
- 點擊後直接以使用者身份送出訊息，同時快捷提問列收起（設 `hidden`）
- 對話重置時（使用者點擊「重新開始對話」）重新顯示
- **Phase 1 注意**：`config` 為 null 時此列不顯示；快捷提問以 per-message chips（Layer 2）替代

**Layer 2 — Per-message Quick-reply Chips（`AiMessageItem` 內嵌）**
- 資料來源：`ChatMessageVM.quickReplies?: string[]`（來自 `useKnowledgeBaseStore.query()` 回傳，Phase 2 改為 API 提供）
- 附加於特定 `ai` 型訊息氣泡下方，僅對應訊息有 `quickReplies` 陣列時才顯示
- 點擊後等同使用者輸入該文字送出，透過 `'quick-reply'` 事件鏈往上傳遞至 `ChatWidget`
- 歡迎訊息的 per-message chips 由 `useChatSession._appendWelcomeMessage()` 透過 `kbStore.getWelcomeQuickReplies()` 注入

#### Input Bar（輸入區）

固定於面板底部 Input Bar 區塊，高度自適應（含 disclaimer 共約 96px）。
- 文字輸入框：預設單行，輸入超過 80 字元後自動展開為最多 4 行，最大 500 字
- 字數計數器：剩餘 50 字以內時顯示紅色字數警示
- 送出按鈕：未輸入時 disabled，輸入中啟用
- 等待 AI 回覆期間：輸入框 disabled + placeholder 改為「AI 回覆中...」，顯示取消按鈕
- 取消按鈕：點擊後中止串流請求，清除 pending 狀態

Enter 鍵送出，Shift+Enter 換行。

#### Disclaimer（頁尾說明）

固定一行小字，文案由 Widget Config 提供，預設：「本服務由 AI 提供，回覆僅供參考，如需確認請聯繫客服。」

### 5.4 Message Type 設計

前台訊息區支援以下訊息類型，由 `type` 欄位決定渲染元件：

| type | 說明 | 渲染元件 |
|------|------|---------|
| `user` | 使用者輸入的訊息 | `UserMessageItem` |
| `ai` | AI 完整回覆（支援 Markdown、含 feedback 按鈕與 per-message quick-reply chips） | `AiMessageItem` |
| `ai-streaming` | AI 串流中的回覆（逐字動畫） | `AiStreamingItem` |
| `system-intercepted` | 機密攔截或 Prompt Injection 攔截訊息 | `SystemInterceptedItem` |
| `system-low-confidence` | 低信心度補充提示 | `SystemLowConfidenceItem` |
| `system-error` | 回覆失敗提示（含重試按鈕） | `SystemErrorItem` |
| `system-timeout` | Timeout 提示（含重試按鈕） | `SystemTimeoutItem` |
| `system-fallback` | 降級模式提示 | `SystemFallbackItem` |
| `lead-form` | 留資表單卡片（inline）— Phase 2 | `LeadFormCard`（Phase 2） |
| `handoff-status` | 轉人工狀態卡片（inline）— Phase 2 | `HandoffStatusCard`（Phase 2） |

`ChatMessageVM` 除基本欄位（`id`、`type`、`content`、`timestamp`、`metadata`）外，另有：
- `quickReplies?: string[]`：附加於 `ai` 型訊息，渲染 per-message quick-reply chips
- `rating?: FeedbackValue`（`null | 'up' | 'down'`）：訊息層級的回饋狀態，直接存於訊息物件，Phase 1 為本地狀態，Phase 2 串接 feedback API

### 5.5 串流回覆狀態機

AI 回覆的串流狀態以有限狀態機管理：

```
idle
  → sending（使用者送出訊息）
    → streaming（收到第一個 token）
      → completed（串流結束）
      → interrupted（串流中斷，顯示部分內容 + 重試）
      → timeout（30 秒無 token，顯示 timeout 訊息 + 重試）
    → error（API 失敗，顯示 error 訊息 + 重試）
  → cancelled（使用者點擊取消）
    → idle
```

串流進行中：逐字 append token 至 `AiStreamingItem` 的文字內容，搭配 CSS 打字游標動畫。
串流完成後：`ai-streaming` type 轉換為 `ai-text` type，渲染完整 Markdown 內容，並顯示 Feedback 按鈕。

### 5.6 Loading / Error / Retry / Timeout / Interrupted 狀態

**Loading（streaming）**：在訊息列表底部顯示 AI avatar + 三點跳動動畫，直到第一個 token 出現後替換為 `AiStreamingItem`。

**Error**：訊息列表底部出現 `SystemErrorItem`，顯示「訊息傳送失敗，請重試」+ 重試 icon button。點擊重試後移除此訊息，重新送出上一則使用者訊息。

**Timeout**：30 秒計時器在 `sending` 狀態啟動，超時後觸發 timeout 狀態，顯示 `SystemTimeoutItem`。

**Interrupted**：SSE / WebSocket 連線意外中斷，串流已輸出部分內容，顯示部分文字 + 底部附加「回覆不完整，請重試」提示 + 重試按鈕。

**重試邏輯**：重試時不重新建立 session，直接以相同 session ID 重送最後一則使用者訊息。

### 5.7 機密攔截與 Prompt Injection 攔截 UI

後端回傳特殊的訊息 type 或 status code 時，前端渲染 `SystemInterceptedItem`：

- 機密攔截：氣泡顯示鎖頭圖示 + 「此問題涉及機密資訊，無法回覆，如有需要請直接聯繫客服。」+ 聯絡按鈕（觸發 Info Bar 對應的電話或表單）
- Prompt Injection：盾牌圖示 + 「您的問題無法被處理，請重新提問。」

兩種攔截均使用警告色（橘或黃）背景氣泡，與一般 AI 回覆明顯區隔。攔截後 session 繼續，使用者可繼續提問。

### 5.8 低信心度提示

後端標記某則回覆的信心度低於門檻時，`ai-text` 訊息底部附加 `SystemLowConfidenceItem` inline 提示條，文案：「以上回覆僅供參考，建議直接聯繫客服確認」，附聯絡捷徑按鈕。此提示與 Feedback 按鈕共存，不互相干擾。

### 5.9 留資表單卡片（Lead Form Card）

觸發條件：訪客主動詢問報價 / 要求聯絡 / AI 主動引導時，由後端回應中帶入特殊 type，前端於對話串中渲染 `LeadFormCard`。

表單設計：
- 表單以白色卡片形式嵌入訊息流中
- 必填：姓名、公司名稱、電話 或 Email（至少填寫一個）
- 選填：詢問品項（文字）、備註
- 欄位即時驗證（失焦後觸發）
- 提交按鈕：所有必填完成後啟用
- 提交中：按鈕 loading 狀態，欄位鎖定
- 提交成功：卡片轉為確認訊息（「感謝您的留言，我們將盡快與您聯繫。」），卡片不可再次編輯
- 提交失敗：顯示 inline 錯誤提示，按鈕恢復可點擊
- 同一 session 已成功提交後，再次觸發留資只顯示「已登記」提示，不顯示新表單

### 5.10 轉人工客服（Handoff）狀態設計

觸發條件（任一）：
1. 使用者主動說「我要找人工客服」等語意
2. AI 連續 N 次（TBD：3 次）回覆失敗
3. 後端回應標記 `handoff: true`

狀態流轉：

```
normal（一般對話）
  → handoff-requested（前端送出轉接請求，顯示「正在為您轉接...」）
    → handoff-waiting（等待真人接線，顯示等待中提示）
    → handoff-connected（已接線，顯示「已成功轉接」，進入外部系統）
    → handoff-unavailable（無真人客服 / 非服務時間）
```

`HandoffStatusCard` 在訊息流中以特殊卡片呈現目前狀態：
- `handoff-unavailable`：顯示服務時間（由 Widget Config 提供）+ 引導留資按鈕

轉接成功後，Input Bar 鎖定，顯示「已連接至人工客服，請稍候」，後續訊息由外部系統介接（前端僅更新 UI 狀態，TBD：透過 polling 或 webhook）。

### 5.11 降級模式（Fallback Mode）

觸發時機：Widget 初始化時從 Widget Config API 取得 `status: 'offline'`，或 session 建立 API 失敗。

進入降級模式後：
- Launcher 顯示灰色狀態燈 + 降級文案
- Chat Panel 展開後訊息區顯示 `SystemFallbackItem`：「AI 客服暫時無法使用，請留言或電話聯繫」
- Info Bar 的聯絡捷徑仍顯示並可點擊
- Quick Replies 仍顯示，點擊後顯示引導留資的提示
- Input Bar 顯示「目前無法傳送訊息」placeholder，送出按鈕 disabled
- Lead Form 入口可用（直接顯示留資卡片，不需 AI 觸發）

降級模式下，每 60 秒重新 ping Widget Config API，若服務恢復則自動解除降級。

### 5.12 Session 恢復在 UI 上的呈現

頁面載入時，前台 Widget 初始化流程：

1. 讀取 `localStorage.getItem('chat_session_token')`
2. 若存在，呼叫對話歷史 API（帶入 session token）
3. 歷史 API 回傳成功：將歷史訊息載入訊息列表，顯示「歡迎回來」提示（或直接顯示歷史訊息，不額外提示，TBD）
4. 歷史 API 回傳 session 已過期（401 / 404）：清除 localStorage 的舊 token，重新建立新 session，顯示歡迎訊息
5. 無 localStorage token：直接建立新 session，顯示歡迎訊息與快捷提問

### 5.13 滿意度回饋

每則 `ai` 訊息底部右側顯示 👍 / 👎 icon button（灰色預設），**直接內嵌於 `AiMessageItem`**，不另外建立獨立的 `MessageFeedback` 元件。

回饋狀態以 `ChatMessageVM.rating: FeedbackValue`（`null | 'up' | 'down'`）直接附在訊息物件上管理。

**Phase 1（目前實作）**：
- 點擊讚 / 倒讚：呼叫 `useChat.rateMessage(messageId, value)`，直接更新 store 中對應訊息的 `rating` 欄位
- 再次點擊相同值：重置為 `null`（取消評分）
- 純本地狀態，無 API 呼叫

**Phase 2（待實作）**：
- 點擊後呼叫 feedback API（`POST /api/chat/feedback`）
- 點擊倒讚後可展開原因選填
- 回饋採 fire-and-forget，失敗不影響主對話流

### 5.14 多語系切換

語系狀態儲存於 `localStorage.getItem('chat_locale')` 並在初始化時讀取。預設為 `zh-TW`。

切換語系後：
- i18n locale 更新，所有靜態文案即時更新
- 快捷提問重新取對應語系的文案（從已載入的 Widget Config 中取）
- 若有進行中的對話，對話記錄保留（訊息本身不重新翻譯，僅 UI 文案更新）

### 5.15 重新開始對話

Header 或訊息區提供「重新開始對話」入口（TBD：位置為 header 選單或訊息區底部按鈕）。

點擊後：
1. 清除當前 session token（localStorage 移除）
2. 清空訊息列表
3. 呼叫建立新 session API
4. 顯示歡迎訊息與快捷提問

---

## 6. 後台 Admin 設計

後台為單一管理者使用的操作介面。本期**不設置登入驗證**，所有後台頁面均可直接存取，適合開發展示與快速迭代。後續若需加入登入保護，可獨立擴充，不影響前台設計。

### 6.1 Dashboard

路由：`/admin/dashboard`

上方統計卡片列（5 個）：
- 今日對話數
- 本月對話數
- AI 自助解答率（百分比）
- 待處理 Ticket 數（含連結至 Ticket 列表，篩選未處理）
- 本月新增 Lead 數（含連結至 Lead 列表）

中間圖表區（2 欄）：
- 左：近 7 / 30 天對話量趨勢折線圖（切換 tab 控制天數）— `AdminLineChart`，使用 Nuxt Charts 折線圖元件
- 右：近 30 天意圖分布圓餅圖（產品詢問 / 技術支援 / 報價 / 其他）— `AdminPieChart`，使用 Nuxt Charts Donut / 圓餅圖元件

下方：最新 5 筆稽核事件列表（僅顯示事件類型、時間、Session ID），可點擊跳至稽核事件詳情。

所有數據均從後端 Dashboard API 取得，Dashboard 載入時一次取得所有統計資料，不做即時 refresh（TBD：手動 refresh 按鈕）。

空狀態：若無任何資料，卡片顯示 0，圖表顯示空狀態插圖 + 文字說明。

### 6.2 知識庫管理

路由：`/admin/knowledge`（列表）、`/admin/knowledge/new`（新增）、`/admin/knowledge/:id`（編輯）

**列表頁**：
- 表格欄位：標題、分類、狀態（草稿 / 已發佈 / 已停用）、最後更新時間、操作（編輯 / 刪除）
- 篩選列：分類下拉、狀態下拉、關鍵字搜尋框（即時搜尋，debounce 300ms）
- 頂部操作：新增條目按鈕、批次匯入按鈕
- 刪除需二次確認 Modal

**編輯頁**：
- 標題輸入（必填）
- 分類選擇（下拉，含新增分類入口）
- 狀態切換（草稿 / 已發佈 / 已停用）
- 內容編輯器（TBD：Markdown 編輯器，含預覽切換）
- 版本歷史入口：右側 Panel 或底部 tab，顯示歷次修改時間 + 操作人，可展開查看差異，可還原至指定版本（需確認彈窗）
- 儲存按鈕（自動儲存 draft TBD）

**批次匯入**：
- Modal 形式，提供 CSV / JSON 格式說明與範本下載連結
- 上傳後顯示解析結果：成功 N 筆 / 失敗 M 筆，失敗原因以列表呈現（行號 + 錯誤說明）
- 確認後執行匯入

### 6.3 對話紀錄查詢

路由：`/admin/conversations`（列表）、`/admin/conversations/:id`（詳情）

**列表頁**：
- 表格欄位：Session ID（可點擊）、開始時間、對話輪數、語系、狀態（進行中 / 結束 / 轉人工）、是否有回饋
- 篩選列：時間範圍（日期選擇器）、語系、狀態、是否含機密攔截、是否含 Prompt Injection
- 搜尋框：依訊息內容關鍵字搜尋
- 匯出按鈕：依目前篩選條件匯出 CSV（後端非同步處理，前端顯示下載連結）
- 分頁：每頁 20 筆，底部分頁元件

**詳情頁**：
- 頂部 Session 基本資訊（Session ID、時間、語系、狀態）
- 對話訊息列表，呈現方式模擬聊天氣泡，與前台 Message Area 樣式一致
- AI 信心度標記：低信心度訊息有顏色標記
- 攔截事件標記：機密攔截 / Prompt Injection 以 badge 標示
- 底部回饋摘要（若有）

### 6.4 Lead 管理

路由：`/admin/leads`（列表）、`/admin/leads/:id`（詳情）

**列表頁**：
- 表格欄位：姓名、公司、聯絡方式（電話或 Email）、詢問品項、建立時間、狀態（待處理 / 處理中 / 已完成）
- 篩選：狀態、時間範圍
- 搜尋：姓名 / 公司關鍵字

**詳情頁**：
- 完整留資資訊
- 關聯對話連結（點擊跳至對話詳情）
- 狀態切換下拉（待處理 / 處理中 / 已完成）+ 儲存按鈕
- 備註欄位（管理者可填寫內部備註）

### 6.5 Ticket 管理

路由：`/admin/tickets`（列表）、`/admin/tickets/:id`（詳情）

**列表頁**：
- 表格欄位：Ticket ID、主旨、建立時間、狀態（開啟 / 進行中 / 已關閉）、優先級
- 篩選：狀態、優先級、時間範圍

**詳情頁**：
- 問題描述
- 關聯對話連結
- 處理紀錄（時間軸樣式，每次狀態變更或備註均記錄）
- 狀態變更 + 備註輸入 + 送出按鈕

本期 Ticket 的狀態流定義為：開啟 → 進行中 → 已關閉，不做更複雜的 escalation 流程（TBD）。

### 6.6 意圖 / 模板管理

路由：`/admin/intents`

**列表頁**：
- 表格欄位：意圖名稱、觸發關鍵字（前 3 個顯示 + tooltip）、啟用狀態 toggle、操作（編輯 / 刪除）
- 新增意圖按鈕

**新增 / 編輯**（以 Modal 或 Side Panel 形式）：
- 意圖名稱（必填）
- 觸發關鍵字（tag input，多個）
- 優先級（數字輸入）
- 回覆模板內容（文字 + 選填按鈕配置）
- 意圖預覽：輸入測試問句，預覽意圖匹配結果與回覆模板

### 6.7 快捷提問管理

路由：`/admin/quick-replies`

頁面分兩欄：左側編輯列表，右側即時預覽（顯示前台 Quick Replies Bar 的排列樣式）。

**列表**：
- 拖曳排序（drag & drop）
- 每筆可展開編輯：繁中文案、英文文案、啟用狀態 toggle
- 新增按鈕（底部）
- 刪除（每筆右側 icon button，需確認）

拖曳完成後立即呼叫排序更新 API（儲存新順序）。

### 6.8 Widget 設定管理

路由：`/admin/widget-settings`

頁面分兩欄：左側設定表單，右側即時 Widget 預覽（模擬前台 Chat Panel 外觀）。

設定項目：
- CTA 文案（繁中 / 英文）
- 歡迎訊息（繁中 / 英文，支援多行）
- 頁尾免責聲明（繁中 / 英文）
- AI 標記文字（繁中 / 英文）
- 線上 / 繁忙 / 離線 / 降級狀態文案
- 聯絡捷徑設定：最多 3 組，每組設定類型（電話 / URL / 地圖）與值

修改任何欄位後，右側預覽即時更新（純前端本地預覽，不呼叫 API）。確認後按「儲存設定」送出。

### 6.9 稽核事件

路由：`/admin/audit`（列表）、`/admin/audit/:id`（詳情）

**列表頁**：
- 表格欄位：事件時間、事件類型（機密攔截 / Prompt Injection / 轉人工 / 低信心度）、Session ID、嚴重程度（高 / 中 / 低）
- 篩選：事件類型、時間範圍、嚴重程度
- 匯出 CSV

**詳情頁**：
- 事件基本資訊（類型、時間、嚴重程度）
- 觸發上下文對話（相關的幾則訊息）
- 系統判斷依據摘要（後端提供的文字說明）

### 6.10 回饋紀錄

路由：`/admin/feedback`

列表頁：
- 表格欄位：時間、Session ID、訊息摘要（前 50 字）、回饋類型（讚 / 倒讚 + 顏色標記）、倒讚原因
- 篩選：回饋類型、時間範圍

無詳情頁，需要查看完整訊息請點擊 Session ID 跳至對話詳情。

### 6.11 營運報表

路由：`/admin/reports`

頁面頂部：時間範圍切換（近 7 天 / 近 30 天 / 自訂日期區間），全頁報表統一依此篩選。

報表區塊（全部使用 Nuxt Charts 實作，以 `defineAsyncComponent` 懶加載）：
1. AI 自助解答率趨勢圖（折線圖，日為單位）— Nuxt Charts 折線圖
2. 意圖分布圓餅圖 — Nuxt Charts Donut / 圓餅圖
3. 滿意度趨勢（讚 vs 倒讚，折線圖）— Nuxt Charts 折線圖（雙線）
4. Lead 與 Ticket 建立數趨勢（折線圖）— Nuxt Charts 折線圖（雙線）
5. 機密攔截 / Prompt Injection 次數趨勢（折線圖）— Nuxt Charts 折線圖（雙線）

各區塊獨立有匯出 CSV 按鈕。整頁亦提供「匯出全部報表」按鈕（ZIP 壓縮多份 CSV，TBD）。

### 6.12 空狀態 / 錯誤狀態 / 維護狀態

**空狀態**：每個列表頁、圖表區，在資料為零時顯示插圖 + 說明文字（例如「目前尚無對話紀錄」），不顯示空表格。

**錯誤狀態**：API 失敗時列表顯示錯誤提示 + 重試按鈕，不顯示空白頁面。

**維護狀態**：若後端 API 回傳 503 Service Unavailable，後台頁面顯示全頁維護中提示，清楚告知管理者無法操作，不允許提交任何資料變更。

---

## 7. 元件與模組拆分

### 7.1 前台聊天核心元件

| 元件名稱 | 說明 |
|---------|------|
| `ChatWidget` | Widget 根元件；管理收合 / 展開狀態；**Launcher FAB 直接內嵌於此元件**（未拆出 `ChatLauncher`）；整合所有 composables 初始化（`useChat`、`useChatSession`、`useWidgetConfig`）；處理 `reset` / `rate` / `quick-reply` 事件 |
| `ChatPanel` | 展開態聊天面板容器；**直接包含 Header、Info Bar、Disclaimer 的 HTML 結構**（`ChatHeader`、`ChatInfoBar`、`ChatDisclaimer` 未拆成獨立元件）；轉發 `reset` / `rate` / `quick-reply` / `retry` 事件 |
| `ChatMessageArea` | 訊息滾動區域；component registry map 動態渲染各型訊息元件；**無訊息時顯示 Empty State**（Bot avatar + KB 歡迎訊息 + per-message quick-reply chips） |
| `ChatQuickReplies` | 全域快捷提問按鈕列（Layer 1）；資料來源為 Widget Config API；Phase 1 因 config 為 null 而不顯示 |
| `ChatInputBar` | 輸入框與送出按鈕 |

### 7.2 訊息型元件（Message Items）

| 元件名稱 | 說明 |
|---------|------|
| `UserMessageItem` | 使用者訊息氣泡 |
| `AiMessageItem` | AI 完整回覆氣泡；含 Markdown 渲染；**feedback 讚 / 倒讚按鈕直接內嵌**（未拆出 `MessageFeedback` 元件）；`message.quickReplies` 不為空時顯示 per-message quick-reply chips（Layer 2） |
| `AiStreamingItem` | AI 串流中氣泡（逐字動畫） |
| `AiProductCardItem` | AI 產品卡片訊息 — **Phase 2 TBD** |
| `SystemInterceptedItem` | 機密 / Prompt Injection 攔截訊息 |
| `SystemLowConfidenceItem` | 低信心度提示 |
| `SystemErrorItem` | 錯誤訊息 + 重試按鈕 |
| `SystemTimeoutItem` | Timeout 訊息 + 重試按鈕 |
| `SystemFallbackItem` | 降級模式提示 |

> **Note**：`MessageFeedback` 獨立元件**未實作**，Phase 1 已直接將 feedback UI 整合進 `AiMessageItem`。`AiProductCardItem` 預留位置，待 Phase 2 知識庫 API 支援後補充。

### 7.3 表單型元件

| 元件名稱 | 說明 |
|---------|------|
| `LeadFormCard` | 留資表單 inline 卡片 |
| `HandoffStatusCard` | 轉人工狀態 inline 卡片 |

### 7.4 後台列表 / 編輯器 / 統計元件

| 元件名稱 | 說明 |
|---------|------|
| `AdminDataTable` | 通用資料表格（含排序、分頁） |
| `AdminFilterBar` | 通用篩選列（含搜尋、下拉、日期） |
| `AdminStatCard` | Dashboard 統計卡片 |
| `AdminLineChart` | 折線圖（基於 Nuxt Charts，用於趨勢報表） |
| `AdminPieChart` | 圓餅圖（基於 Nuxt Charts，用於意圖分布） |
| `KnowledgeEditor` | 知識庫條目編輯器（含版本歷史 panel） |
| `KnowledgeImportModal` | 批次匯入 Modal |
| `IntentEditor` | 意圖 / 模板編輯 Modal / Side Panel |
| `QuickReplyDragList` | 快捷提問拖曳排序列表 |
| `WidgetSettingsPreview` | Widget 即時預覽面板 |
| `ConversationViewer` | 對話詳情訊息查看器（模擬聊天氣泡） |
| `AuditEventBadge` | 稽核事件類型 badge |

### 7.5 共用元件

| 元件名稱 | 說明 |
|---------|------|
| `AppModal` | 通用確認 / 內容 Modal |
| `AppToast` | Toast 通知（成功 / 錯誤 / 警告） |
| `AppEmptyState` | 空狀態插圖 + 說明 |
| `AppErrorState` | 錯誤狀態 + 重試按鈕 |
| `AppLoadingSpinner` | 載入中旋轉動畫 |
| `AppDateRangePicker` | 日期區間選擇器 |
| `AppStatusBadge` | 狀態標籤（草稿 / 已發佈 / 待處理等） |

### 7.6 模組層

| 模組 | 說明 |
|------|------|
| `services/api/chat.ts` | 前台聊天相關 API 呼叫 |
| `services/api/admin/*.ts` | 後台各功能 API 呼叫 |
| `services/api/client.ts` | API client 基礎設定（baseURL、interceptor） |
| `services/streaming.ts` | SSE / WebSocket 串流處理邏輯 |
| `composables/useChat.ts` | 前台聊天核心邏輯 |
| `composables/useWidgetConfig.ts` | Widget 設定載入與管理 |
| `composables/useChatSession.ts` | Session 建立、恢復、清除 |
| `utils/analytics.ts` | 事件追蹤埋點 |
| `utils/markdown.ts` | Markdown 渲染工具 |
| `utils/format.ts` | 時間、數字格式工具 |

### 7.7 知識庫模擬 Store（Phase 1 暫時方案）

> **⚠️ Phase 1 暫時實作，Phase 2 串接後台 API 後完整移除**

| 項目 | 說明 |
|------|------|
| 檔案 | `app/features/chat/stores/useKnowledgeBaseStore.ts` |
| 用途 | 暫時模擬後台知識資料庫，提供 `query()` 關鍵字比對與 `getWelcomeQuickReplies()` |
| 資料結構 | 模組層級常數 `KNOWLEDGE_BASE: KnowledgeEntry[]`（14 筆）+ `DEFAULT_RESPONSE`（fallback） |
| `query(input)` | 以關鍵字比對輸入文字，返回 `{ content: string, quickReplies?: string[] }` |
| `getWelcomeQuickReplies()` | 返回歡迎訊息的固定 chips 清單（`['產品查詢', '技術支援', '報價與訂購', '公司資訊', '聯絡我們']`） |
| 移除條件 | Phase 2 `POST /api/chat/query` API 串接完成後，移除整個 store；`useChat.sendMessage` 改呼叫真實 API；`useChatSession._appendWelcomeMessage` 改由 API 提供 quickReplies |

---

## 7A. Nuxt UI 元件映射策略

本節定義各 UI 區域優先使用哪些 Nuxt UI 元件，確保開發時有一致的元件選型依據，避免重複造輪子。

### 7A.1 優先使用 Nuxt UI 原生元件的場景

| UI 需求 | 對應 Nuxt UI 元件 |
|---------|-----------------|
| 各類按鈕（送出、重試、儲存、Launcher CTA） | `UButton`（含 variant、size、loading、icon 屬性） |
| 單行文字輸入（後台表單、搜尋框） | `UInput` |
| 多行文字輸入（聊天輸入框、知識庫編輯輔助） | `UTextarea` |
| 下拉選單（篩選、狀態切換、分類選擇） | `USelect` |
| 表單欄位包裝（label + error 訊息） | `UFormField` |
| 卡片容器（LeadFormCard、HandoffStatusCard、統計卡片） | `UCard` |
| 對話框 / 確認框 | `UModal` |
| 側邊抽屜（知識庫版本歷史、意圖編輯） | `USlideover` |
| 後台列表表格 | `UTable` |
| 分頁元件 | `UPagination` |
| 狀態標籤（草稿 / 已發佈 / 高嚴重度） | `UBadge` |
| AI badge、攔截標記 | `UBadge`（搭配 color + variant） |
| Toast 通知（成功 / 錯誤 / 警告） | `useToast()` composable（Nuxt UI 內建） |
| Tooltip（輔助說明文字） | `UTooltip` |
| 語系切換下拉、更多操作選單 | `UDropdownMenu` |
| 搜尋輸入（含 icon） | `UInput` 搭配 `leading-icon` slot |
| 開關 toggle（啟用 / 停用） | `USwitch` |
| 進度 / 載入 spinner | `UButton`（loading 狀態）或 `UProgress` |
| 分隔線 | `USeparator` |
| 麵包屑（後台頁面導覽） | `UBreadcrumb` |
| 頁面骨架（後台列表載入） | `USkeleton` |

### 7A.2 需要封裝為 Domain-Specific 元件的場景

以下 UI 需求雖可部分使用 Nuxt UI 元件為底層，但因具有高度業務語意，應封裝為獨立的 domain 元件，不直接在頁面中使用裸 Nuxt UI 元件：

| Domain 元件 | 說明 | 底層使用 |
|------------|------|---------|
| `AdminStatCard` | Dashboard 統計卡片（含標題、數字、趨勢箭頭） | `UCard` 包裝 |
| `AdminFilterBar` | 後台篩選列（含搜尋、下拉、日期區間） | `UInput` + `USelect` + `UDatePicker` 組合 |
| `AdminDataTable` | 後台通用資料表格（含排序、分頁、空狀態） | `UTable` + `UPagination` 包裝 |
| `AppStatusBadge` | 業務狀態標籤（依狀態對應色彩語意） | `UBadge` 包裝，統一狀態色對應邏輯 |
| `AppEmptyState` | 空狀態插圖 + 說明（列表無資料時） | 自訂，不使用通用元件 |
| `AppErrorState` | 錯誤狀態 + 重試按鈕 | `UAlert` + `UButton` 組合 |
| `KnowledgeEditor` | 知識庫條目編輯器（含版本歷史 panel） | `UTextarea` / Markdown editor + `USlideover` |
| `WidgetSettingsPreview` | Widget 即時預覽面板 | 純前台 Chat UI 元件組合，不使用 Nuxt UI |

### 7A.3 訊息型元件需自訂實作，不適合直接用通用 UI 元件

前台聊天訊息區域的元件為高度 domain-specific 的視覺設計，**不應直接套用 `UCard`、`UAlert` 等通用 Nuxt UI 元件**，原因如下：

- 訊息氣泡需精確控制對齊方向、圓角方向、最大寬度、Markdown 渲染
- 串流動畫（逐字顯示 + 打字游標）需完全自訂 CSS
- 攔截訊息（機密 / Prompt Injection）需要特殊警告樣式，與 `UAlert` 的版型不符
- 降級、低信心度等系統提示需嵌入 inline 並控制與訊息氣泡的相對位置關係

以下元件均以 **Tailwind utility 類別自訂實作**：
- `UserMessageItem`、`AiMessageItem`（含內嵌 feedback 讚 / 倒讚按鈕，`UButton` variant="ghost"）、`AiStreamingItem`
- `SystemInterceptedItem`、`SystemLowConfidenceItem`、`SystemFallbackItem`
- `SystemErrorItem`、`SystemTimeoutItem`

---

## 7B. Tailwind CSS 使用原則

### 7B.1 Tailwind CSS 的責任範圍

Tailwind CSS 在本專案的責任邊界如下：

**負責**：
- Layout 結構（`flex`、`grid`、`gap`、`col-span`）
- Spacing（`p-*`、`m-*`、`space-*`）
- 定位（`fixed`、`sticky`、`absolute`、`z-*`、`inset-*`）
- Breakpoints（`sm:`、`md:`、`lg:` 前綴，用於 Widget RWD 斷點）
- 狀態樣式（`hover:`、`focus:`、`disabled:`、`aria-*:`）
- 尺寸（`w-*`、`h-*`、`max-w-*`、`min-h-*`）
- 訊息氣泡的視覺細節（圓角方向、泡泡最大寬度、背景色）
- 串流動畫、打字游標等前台特有視覺效果

**不負責**：
- 品牌色 / 主題色（由 Nuxt UI app config theme token 統一定義）
- 通用元件的基礎樣式（由 Nuxt UI 元件自身處理）
- 後台表格 / 分頁 / Modal 的基礎外觀（由 Nuxt UI 負責）

### 7B.2 品牌色與主題色管理方式

**集中於 `app/app.config.ts`**，透過 Nuxt UI 的 `ui.colors` 或 `ui.theme` 設定品牌主色與語意色，所有使用 Nuxt UI 元件的地方均自動套用。

Tailwind 延伸色（如訊息氣泡的特定背景色）統一定義在 `tailwind.config.ts` 的 `theme.extend.colors` 中，命名使用語意化名稱（如 `chat-user-bubble`、`chat-ai-bubble`、`intercept-warning`），不在元件中直接寫死色碼。

### 7B.3 避免的寫法

- 避免在元件的 `<style scoped>` 中寫大量自訂 CSS 來重現已有 Tailwind utility 能處理的樣式
- 避免直接使用 `style="color: #xxx"` 等 inline style 處理主題相關樣式
- 避免多個元件各自定義相似但細節不同的同類樣式（如多種灰色背景），應收斂為統一 token

### 7B.4 特殊情況例外

以下情況可使用少量 `<style scoped>` 或 CSS 動畫：
- 串流打字游標動畫（`@keyframes blink`）
- Widget 展開 / 收合的 slide transition（若 Tailwind `transition` utility 不足以表達）
- 需要精確 `scrollbar-width: none` 等不在標準 Tailwind utility 中的 CSS 屬性

---

## 8. 狀態管理設計

### 8.1 設計原則

- Store 只用於**跨元件、跨頁面**需要共享的持久狀態
- 頁面 local 狀態（篩選條件、表單暫存）使用 composable 或 `ref` / `reactive` 管理在頁面元件中
- 前台聊天 session 與後台登入 session 嚴格分離，互不干擾

### 8.2 前台 Store

**`useChatWidgetStore`**（Pinia）
- `isOpen: boolean`：Widget 展開 / 收合狀態
- `mode: 'normal' | 'fallback'`：正常模式 / 降級模式
- `locale: 'zh-TW' | 'en' | string`：當前語系

**`useChatSessionStore`**（Pinia）
- `sessionToken: string | null`：當前聊天 session token（同步至 localStorage）
- `sessionStatus: 'idle' | 'active' | 'expired'`
- `messages: ChatMessageVM[]`：訊息列表
- `streamingState: StreamingState`：當前串流狀態機狀態
- `handoffState: HandoffState`：轉人工流程狀態
- `leadFormState: LeadFormState`：留資表單狀態（是否已提交）
- `quickRepliesVisible: boolean`：快捷提問是否顯示

### 8.3 後台 Store

本期後台不設置登入驗證，**不需要 `useAdminAuthStore`**，無 auth token 管理邏輯。後台各頁面的 page-local 狀態（篩選條件、表單資料）直接在頁面元件的 `setup()` 中管理，無需進 store。

### 8.4 共用 Store

**`useWidgetConfigStore`**（Pinia）
- `config: WidgetConfigVM | null`：Widget 全域設定（含文案、捷徑、快捷提問）
- `isLoaded: boolean`
- `isOnline: boolean`：AI 服務狀態

### 8.5 Page-Local 狀態（不進 Store）

以下狀態在各頁面元件的 `setup()` 中以 `ref` / `reactive` 管理：
- 後台列表頁的篩選條件
- 後台表單頁的表單資料
- Dashboard 圖表的時間範圍選擇
- Modal 的開關狀態
- 分頁頁碼

### 8.6 localStorage / sessionStorage / Memory 使用策略

| 資料 | 儲存位置 | 理由 |
|------|---------|------|
| 前台 session token | `localStorage` | 跨頁面重整恢復對話 |
| 前台語系偏好 | `localStorage` | 跨次開啟保留偏好 |
| Widget Config | Memory（Pinia store） | 每次 Widget 初始化重新取得 |
| 後台篩選條件 | Page-local state | 頁面切換後不需保留 |

### 8.7 前台 Chat Session 說明

前台聊天 session token 由前台 chat API 建立，儲存於 `localStorage`，用於跨頁面重整恢復對話。所有 `/api/chat/**` 請求均帶入此 session token（作為 body 或 header 參數）。

後台本期無 auth token，`/api/admin/**` 請求直接發送，不附加任何 Authorization header。

---

## 9. 前後端整合設計

### 9.1 API Client 設計原則

統一使用 Nuxt 4 的 `$fetch` 或封裝的 `useApi` composable。

基礎設定：
- `baseURL`：從 `runtimeConfig.public.apiBase` 取得，不 hardcode
- 前台 chat API request：自動附加前台 session token（從 `localStorage` 讀取）
- 後台 admin API request：直接發送，本期不附加任何 Authorization header
- 全域 response interceptor：處理 5xx（顯示 toast）
- Timeout：預設 15 秒（串流請求另行設定）

不在前端 bundle 中放置任何 API Key 或後端機密設定。所有設定從環境變數取得，且只有 `NUXT_PUBLIC_` 前綴的才暴露給前端。

### 9.2 Chat Streaming 接入策略

本期設計以 **SSE（Server-Sent Events）** 為主（待後端確認，TBD）。

串流流程：
1. 使用者送出訊息
2. 呼叫 POST `/api/chat/message`，帶入 session token 與訊息內容
3. 後端回傳 SSE stream，前端以 `EventSource` 或 `fetch` + ReadableStream 接收
4. 每收到一個 token，append 至 `AiStreamingItem` 的內容
5. 收到 `[DONE]` event 或 stream 關閉時，結束串流
6. 收到 special event（`intercepted`、`low-confidence`、`handoff`）時，觸發對應 UI 狀態

如後端使用 WebSocket，前端改為 `useWebSocket` composable 接入，串流邏輯相同，僅連線方式不同。

### 9.3 建立 / 恢復聊天 Session 流程

```
Widget 展開
  ↓
讀取 localStorage 的 sessionToken
  ├─ 有 token → GET /api/chat/history?token=xxx
  │     ├─ 200 OK → 載入歷史訊息，進入 active 狀態
  │     └─ 401/404 → 清除舊 token，走「無 token」流程
  └─ 無 token → POST /api/chat/session（建立新 session）
                  ├─ 200 OK → 儲存新 token 至 localStorage，顯示歡迎訊息
                  └─ 失敗 → 進入 fallback mode
```

### 9.4 Widget Config 載入時機

**Widget 初始化時**（Widget 第一次掛載到 DOM）呼叫 GET `/api/widget/config`。

設計決策：每次展開 Widget 時重新取得 Config（不快取至 localStorage），確保文案更新後使用者能即時看到最新設定。若 API 失敗，使用靜態 i18n 文案作為 fallback。

### 9.5 Lead Form 提交流程

```
使用者點擊送出
  ↓
前端表單驗證（必填 + email/phone 格式）
  ├─ 驗證失敗 → 顯示欄位錯誤，不送出
  └─ 驗證成功 → POST /api/chat/lead（帶入 session token + 表單資料）
                  ├─ 200 OK → LeadFormCard 轉為確認訊息，設 leadFormState.submitted = true
                  └─ 失敗 → 顯示 inline 錯誤，按鈕恢復
```

### 9.6 Handoff 狀態更新流程

```
觸發轉人工
  ↓
POST /api/chat/handoff（帶入 session token）
  ↓
後端回傳 handoff status（waiting / connected / unavailable）
  ↓
前端更新 handoffState，渲染 HandoffStatusCard

後續狀態更新方式（TBD）：
  - 方案 A：polling GET /api/chat/handoff/status（每 10 秒）
  - 方案 B：後端透過 SSE 主動推送 status event
```

### 9.7 後台列表查詢模式

後台所有列表頁採用統一查詢模式：
- 篩選條件作為 URL query string（`?status=open&page=2`），支援分頁書籤
- 篩選變更時重新呼叫 API，不做前端 filter
- 分頁使用 offset-based pagination（`page` + `pageSize`，預設 20）
- 排序由表格欄位 header 點擊觸發（`sortBy` + `sortOrder` 參數）

### 9.8 知識庫匯入流程

```
管理者點擊批次匯入
  ↓
開啟 ImportModal，選擇 CSV / JSON 檔案
  ↓
POST /api/admin/knowledge/import（multipart/form-data）
  ↓
後端同步解析並回傳結果：
  { total: 50, success: 48, failed: 2, errors: [{ row: 3, reason: '...' }] }
  ↓
前端顯示結果 summary，失敗原因以 collapsible 列表呈現
```

### 9.9 錯誤映射策略

| HTTP 狀態 | 前端行為 |
|----------|---------|
| 429 | 顯示「請求頻率過高，請稍後再試」toast，不重試 |
| 5xx | 顯示通用錯誤 toast「系統暫時無法使用，請稍後再試」，提供重試按鈕（操作型請求）|
| Network Error | 前台：顯示 `SystemErrorItem`；後台：顯示 toast + 重試按鈕 |
| Streaming Timeout | 顯示 `SystemTimeoutItem`，記錄到 analytics |

---

## 10. 非功能設計

### 10.1 安全性

前端 bundle 中嚴禁出現任何 OpenAI API Key、後端 JWT secret、資料庫連線字串等機密資訊。所有環境變數需透過 `NUXT_` 前綴設定，公開給前端的僅 `NUXT_PUBLIC_API_BASE` 等基礎設定。

本期後台不設登入驗證，無 auth token 相關安全考量。未來若加入登入保護，再評估 token 儲存策略。

CSP（Content Security Policy）設定：前台 Widget 嵌入的頁面應設定 CSP，防止 XSS 注入（TBD：需與後端或官網技術確認）。

表單輸入前端驗證：長度限制、格式驗證、防止空送。所有驗證僅為 UX 輔助，後端必須同步驗證。

### 10.2 錯誤處理

全域 API 錯誤由 `services/api/client.ts` 的 interceptor 統一處理。元件層不直接 catch HTTP 錯誤，由 API client 統一映射為應用層錯誤。

前台：所有非預期錯誤均不允許空白頁或無反應，必須顯示對應 `System*Item` 訊息。後台：表單級別錯誤以欄位 inline 顯示，系統級別錯誤以 toast 通知。

未預期錯誤（catch 未知 exception）透過 `utils/errorReporter.ts` 上報（TBD：Sentry 或後端 error logging API）。

### 10.3 降級策略

前台降級觸發條件（任一）：
1. Widget Config API 回傳 `status: 'offline'`
2. 建立 session API 連續失敗 2 次
3. Widget Config API 失敗

降級期間，前台 Widget 的所有 AI 功能停用，但聯絡捷徑與留資入口保持可用。每 60 秒重新探測服務狀態，自動恢復。

後台降級：503 時顯示全頁維護中提示，避免管理者在不穩定狀態下操作資料。

### 10.4 效能

- 前台 Widget 以 dynamic import 方式載入（`defineAsyncComponent`），不阻塞官網主頁面
- Widget 初始 bundle 目標 ≤ 100KB（gzipped，TBD）
- 串流回覆第一個 token 顯示 ≤ 2 秒（P95，依後端回應速度）
- 後台列表 API 呼叫 ≤ 3 秒（後端 SLA）
- 後台使用 `<Suspense>` 搭配 skeleton loading 避免頁面 layout shift
- 圖表元件懶加載（報表頁才載入圖表 library）

### 10.5 RWD

前台 Widget 支援三個主要斷點（見第 5.2 節），不需整體頁面 RWD（Widget 本身即為獨立 overlay）。

後台僅支援桌機（≥ 1280px），不做手機版響應式設計。左側導覽列在 ≥ 1280px 展開，1024px–1279px 可收合（TBD）。

### 10.6 Accessibility

前台 Widget 最低目標：WCAG 2.1 Level AA。
- 聊天面板以 `role="dialog"` 標記，含 `aria-label`
- 訊息列表以 `role="log"` 標記，新訊息 append 時 aria-live 通知
- 所有 icon button 含 `aria-label`
- 鍵盤可操作：Tab 導覽、Enter 送出、Escape 收合
- 色彩對比 ≥ 4.5:1

後台基本 ARIA：表單 label 與 input 綁定（`for` / `id`），Modal 有 `role="dialog"` + focus trap，table 有 `aria-label`。

### 10.7 埋點 / Analytics

前台追蹤事件由 `utils/analytics.ts` 統一管理，呼叫後端 analytics API（不直接送第三方）。

追蹤事件清單：

| 事件名稱 | 觸發時機 | 附帶資料 |
|---------|---------|---------|
| `widget_opened` | Widget 展開 | locale, mode |
| `widget_closed` | Widget 收合 | session_id |
| `quick_reply_clicked` | 點擊快捷提問 | text, locale |
| `message_sent` | 送出訊息 | session_id |
| `lead_form_opened` | 留資表單出現 | session_id |
| `lead_form_submitted` | 留資表單送出成功 | session_id |
| `handoff_triggered` | 轉人工觸發 | session_id, reason |
| `feedback_submitted` | 送出回饋 | message_id, type |
| `locale_changed` | 語系切換 | from, to |
| `fallback_mode_entered` | 進入降級模式 | reason |
| `streaming_timeout` | 串流超時 | session_id |

事件採 fire-and-forget，不影響主流程。

### 10.8 可測試性

- 所有 composables 純邏輯可脫離 Vue 元件測試
- API service 層可 mock（`vi.mock`）
- 元件測試使用 Vitest + Vue Test Utils
- 串流狀態機邏輯抽為純函數，獨立測試
- E2E 使用 Playwright（已有 `playwright.config.ts`）

---

## 11. 資料模型 / View Model

以下定義前端消費所需的 View Model，不對應資料庫 schema。

### 11.1 ChatSessionVM

```
{
  sessionToken: string       // 前端儲存用的 session 識別符
  status: 'active' | 'expired' | 'closed' | 'handoff'
  locale: string             // 建立 session 時的語系
  createdAt: string          // ISO 8601
}
```

### 11.2 ChatMessageVM

```
{
  id: string                 // 訊息唯一 ID（用於回饋、對應後台稽核）
  type: MessageType          // 見第 5.4 節的 type 清單
  role: 'user' | 'ai' | 'system'
  content: string            // 文字內容或 Markdown
  timestamp: string          // ISO 8601，顯示相對時間用
  isStreaming?: boolean       // 串流中為 true
  isIntercepted?: boolean     // 攔截訊息
  interceptType?: 'confidential' | 'injection'
  isLowConfidence?: boolean   // 低信心度
  feedbackState?: 'none' | 'liked' | 'disliked'
  errorState?: 'error' | 'timeout' | 'interrupted'
  productCard?: ProductCardVM // type 為 ai-product-card 時的附加資料
}
```

### 11.3 QuickReplyVM

```
{
  id: string
  text: string               // 當前語系的文案
  order: number
}
```

### 11.4 LeadFormVM

```
{
  name: string               // 必填
  company: string            // 必填
  phone?: string             // 電話或 Email 至少一個
  email?: string
  productInquiry?: string    // 選填
  notes?: string             // 選填
  sessionToken: string       // 關聯 session
}
```

### 11.5 HandoffStateVM

```
{
  status: 'idle' | 'requesting' | 'waiting' | 'connected' | 'unavailable'
  requestedAt?: string
  serviceHours?: string      // unavailable 時顯示的服務時間文案
}
```

### 11.6 FeedbackVM

```
{
  messageId: string
  type: 'like' | 'dislike'
  reason?: string            // dislike 時的原因
  sessionToken: string
}
```

### 11.7 WidgetConfigVM

```
{
  status: 'online' | 'busy' | 'offline'
  ctaText: Record<string, string>         // { 'zh-TW': '...', 'en': '...' }
  welcomeMessage: Record<string, string>
  disclaimer: Record<string, string>
  aiLabel: Record<string, string>
  statusText: {
    online: Record<string, string>
    busy: Record<string, string>
    offline: Record<string, string>
  }
  shortcuts: ShortcutVM[]                 // 最多 3 個
  quickReplies: Record<string, QuickReplyVM[]> // 依語系分組
  serviceHours?: string
}
```

### 11.8 ShortcutVM

```
{
  type: 'phone' | 'url' | 'map'
  label: Record<string, string>
  value: string              // tel: 號碼 / URL / Maps URL
}
```

### 11.9 DashboardMetricVM

```
{
  todayConversations: number
  monthConversations: number
  aiResolutionRate: number   // 0–100 百分比
  pendingTickets: number
  monthLeads: number
  conversationTrend: TrendDataPoint[]    // { date: string, count: number }[]
  intentDistribution: IntentDistItem[]   // { intent: string, count: number }[]
  recentAuditEvents: AuditEventVM[]
}
```

### 11.10 KnowledgeEntryVM

```
{
  id: string
  title: string
  category: string
  status: 'draft' | 'published' | 'disabled'
  content: string            // Markdown 或 HTML
  updatedAt: string
  currentRevision: number
}
```

### 11.11 KnowledgeRevisionVM

```
{
  revisionId: string
  entryId: string
  revisionNumber: number
  content: string
  updatedAt: string
  note?: string
  diff?: string              // 與前一版本的差異（前端顯示 diff 視圖用）
}
```

### 11.12 ConversationSummaryVM

```
{
  sessionId: string
  startedAt: string
  messageCount: number
  locale: string
  status: 'active' | 'closed' | 'handoff'
  hasFeedback: boolean
  hasInterception: boolean
  hasInjection: boolean
}
```

### 11.13 ConversationDetailVM

```
{
  sessionId: string
  startedAt: string
  endedAt?: string
  locale: string
  status: string
  messages: ChatMessageVM[]  // 後台版，含稽核標記
  feedbackSummary?: { liked: number, disliked: number }
}
```

### 11.14 TicketSummaryVM

```
{
  ticketId: string
  subject: string
  createdAt: string
  status: 'open' | 'in-progress' | 'closed'
  priority: 'high' | 'medium' | 'low'
  sessionId?: string
}
```

### 11.15 AuditEventVM

```
{
  eventId: string
  eventType: 'confidential' | 'injection' | 'handoff' | 'low-confidence'
  severity: 'high' | 'medium' | 'low'
  sessionId: string
  occurredAt: string
  contextMessages?: ChatMessageVM[]
  systemReason?: string      // 後端提供的摘要文字
}
```

---

## 12. 檔案與目錄結構建議

```
/
├── app/
│   ├── app.vue
│   ├── app.config.ts
│   ├── error.vue
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css
│   │   └── images/
│   │
│   ├── components/                    # 跨 domain 共用元件
│   │   ├── AppModal.vue
│   │   ├── AppToast.vue
│   │   ├── AppEmptyState.vue
│   │   ├── AppErrorState.vue
│   │   ├── AppLoadingSpinner.vue
│   │   ├── AppDateRangePicker.vue
│   │   └── AppStatusBadge.vue
│   │
│   ├── composables/                   # 跨 domain 共用 composables
│   │   ├── useAppToast.ts
│   │   ├── useModal.ts
│   │   ├── useFormat.ts
│   │   ├── usePageI18n.ts
│   │   └── useStorage.ts
│   │
│   ├── features/
│   │   ├── chat/                      # 前台 chat domain
│   │   │   ├── components/
│   │   │   │   ├── ChatWidget.vue          # Launcher FAB 內嵌
│   │   │   │   ├── ChatPanel.vue           # Header / InfoBar / Disclaimer 內嵌
│   │   │   │   ├── ChatMessageArea.vue
│   │   │   │   ├── ChatQuickReplies.vue
│   │   │   │   ├── ChatInputBar.vue
│   │   │   │   ├── messages/
│   │   │   │   │   ├── UserMessageItem.vue
│   │   │   │   │   ├── AiMessageItem.vue       # feedback 按鈕內嵌，Phase 2 補原因 chips
│   │   │   │   │   ├── AiStreamingItem.vue
│   │   │   │   │   ├── AiProductCardItem.vue   # Phase 2 TBD
│   │   │   │   │   ├── SystemInterceptedItem.vue
│   │   │   │   │   ├── SystemLowConfidenceItem.vue
│   │   │   │   │   ├── SystemErrorItem.vue
│   │   │   │   │   ├── SystemTimeoutItem.vue
│   │   │   │   │   └── SystemFallbackItem.vue
│   │   │   │   ├── LeadFormCard.vue
│   │   │   │   └── HandoffStatusCard.vue
│   │   │   ├── composables/
│   │   │   │   ├── useChat.ts
│   │   │   │   ├── useChatSession.ts
│   │   │   │   ├── useWidgetConfig.ts
│   │   │   │   ├── useStreaming.ts
│   │   │   │   ├── useHandoff.ts
│   │   │   │   ├── useLeadForm.ts
│   │   │   │   └── useFeedback.ts
│   │   │   └── stores/
│   │   │       ├── chatWidget.ts
│   │   │       ├── chatSession.ts
│   │   │       └── widgetConfig.ts
│   │   │
│   │   └── admin/                     # 後台 admin domain
│   │       ├── components/
│   │       │   ├── AdminDataTable.vue
│   │       │   ├── AdminFilterBar.vue
│   │       │   ├── AdminStatCard.vue
│   │       │   ├── AdminLineChart.vue
│   │       │   ├── AdminPieChart.vue
│   │       │   ├── KnowledgeEditor.vue
│   │       │   ├── KnowledgeImportModal.vue
│   │       │   ├── IntentEditor.vue
│   │       │   ├── QuickReplyDragList.vue
│   │       │   ├── WidgetSettingsPreview.vue
│   │       │   ├── ConversationViewer.vue
│   │       │   └── AuditEventBadge.vue
│   │       ├── composables/
│   │       │   ├── useKnowledge.ts
│   │       │   ├── useConversations.ts
│   │       │   ├── useLeads.ts
│   │       │   ├── useTickets.ts
│   │       │   ├── useIntents.ts
│   │       │   ├── useQuickReplies.ts
│   │       │   ├── useWidgetSettings.ts
│   │       │   ├── useAuditEvents.ts
│   │       │   ├── useFeedbackRecords.ts
│   │       │   └── useReports.ts
│   │       └── stores/
│   │
│   ├── layouts/
│   │   ├── default.vue               # 前台用（極簡）
│   │   └── admin.vue                 # 後台用（含導覽列）
│   │
│   ├── pages/
│   │   ├── index.vue                 # 前台入口
│   │   └── admin/
│   │       ├── dashboard.vue
│   │       ├── knowledge/
│   │       │   ├── index.vue
│   │       │   ├── new.vue
│   │       │   └── [id].vue
│   │       ├── conversations/
│   │       │   ├── index.vue
│   │       │   └── [id].vue
│   │       ├── leads/
│   │       │   ├── index.vue
│   │       │   └── [id].vue
│   │       ├── tickets/
│   │       │   ├── index.vue
│   │       │   └── [id].vue
│   │       ├── intents/
│   │       │   └── index.vue
│   │       ├── quick-replies/
│   │       │   └── index.vue
│   │       ├── widget-settings/
│   │       │   └── index.vue
│   │       ├── audit/
│   │       │   ├── index.vue
│   │       │   └── [id].vue
│   │       ├── feedback/
│   │       │   └── index.vue
│   │       └── reports/
│   │           └── index.vue
│   │
│   ├── plugins/
│   │   ├── vee-validate.client.ts
│   │   └── vxe-table.client.ts
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts             # API client 基礎設定
│   │   │   ├── chat.ts               # 前台聊天 API
│   │   │   └── admin/
│   │   │       ├── knowledge.ts
│   │   │       ├── conversations.ts
│   │   │       ├── leads.ts
│   │   │       ├── tickets.ts
│   │   │       ├── intents.ts
│   │   │       ├── quickReplies.ts
│   │   │       ├── widgetSettings.ts
│   │   │       ├── audit.ts
│   │   │       ├── feedback.ts
│   │   │       └── reports.ts
│   │   └── streaming.ts              # SSE / WebSocket 串流處理
│   │
│   ├── stores/                       # 全域 Pinia stores（若需跨 feature）
│   │
│   ├── types/
│   │   ├── chat.ts                   # 前台 VM types
│   │   ├── admin.ts                  # 後台 VM types
│   │   ├── api.ts                    # API request/response types
│   │   └── nuxt.d.ts
│   │
│   └── utils/
│       ├── format.ts
│       ├── markdown.ts
│       ├── analytics.ts
│       └── errorReporter.ts
│
├── i18n/
│   └── locales/
│       ├── zh-TW/
│       │   ├── common.json
│       │   ├── chat.json             # 前台 Widget 文案
│       │   └── admin.json            # 後台文案
│       └── en/
│           ├── common.json
│           ├── chat.json
│           └── admin.json
│
├── public/
├── tests/
│   └── e2e/
│       ├── chat/
│       │   ├── widget.spec.ts
│       │   ├── streaming.spec.ts
│       │   ├── lead-form.spec.ts
│       │   └── fallback.spec.ts
│       └── admin/
│           ├── knowledge.spec.ts
│           └── conversations.spec.ts
│
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

---

## 13. 測試策略

### 13.1 前台單元測試（Vitest）

測試目標：composables 的邏輯正確性，不依賴 DOM。

| 測試項目 | 測試內容 |
|---------|---------|
| `useStreaming` | 串流狀態機各狀態轉換是否正確 |
| `useChatSession` | session 建立、恢復、過期、清除邏輯 |
| `useLeadForm` | 表單驗證規則（必填、格式、重複提交保護） |
| `useHandoff` | 轉人工狀態流轉 |
| `useFeedback` | 回饋送出、切換、fire-and-forget 邏輯 |
| `utils/format.ts` | 相對時間格式、字數計算 |
| `utils/markdown.ts` | Markdown 渲染輸出正確性 |

### 13.2 前台元件測試（Vitest + Vue Test Utils）

| 測試元件 | 測試重點 |
|---------|---------|
| `ChatWidget` / `ChatPanel` | Launcher 展開收合、Header 重置按鈕、各事件鏈（rate / quick-reply / reset） |
| `ChatInputBar` | 字數限制、Enter 送出、送出中鎖定 |
| `AiMessageItem`（含 feedback） | feedback 讚 / 倒讚狀態切換、per-message chips 點擊、rating 欄位同步 |
| `AiStreamingItem` | token append 動畫 |
| `SystemInterceptedItem` | 機密 / Injection 文案與樣式 |
| `LeadFormCard` | 表單驗證、提交狀態、已提交狀態 |
| `HandoffStatusCard` | 各狀態顯示（waiting / unavailable） |
| `ChatQuickReplies` | 點擊後隱藏、重置後顯示 |

### 13.3 前台 E2E 核心旅程（Playwright）

**Phase 1（KB mock）**

| 旅程 | 測試步驟 |
|------|---------|
| 開啟 Widget 並完成首次問答（KB mock） | 點擊 Launcher → 展開 Panel → 看到 Empty State 歡迎訊息 + quick-reply chips → 輸入訊息 → Enter 送出 → KB mock 延遲回覆顯示 |
| Empty State quick-reply chips 點擊 | 展開 Widget（無訊息）→ 點擊 chip → 訊息送出 → KB mock 回覆顯示 |
| Reset 與 feedback 互動 | 完成問答 → 點讚 → icon 狀態更新 → 點擊重置 → 對話清空 → Empty State 重現 |
| Session 恢復 | 完成一次對話 → 重新整理頁面 → 展開 Widget → 歷史訊息顯示 |
| 降級模式 | mock Config API 回傳 `status: 'offline'` → 展開 Widget → fallback 提示顯示 → Input Bar disabled |

**Phase 2（真實 SSE 串流）**

| 旅程 | 測試步驟 |
|------|---------|
| 開啟 Widget 並完成首次問答（串流） | 點擊 Launcher → 展開 Panel → 送出訊息 → AI 串流回覆逐字顯示 → 完成後 Markdown 渲染 |
| 快捷提問點擊流程 | 展開 Widget → 點擊「產品查詢」→ 訊息送出 → AI 回覆顯示 → 快捷提問列收起 |
| 留資表單完整流程 | AI 觸發留資 → 填寫表單 → 送出成功 → 確認訊息顯示 → 再次觸發顯示「已登記」 |
| 語系切換 | 切換至 English → 所有文案更新 → 快捷提問文案更新 |
| 重新開始對話 | 點擊重置 → 對話清空 → 歡迎訊息重新出現 |
| 語系切換 | 切換至 English → 所有文案更新 → 快捷提問文案更新 |
| 降級模式 | Mock AI 服務不可用 → 展開 Widget → 降級提示顯示 → 聯絡捷徑可點擊 |

### 13.4 後台 E2E 核心旅程（Playwright）

| 旅程 | 測試步驟 |
|------|---------|
| 知識庫新增 / 編輯 | 進入知識庫列表 → 點擊新增 → 填寫內容 → 儲存 → 列表出現新條目 |
| 知識庫版本還原 | 編輯已有條目 → 修改內容儲存 → 進入版本歷史 → 選擇舊版本還原 → 內容恢復 |
| 批次匯入 | 點擊批次匯入 → 上傳測試 CSV → 顯示成功 / 失敗結果 |
| 對話紀錄查詢 | 進入對話紀錄 → 篩選時間範圍 → 點擊 Session → 詳情顯示完整對話 |
| Lead 狀態更新 | 進入 Lead 列表 → 點擊 Lead → 修改狀態 → 儲存 → 列表狀態更新 |

### 13.5 特殊狀態顯示測試

| 測試場景 | 驗證重點 |
|---------|---------|
| Fallback / 降級 | Widget 降級提示顯示正確，聯絡捷徑可用，Input Bar disabled |
| Streaming Timeout | 30 秒無回應後 `SystemTimeoutItem` 顯示 |
| Streaming Interrupted | 串流中斷後顯示部分內容 + 重試按鈕 |
| Error + Retry | API 失敗後 `SystemErrorItem` 顯示，點擊重試重新發送 |
| Prompt Injection 攔截 | 後端回傳 injection 標記，`SystemInterceptedItem` 顯示盾牌圖示 |
| 機密攔截 | 後端回傳 confidential 標記，顯示鎖頭圖示 + 正確文案 |
| 低信心度提示 | 後端標記低信心度，AI 訊息底部附加提示條 |

### 13.6 多語系與 RWD 測試

- 語系切換後，Widget 所有可見文案均以 Playwright 快照驗證
- Playwright 模擬桌機（1280px）、平板（768px）、手機（375px）三個 viewport，截圖比對 Widget 布局

### 13.7 Session 恢復測試

- E2E 測試中，先完成一次對話並取得 sessionToken 存入 localStorage
- 重新載入頁面，展開 Widget，驗證歷史訊息正確顯示
- 修改 localStorage 中的 token 為無效值，驗證 Widget 自動建立新 session 並顯示歡迎訊息

---

## 14. 設計決策與取捨

### 14.1 前後台放在同一個 Nuxt 專案

**決策**：單一 Nuxt 4 專案同時承載前台 Widget 與後台 Admin。

**理由**：共用 API client、types、i18n 資源，減少重複維護成本。對單人開發者而言，維護單一 repo 的認知負擔最低。若未來需要拆分，可按 domain 目錄結構拆為獨立專案。

### 14.2 後台本期不設置登入驗證

**決策**：本期後台不設置登入驗證，所有 `/admin/*` 路由可直接訪問，無 middleware 守衛。

**理由**：本期目標是讓 AI 客服系統快速上線與迭代展示，加入登入驗證會增加開發量與測試複雜度，且當前使用情境為內部開發展示。前台提供低調的「後台管理」入口按鈕（`/` 頁面右上角）直接導向 `/admin/dashboard`。若未來需要加入保護，可新增 `middleware/admin-auth.ts` 具名 middleware，不影響前台設計。

### 14.3 聊天區採訊息型 Renderer

**決策**：訊息列表以 `type` 欄位決定渲染哪個元件，不使用統一大元件 + `v-if` 堆疊。

**理由**：訊息類型多樣（streaming、error、intercepted、lead form、handoff 等），如果全放在同一元件中 `v-if` 維護會很混亂。以 type 決定 component 的方式（類似 schema-driven UI）每個元件職責單一，易於測試與擴充。

### 14.4 Session Token 儲存於 localStorage

**決策**：前台聊天 session token 儲存於 localStorage。

**理由**：需要跨頁面重整恢復對話。sessionStorage 跨 Tab 不共享且頁面關閉即消失，不符合需求。HttpOnly Cookie 需要後端配合設定且有跨站問題（如 Widget 嵌入在其他域名的官網）。localStorage 在前台 Widget 場景下是最實用的選擇，但需注意清楚告知 session 過期機制。

### 14.5 Fallback 保留聯絡捷徑與留資入口

**決策**：降級模式下，Widget 仍可展開，聯絡捷徑與留資入口保持可用。

**理由**：降級的目的是在 AI 不可用時仍保留訪客轉換路徑。若 AI 掛掉就讓 Widget 完全不可用，會直接損失潛在客戶。聯絡捷徑（電話、官網）不依賴後端 AI 服務，留資表單可以獨立提交，兩者都應在降級時保持可用。

### 14.6 Widget Config 每次展開重新取得

**決策**：不將 Widget Config 快取至 localStorage，每次展開時重新取得。

**理由**：若快取，後台修改文案後管理者無法預期使用者何時會看到最新設定。每次展開重取確保即時性，且 Widget Config 是小型 JSON，效能影響可忽略。

### 14.7 實作階段（Phase）與完整範圍的關係

**重要說明**：本文件定義的 Phase 僅代表**實作優先順序**，不代表把 Phase 2 以後的功能移出本期範圍。本專案的完整功能範圍仍以 `spec.md` 為準。後續 `plan.md` 與 `task.md` 需覆蓋 spec 中定義的全部功能，Phase 劃分僅作為任務排程依據。

**Phase 1（核心聊天體驗，最優先）**：
- 前台 Widget 完整互動（收合 / 展開 / 問答 / 串流 / 快捷提問 / 攔截提示 / 降級）
- Session 建立與 localStorage 恢復
- Widget Config 載入與 fallback

**Phase 2（前台功能完整化）**：
- KB mock 切換為真實 API / SSE 串流（`useKnowledgeBaseStore` 退出主流程）
- 留資表單（LeadFormCard）
- 轉人工流程（HandoffStatusCard）
- 滿意度回饋 API 串接（`AiMessageItem` 內嵌 feedback 擴充為 `useFeedback` fire-and-forget）
- 多語系切換（英文）

**Phase 3（後台基礎建設）**：
- 後台 Dashboard
- 對話紀錄查詢（列表 + 詳情）
- Lead 管理、Ticket 管理

**Phase 4（後台內容管理）**：
- 知識庫管理（含版本歷史、批次匯入）
- 意圖 / 模板管理
- 快捷提問管理
- Widget 設定管理（含即時預覽）

**Phase 5（後台維運工具）**：
- 稽核事件列表與詳情
- 回饋紀錄
- 營運報表

以上所有 Phase 的功能均在本期設計範圍內，不是「未來規劃」。Copilot 生成 `plan.md` / `task.md` 時，應將全部 Phase 的任務納入，而非僅生成 Phase 1。

---

## 15. 風險與待確認項

以下項目在進入 `plan.md` 前需與後端或甲方確認：

| # | 待確認項目 | 影響 | 預設方案 |
|---|-----------|------|---------|
| R1 | 後端串流協議：SSE 或 WebSocket？ | 前台 `useStreaming.ts` 實作方式 | 預設設計為 SSE，若為 WS 需調整 |
| R2 | Widget 嵌入形式：直接 script embed / iframe / Web Component？ | Widget bundle 打包方式與 CSS 隔離策略 | 本期以 Nuxt 頁面形式開發，嵌入形式 TBD |
| R3 | 前台 session token 儲存：localStorage 還是 HttpOnly Cookie？ | XSS 風險評估、跨域嵌入相容性 | 預設 localStorage |
| R4 | 轉人工後接入的外部客服系統為何？前端需 SDK 還是僅 polling？ | `useHandoff.ts` 的實作複雜度 | 預設 polling，若需 SDK 需評估 |
| R5 | 滿意度倒讚原因：chips 選項 or 開放文字？ | `AiMessageItem` 內嵌倒讚原因 UI 設計 | 預設 chips（4–5 個選項） |
| R6 | Widget Config 是否支援 CDN 快取？更新後多久生效？ | 每次展開重取 vs 快取策略 | 預設每次展開重取 |
| R7 | 知識庫編輯器：Markdown 還是 WYSIWYG？ | `KnowledgeEditor` 元件選型 | 預設 Markdown + 預覽切換 |
| R8 | 匯入格式與欄位定義（CSV 欄位名稱）、單次上限筆數？ | `KnowledgeImportModal` 說明文案與解析邏輯 | 待後端提供範本 |
| R9 | Ticket 本期是否實作完整狀態流，還是只做列表 + 基本狀態切換？ | Phase 2 / 3 工作量 | 預設只做列表 + 開啟 / 進行中 / 已關閉 |
| R10 | 第三語系（日文等）是否本期需要預留資源接口？ | i18n 架構擴充點 | 預設預留 locale key 結構，不填充翻譯 |
| R11 | 後台若未來需加入登入保護，refresh cookie 是否需要搭配使用？ | `middleware/admin-auth.ts`（未來）的 token 生命周期設計 | 本期不設置登入驗證，R11 不適用；若未來加入登入保護再行評估 |
| R12 | 事件追蹤是否需整合第三方工具（GA4 / Mixpanel）？ | `utils/analytics.ts` 實作 | 預設送自有後端 API，第三方 TBD |

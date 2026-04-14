# Frontend Spec — 震南官網 AI 客服聊天機器人前端系統

**Feature Branch**: `001-ai-chatbot-frontend-system`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: 震南企業官網 AI 客服聊天機器人前端系統（前台 Widget + 後台 Admin Dashboard）

> **【拍板決策摘要】**
>
> 1. **SSE 為官方串流方案**：前台聊天主流程採 **`fetch + ReadableStream`** 接收 `text/event-stream`，不考慮 WebSocket，亦不使用 `EventSource`；`services/streaming.ts` 與 `useStreaming` 均以此實作
> 2. **sessionToken 以 path parameter 傳遞**：前端以 `sessionToken` 識別匿名訪客，儲存於 `localStorage`（key: `chat_session_token`）；所有 session-scoped API 以 `:sessionToken` path parameter 呼叫；後端內部映射至 `sessionId`，前端不直接操作
> 3. **Widget Config API 為強依賴**：`GET /api/v1/widget/config` 為正式依賴，Widget 初始化必須呼叫；回傳 `status`（`online | offline | degraded`）及所有文案欄位（`welcomeMessage`、`quickReplies`、`disclaimer`、`fallbackMessage`），均為多語系物件 `{ "zh-TW": "...", "en": "..." }`；`offline` 與 `degraded` 均進入降級模式；API 失敗也進入降級模式；Widget 在任何狀態下均保持可見，不因 `offline` 或 `degraded` 而隱藏
> 4. **Dashboard 本期納入**：後台 Dashboard 頁面、統計卡片、圖表、`GET /api/v1/admin/dashboard` API 均為本期正式範圍
> 5. **Feedback API 本期納入**：`POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback` 為本期正式串接；payload `{ value: "up"|"down", reason?: string }`；至少支援 👍/👎 + 選填原因；可關聯 AI 訊息
> 6. **Ticket 本期納入**：`TicketVM`、Ticket 列表 / 詳情 / 狀態更新（`PATCH .../status`）/ 備註（`POST .../notes`）流程均為本期正式範圍；Ticket 狀態四態：`open | in_progress | resolved | closed`
> 7. **無 handoff status API**：`requestHandoff()` 呼叫 `POST /api/v1/chat/sessions/:sessionToken/handoff` → 後端建立 Lead → 前端顯示靜態「已轉交專人協助」；handoff status polling 移至未來規劃
> 8. **無後台登入驗證**：本期後台無 auth / RBAC，所有 `/admin/*` 路由直接存取
> 9. **無 Email 通知**：Email 通知功能移至未來規劃
> 10. **所有 API 路徑統一為 `/api/v1/...`**：`/api/v1/chat/...`、`/api/v1/widget/config`、`/api/v1/admin/...`
>
> ---
>
> **【本期 API Contract 原則】**
>
> 本期前端正式 API contract 採資源式 `/api/v1/...` 路由。前端以 `sessionToken` 作為匿名訪客會話識別，並透過 **path parameter** 呼叫 session-scoped API。聊天回覆正式採 `fetch + ReadableStream` 接收 SSE 串流，事件格式統一為 `token / done / error / timeout / interrupted`。Widget Config `status` 正式值為 `online | offline | degraded`（不使用 `busy`）；`offline` 與 `degraded` 均進入降級模式，Widget 可見性不受影響。Lead API payload 包含 `name`、`email`、`company?`、`phone?`、`message?`、`language?`。Handoff、Feedback、Ticket、Dashboard API 皆以本文件定義之 schema 為準。本期不做 Auth / Login / RBAC、Email 通知、handoff status API、end session API、營運報表。後台預設入口為 `/admin/dashboard`。

---

## 1. 專案目的

震南企業希望在官網導入 AI 客服系統，以降低人工客服負擔、提升訪客諮詢體驗，並讓潛在客戶能在第一時間獲得產品、技術、報價等資訊。

本前端系統肩負兩大任務：

1. **前台 AI 客服 Widget**：嵌入震南官網右下角，提供即時、全天候的 AI 問答入口，並在 AI 無法回應時提供降級模式與轉人工流程。
2. **後台 Admin Dashboard**：提供管理者、內容編輯與審核者管理 AI 客服系統的完整後台介面，涵蓋知識庫維護、對話稽核、Lead/Ticket 追蹤、回饋分析等。

---

## 2. 產品目標

| # | 目標 | 衡量指標 |
|---|------|---------|
| G1 | 降低人工客服回覆量 | AI 自助解答率 ≥ 70% |
| G2 | 提升訪客諮詢轉換率 | 留資（Lead）提交數較現狀提升 ≥ 30% |
| G3 | 確保機密資訊不外洩 | 機密問題攔截覆蓋率 100%，0 件外洩事件 |
| G4 | 縮短管理者維護知識庫的作業時間 | 知識庫更新從提交到上線 ≤ 2 個工作天 |
| G5 | 提供完整可稽核的對話軌跡 | 100% 對話有完整紀錄，稽核查詢回應 ≤ 3 秒 |

---

## 3. 非目標（Out of Scope）

- 前端直接呼叫 OpenAI API（前端僅呼叫後端 API，後端負責整合 AI）
- 前端儲存或暴露任何 OpenAI API Key 或後端機密設定
- 電商購物車、訂單管理、ERP/CRM 系統整合（屬後端或其他系統範疇）
- 一般企業 CMS（本後台僅聚焦 AI 客服相關管理）
- 多品牌 / 多租戶架構（本版本僅服務震南單一品牌）
- 原生 iOS / Android App（本版本僅支援 Web RWD）
- 即時視訊或語音客服

---

## 4. 使用者角色

| 角色 | 說明 | 主要使用介面 |
|------|------|------------|
| **官網訪客 / 潛在客戶** | 瀏覽震南官網的一般大眾，可能為採購窗口、工程師或終端消費者 | 前台 Widget |
| **後台管理者** | 負責管理 AI 客服相關資料，包含知識庫、對話紀錄、Lead / Ticket、Widget 設定等 | 後台全功能 |

---

## 5. 產品範圍

### In Scope

**前台**
- AI 客服 Widget（收合 / 展開狀態）
- 多輪對話（含串流回覆）
- FAQ / 產品推薦 / 技術支援 / 報價引導 / 公司資訊問答
- 快捷提問按鈕
- 留資表單
- 轉人工客服流程
- 機密問題攔截提示與 Prompt Injection 防護提示
- 回覆失敗 / 重試 / timeout / 降級模式
- 滿意度回饋（讚 / 倒讚）
- 多語系切換（繁體中文、英文，預留第三語系）
- RWD（桌機 / 平板 / 手機）

**後台**
- ~~後台登入~~ （本期不設置登入驗證）
- Dashboard 概覽
- 知識庫管理（CRUD、匯入、版本管理）
- 對話紀錄查詢（列表 / 詳情 / 匯出）
- Lead 管理（本期含 handoff 觸發後建立 Lead）
- Ticket 管理
- 意圖 / 模板管理
- 快捷提問管理
- Widget 文案與設定管理
- 稽核事件檢視
- 回饋紀錄（後台唯讀列表）；Feedback API 本期正式串接

**本期正式不做（Deferred）**：後台登入驗證 / Auth / RBAC、handoff status polling API、Email 通知、end session API、營運報表

### Out of Scope

- 後端 API、AI 模型、RAG 知識庫、Prompt Guard 實作
- OpenAI 費用計費 UI
- 客服真人即時聊天介面（轉人工後由外部系統接手）
- 多租戶管理

---

## 6. 前台產品需求

### 6.1 Widget 收合狀態

- 官網右下角固定浮動，z-index 置頂
- 呈現膠囊型 CTA 按鈕，顯示文案（預設：「AI 客服在線，立即諮詢」）
- 含 AI 狀態指示燈：綠色＝線上（`online`），紅色＝降級（`degraded`），灰色＝離線（`offline`）
- 手機版收合狀態縮小為圓型 FAB（floating action button），含品牌 icon
- Widget 在 `online`、`offline`、`degraded` 三種狀態下均保持可見，入口均可開啟
- 若 `status` 為 `offline` 或 `degraded`，狀態文案改為「客服諮詢（留言）」，進入降級模式

### 6.2 Widget 展開狀態

- 桌機版：右側滑出聊天面板，寬度固定（TBD：~380px），高度佔視窗約 80%
- 手機版：全螢幕覆蓋，類似 modal sheet
- 動態開合動畫，使用者可隨時收合
- 展開時鎖定背景頁面捲動（手機版）

### 6.3 聊天面板布局（由上至下）

```
┌─────────────────────────────┐
│  Header（品牌 / AI 狀態）    │
├─────────────────────────────┤
│  聯絡捷徑列（電話 / 網址 / 地點）│
├─────────────────────────────┤
│                             │
│  對話訊息區（可滾動）         │
│                             │
├─────────────────────────────┤
│  快捷提問按鈕列（可橫向滾動）  │
├─────────────────────────────┤
│  輸入區（文字框 + 送出按鈕）   │
├─────────────────────────────┤
│  頁尾說明（AI 免責聲明）      │
└─────────────────────────────┘
```

### 6.4 Header

- 顯示品牌名稱（震南企業）與品牌 logo
- 顯示「AI 客服」標記（badge）
- 顯示線上狀態文字（線上 / 降級 / 離線）
- 右側操作按鈕：語系切換、關閉（收合 Widget）

### 6.5 聯絡捷徑列

- 顯示至多 3 個捷徑圖示（可設定）：電話撥打、官網連結、Google Maps 地點
- 點擊直接觸發對應系統動作（tel: / URL / Maps）
- 捷徑內容由後台 Widget 設定管理

### 6.6 對話訊息區

- 區分訪客訊息（右側氣泡）與 AI 回覆（左側氣泡 + AI avatar）
- 每則訊息顯示絕對時間（HH:mm）
- 支援 Markdown 基礎渲染（粗體、條列、連結）
- AI 串流回覆：逐字顯示效果（streaming tokens），附加載中指示器
- 訊息讀取狀態：已送出 / 處理中 / 已回覆
- 可滾動，新訊息自動滾動到底部
- 第一次開啟顯示歡迎訊息（可由後台設定）
- 歡迎訊息下方顯示快捷提問按鈕

### 6.7 快捷提問按鈕

- 預設快捷提問（可由後台管理）：
  - 產品查詢
  - 技術支援
  - 報價與訂購
  - 公司資訊
  - 聯絡我們
- 橫向滾動排列，超過寬度時可左右滑動
- 點擊後直接以訪客身份發送該問題
- 傳送後快捷提問列隱藏（或縮至次要位置），待對話重置後再顯示
- 快捷提問支援多語系

### 6.8 輸入區

- 單行文字輸入框（超過一定字數可展開為多行，上限 500 字）
- 送出按鈕（Enter 鍵 / 點擊皆可送出）
- 送出中（等待 AI 回覆期間）輸入框鎖定、顯示取消按鈕
- 空白訊息不可送出（輸入框紅框提示）
- 支援貼上純文字

### 6.9 頁尾說明

- 固定小字：「本服務由 AI 提供，回覆僅供參考，如需確認請聯繫客服。」
- 文案可由後台設定管理

### 6.10 多輪對話

- 同一 session 內支援多輪連續問答
- 前端儲存 `sessionToken`（localStorage，key: `chat_session_token`），用於跨頁面重整恢復對話
- **`sessionToken` 作為 path parameter 傳遞**：所有 session-scoped API（訊息、留資、轉人工、回饋）皆以 `:sessionToken` 嵌入 URL 路徑，例如 `/api/v1/chat/sessions/:sessionToken/messages`
- 後端以 `sessionToken` 識別匿名訪客，內部映射至 `sessionId`（前端不直接操作 `sessionId`）
- 重新整理頁面後可恢復上次對話（session 有效期內）
- 使用者可主動「重新開始對話」（純前端行為：清除 localStorage `chat_session_token`，重新呼叫 `POST /api/v1/chat/sessions` 建立新 session；本期不提供後端 end session API）

### 6.11 串流回覆

- 使用 **`fetch + ReadableStream`** 接收 `text/event-stream` 串流回覆（本期確認使用此方案，不使用 `EventSource`，非 WebSocket）
- SSE 事件格式（後端統一輸出）：
  - `event: token` → `data: {"token":"..."}` — 逐字輸出 token
  - `event: done` → `data: {"messageId":"uuid","action":"answer|handoff|fallback|intercepted","sourceReferences":[],"usage":{...}}` — 串流完成
  - `event: error` → `data: {"code":"string","message":"string"}` — 後端錯誤
  - `event: timeout` → `data: {"message":"string"}` — 逾時
  - `event: interrupted` → `data: {"message":"string"}` — 中斷
- 取消串流：呼叫 `AbortController.abort()`，不使用 HTTP DELETE endpoint
- 回覆過程中逐字呈現，動畫流暢
- 串流中斷時顯示部分內容 + 重試提示
- 串流超時（預設 30 秒無回應）自動觸發 timeout 提示

### 6.12 FAQ / 產品推薦 / 技術支援 / 公司資訊 / 報價引導

- AI 回覆可包含：純文字、條列說明、產品卡片（含圖片、名稱、簡介、詢問按鈕）
- 報價引導：AI 無法直接報價時，引導填寫留資表單或直接聯繫業務
- 技術支援：AI 回覆含解決步驟，無法解決時引導提交 Ticket
- 公司資訊：AI 回覆含公司基本資料、聯絡資訊

### 6.13 留資表單（Lead Form）

- 觸發時機：訪客詢問報價、要求聯絡、或 AI 主動引導，或轉人工時引導留資
- 在對話區內以 inline 卡片形式展開
- **必填欄位：姓名（name）、Email（email）**
- **選填欄位：公司名稱（company）、電話（phone）、訊息（message）、語言偏好（language）**
- `language` 欄位由前端自動帶入當前語系（`zh-TW` / `en`），不需訪客手動填寫
- API payload：`{ name, email, company?, phone?, message?, language? }`，路由 `POST /api/v1/chat/sessions/:sessionToken/lead`
- Lead payload 需與後端 SRS 最小資料契約對齊，至少包含：客戶資訊（name/email）、訊息（message）、語言（language）、觸發原因（triggerReason）
- 提交後顯示確認訊息，並在後台建立 Lead 紀錄
- 表單關閉後不可重複提交（同一 session 內）

### 6.14 轉人工客服流程

- 觸發時機：訪客主動要求、AI 連續回覆失敗 N 次（TBD：N=3）、AI 信心度過低，或後端回應標記 `handoff: true`
- **本期流程**：前端呼叫 `POST /api/v1/chat/sessions/:sessionToken/handoff`，後端建立 Lead 紀錄並回傳 `{ accepted, action, leadId?, ticketId?, message }` → 前端顯示「已轉交專人協助，我們將盡快與您聯繫。」靜態確認訊息
- 若訪客希望留下聯絡方式，引導填寫 Lead Form（name + email 必填）
- **本期不做**：轉人工後的 handoff status polling → 移至未來規劃
- **本期不做**：HandoffStatusCard 多狀態流轉（requested / waiting / connected / unavailable）→ 移至未來規劃

### 6.15 機密問題攔截與 Prompt Injection 防護

- 後端判斷問題涉及機密（如內部報價、員工個資等），前端顯示：
  > 「此問題涉及機密資訊，無法回覆，如有需要請直接聯繫客服。」
- 後端判斷為 Prompt Injection 攻擊，前端顯示：
  > 「您的問題無法被處理，請重新提問。」
- 以上提示以專屬氣泡樣式呈現（與一般錯誤訊息區分）
- 攔截事件不影響 session 繼續使用

### 6.16 回覆失敗 / 重試 / Timeout / 降級模式

| 情境 | 前端行為 |
|------|---------|
| 網路錯誤 / API 失敗 | 顯示「訊息傳送失敗，請重試」+ 重試按鈕 |
| 串流 Timeout（30 秒） | 顯示「回覆超時，請再試一次」+ 重試按鈕 |
| AI 服務完全不可用（`status: offline` 或 `status: degraded`）或 Widget Config API 呼叫失敗 | 進入降級模式：Widget 仍可見、仍可開啟，提示「AI 客服暫時無法使用，請留言或電話聯繫」，並顯示留資入口；Widget 可見性不受 `offline` / `degraded` 影響 |
| 低信心度回覆 | 後端標記時，AI 回覆末端附加「建議您直接聯繫客服確認」提示文字 |
- 降級模式下，快捷提問維持顯示，聯絡捷徑列保持可用

### 6.17 滿意度回饋

- 每則 AI 回覆下方顯示讚（👍）/ 倒讚（👎）小按鈕
- 點擊後按鈕變色確認，同一則訊息只能回饋一次（可切換）
- 選擇倒讚後可選填原因（TBD：開放文字 or 選項清單）
- **本期正式串接 Feedback API**：點擊讚 / 倒讚後呼叫 `POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback`，payload 為 `{ "value": "up"|"down", "reason": "string（選填）" }`
- 本期至少支援 👍/👎 + 選填原因，可關聯至 AI 訊息 ID

### 6.18 多語系

- 預設語系：繁體中文（zh-TW）
- 支援語系：繁體中文、英文（en），預留第三語系擴充點
- 語系切換位置：Header 右側下拉
- 語系套用範圍：Widget 所有文案、快捷提問、AI 歡迎訊息、留資表單標籤
- 前台 i18n 資源由後台 Widget 設定動態提供（或前端靜態 i18n + 後台可覆蓋文案）

### 6.19 RWD

| 斷點 | 布局行為 |
|------|---------|
| ≥ 1024px（桌機） | Widget 右側固定，聊天面板以 panel 形式展開，寬度固定 |
| 768px–1023px（平板） | 同桌機，面板寬度略窄 |
| < 768px（手機） | Widget 為右下角 FAB，展開為全螢幕 modal，底部輸入區固定 |

---

## 7. 後台產品需求

### 7.1 後台登入

> **⚠️ 本期不設置登入驗證（Auth / RBAC 移至未來規劃）**。本期後台所有 `/admin/*` 路由直接存取，無需帳密，無 middleware 守衛。前台提供低調的「管理後台」入口按鈕直接導向 `/admin/dashboard`。

### 7.2 Dashboard 概覽

- 統計卡片：今日對話數、本月對話數、AI 自助解答率、待處理 Ticket 數、新增 Lead 數
- 折線圖：近 7 / 30 天對話量趨勢
- 圓餅圖：意圖分布（產品詢問 / 技術支援 / 報價 / 其他）
- 近期稽核事件列表（最新 5 筆，可點擊跳至稽核頁）
- 未讀 Ticket 提示

### 7.3 知識庫管理

- 知識條目列表：標題、分類、狀態（草稿 / 已發佈 / 已停用）、最後更新時間
- 新增 / 編輯知識條目（富文字編輯器或 Markdown 編輯器，TBD）
- 批次匯入（CSV / JSON 格式，需有錯誤提示）
- 版本歷史：查看條目每次修改紀錄，可比對差異，可還原
- 搜尋與篩選：依分類、狀態、關鍵字
- 知識庫分類管理（CRUD）

### 7.4 對話紀錄查詢

- 列表：Session ID、開始時間、對話輪數、語系、狀態（進行中 / 結束 / 轉人工）、是否有回饋
- 詳情頁：完整對話內容（含時間戳、AI 信心度標記、攔截事件標記）
- 篩選：時間範圍、語系、狀態、是否含機密攔截、是否含 Prompt Injection
- 搜尋：依關鍵字搜尋訊息內容
- 匯出：CSV（依篩選條件）
- 分頁 + 無限捲動（TBD）

### 7.5 Lead / Ticket 管理

**Lead 管理**
- 列表：姓名、公司、聯絡方式、詢問品項、建立時間、處理狀態
- 詳情：完整留資資訊 + 關聯對話連結
- 狀態變更：待處理 / 處理中 / 已完成
- 指派業務人員（TBD：是否需要在本後台完成，或由 CRM 接手）

**Ticket 管理**
- 列表：Ticket ID、主旨、建立時間、狀態（開啟 / 進行中 / 已解決 / 已關閉）、優先級
- 詳情：問題描述 + 關聯對話 + 處理紀錄
- 狀態變更與備註
- 篩選：狀態、優先級、時間範圍

### 7.6 意圖 / 模板管理

- 意圖列表：意圖名稱、觸發關鍵字、對應回覆模板、啟用狀態
- 新增 / 編輯意圖（名稱、關鍵字、模板內容、優先級）
- 回覆模板：支援文字 + 按鈕（快捷提問跳轉 / 留資觸發 / 外部連結）
- 啟用 / 停用意圖
- 預覽：輸入測試問句，預覽意圖匹配與回覆模板

### 7.7 快捷提問管理

- 列表：快捷提問文案（多語系）、排序、啟用狀態
- 新增 / 編輯 / 刪除
- 拖曳排序
- 多語系文案設定（繁中 / 英文）
- 即時預覽（對應前台 Widget 快捷提問列排列）

### 7.8 Widget 文案與設定管理

- 收合狀態 CTA 文案（多語系）
- 歡迎訊息（多語系）
- 頁尾免責聲明文案（多語系）
- 聯絡捷徑列設定（電話、官網 URL、地圖連結，最多 3 個）
- AI 標記文字
- 線上 / 離線 / 降級狀態文案
- 即時預覽面板（變更後即時看到前台 Widget 效果）

### 7.9 稽核事件檢視

- 列表：事件時間、事件類型（機密攔截 / Prompt Injection / 轉人工 / 低信心度）、Session ID、嚴重程度
- 詳情：事件上下文對話、系統判斷依據摘要
- 篩選：事件類型、時間範圍、嚴重程度
- 匯出：CSV

### 7.10 回饋紀錄

**回饋紀錄**
- 列表：Session ID、訊息摘要、回饋類型（讚 / 倒讚）、倒讚原因、時間
- 篩選：回饋類型、時間範圍

---

## 8. 前後端整合邊界

> 本節僅定義前端需要的 API 能力類型，不描述後端實作細節。

### 8.1 前台 API 能力需求

所有前台 API 路徑統一使用 `/api/v1/...` 前綴。

| 能力 | API 路徑 | 說明 |
|------|---------|------|
| 取得 Widget 設定 | `GET /api/v1/widget/config` | **正式依賴**；回傳 `{ status, welcomeMessage, quickReplies, disclaimer, fallbackMessage }`（`status` 值為 `online \| offline \| degraded`；`offline` 與 `degraded` 均觸發降級模式；所有文案欄位為多語系物件 `{"zh-TW":"...","en":"..."}`）；Widget 初始化時必須呼叫，失敗時亦觸發降級模式並 fallback 至靜態 i18n 文案；Widget 可見性不受 `status` 值影響 |
| 建立聊天 Session | `POST /api/v1/chat/sessions` | 取得 sessionToken，供後續 session-scoped API 使用 |
| 發送訊息 / 接收 SSE 串流回覆 | `POST /api/v1/chat/sessions/:sessionToken/messages` | 傳送使用者訊息，以 `fetch + ReadableStream` 接收 AI SSE 串流回覆 |
| 取得對話歷史 | `GET /api/v1/chat/sessions/:sessionToken/history` | 依 sessionToken 取回歷史對話訊息（session 恢復用） |
| 送出留資表單 | `POST /api/v1/chat/sessions/:sessionToken/lead` | payload: `{ name, email, company?, phone?, message?, language? }`；`language` 由前端自動帶入當前語系 |
| 轉人工客服 | `POST /api/v1/chat/sessions/:sessionToken/handoff` | 發出轉接請求；後端建立 Lead；回傳 `{ accepted, action, leadId?, ticketId?, message }`；前端顯示已轉交確認訊息 |
| 送出滿意度回饋 | `POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback` | **本期正式串接**；payload: `{ "value": "up"\|"down", "reason": "string（選填）" }` |
| ~~Handoff Status 查詢~~ | ~~`GET /api/v1/chat/handoff/status`~~ | **本期不串接**，移至未來規劃 |

### 8.2 後台 API 能力需求

所有後台 API 路徑統一使用 `/api/v1/admin/...` 前綴。

| 能力 | 說明 |
|------|------|
| ~~後台登入 / 登出~~ | **本期不設置登入驗證** |
| Dashboard 統計資料 | `GET /api/v1/admin/dashboard`；統計卡片、對話趨勢圖、意圖分布 |
| 知識庫 CRUD | 條目列表、詳情、新增、編輯、刪除 |
| 知識庫批次匯入 | 上傳 CSV / JSON，取得匯入結果 |
| 知識庫版本歷史 | 條目版本列表、差異比對、還原 |
| 對話紀錄列表 / 詳情 | 含分頁、篩選、搜尋 |
| 對話紀錄匯出 | 依篩選條件取得 CSV 下載連結 |
| Lead 列表 / 詳情 / 狀態更新 | CRUD（狀態操作為主，含 handoff 觸發建立的 Lead） |
| Ticket 列表 / 詳情 / 狀態更新 | 狀態四態：`open | in_progress | resolved | closed`；`PATCH /api/v1/admin/tickets/:id/status` 更新狀態；`POST /api/v1/admin/tickets/:id/notes` 新增備註 |
| 意圖 / 模板 CRUD | 列表、新增、編輯、刪除、啟停用 |
| 快捷提問 CRUD | 含排序更新 |
| Widget 設定讀寫 | 取得 / 更新文案與設定 |
| 稽核事件列表 / 詳情 | 含篩選與匯出 |
| 回饋紀錄列表 | 含篩選；本期前台 Feedback API 正式串接，後台提供查詢介面 |
| ~~營運報表資料~~ | **本期不做** |
| ~~報表匯出~~ | **本期不做** |

---

## 9. 非功能需求

### 9.1 安全性

- **前端禁止暴露 OpenAI API Key 或任何後端機密設定**，所有 AI 呼叫均透過後端 API
- 本期後台不設置登入驗證（Auth / RBAC 移至未來規劃）；後台 `/api/v1/admin/...` 請求直接發送，不附加 Authorization header
- 前台 sessionToken 儲存於 localStorage（key: `chat_session_token`），用於匿名訪客 session 識別
- 表單輸入需做基本前端驗證（防止空送、長度限制）
- 敏感操作（刪除、還原版本）需二次確認提示

### 9.2 錯誤處理

- 全域 API 錯誤攔截：401（本期後台無登入，暫不處理）、500（顯示通用錯誤）
- 前台：所有 API 失敗顯示使用者友善訊息，提供重試入口
- 後台：表單提交失敗顯示欄位級別錯誤訊息
- 未預期錯誤上報前端錯誤追蹤服務（TBD：Sentry 或等效工具）

### 9.3 降級模式

- Widget 在以下三種情況下均進入降級模式：
  1. Widget Config API 回傳 `status: offline`
  2. Widget Config API 回傳 `status: degraded`
  3. Widget Config API 呼叫本身失敗（網路錯誤 / 非 2xx）
- **Widget 可見性不受影響**：無論 `offline`、`degraded` 或 API 失敗，Widget 均保持可見、可開啟
- 降級模式下禁用 AI 對話輸入，顯示 `fallbackMessage`（多語系）
- 降級模式下顯示留資入口，引導訪客填寫 Lead Form 或使用聯絡捷徑
- 後台在 API 服務不可用時，顯示維護中提示，不允許資料操作

### 9.4 可用性與效能

- 前台 Widget 初始載入（cold start）≤ 3 秒（4G 網路）
- 後台頁面首屏渲染 ≤ 2 秒
- 串流回覆第一個字元顯示 ≤ 2 秒（P95）
- 對話紀錄列表查詢回應 ≤ 3 秒

### 9.5 RWD 與跨裝置支援

- 前台 Widget：支援 Chrome / Safari / Firefox 最新兩個主要版本，iOS Safari 14+、Android Chrome 90+
- 後台 Admin：僅需支援桌機瀏覽器（1280px 以上），手機版後台為 Nice-to-have

### 9.6 基本無障礙（Accessibility）

- 前台 Widget：WCAG 2.1 Level AA 為目標（鍵盤可操作、色彩對比 ≥ 4.5:1、ARIA label 標示）
- 後台：基本 ARIA landmark、表單 label 綁定、鍵盤可操作

### 9.7 事件追蹤 / 埋點

- 前台追蹤事件（至少）：
  - Widget 開啟 / 收合
  - 快捷提問點擊（含提問文案）
  - 訊息送出
  - 留資表單開啟 / 提交
  - 轉人工觸發
  - 滿意度回饋（讚 / 倒讚）
  - 語系切換
- 事件資料送往後端 API（不直接送第三方分析服務，避免資料外洩）
- 後台操作埋點：TBD（依需要再規劃）

### 9.8 Session 恢復策略

- 前台 session 識別以 `sessionToken`（localStorage `chat_session_token`）為準，有效期由後端定義（TBD：預設 24 小時）；`sessionToken` 並作為 path parameter 傳入所有 session-scoped API（`/api/v1/chat/sessions/:sessionToken/...`）。後端以 `sessionToken` 識別匿名訪客，內部映射至 `sessionId`；前端不直接操作 `sessionId`。
- 後端以 `sessionToken` 識別匿名訪客，內部映射至 `sessionId`；前端不直接操作 `sessionId`
- 頁面重載後自動帶入 `sessionToken`，呼叫歷史對話 API 恢復對話
- session 過期後，下次開啟 Widget 自動建立新 session，並顯示新歡迎訊息
- 跨 Tab 共用同一 session（localStorage 機制）
- **本期不提供 end session API**：訪客「重新開始對話」為純前端行為（清除 localStorage 中的 `chat_session_token`，並重新呼叫 `POST /api/v1/chat/sessions` 建立新 session）；後端不需提供 DELETE/end session 端點

---

## 10. 驗收條件

### 10.1 前台驗收

- [ ] Widget 收合狀態正確顯示於官網右下角，點擊可展開聊天面板
- [ ] 展開後 Header、聯絡捷徑列、對話區、快捷提問、輸入區、頁尾均正確呈現
- [ ] 快捷提問點擊後正確發送訊息並觸發 AI 回覆
- [ ] 串流回覆逐字顯示，動畫流暢，無卡頓
- [ ] 多輪對話可連續問答，頁面重整後可恢復對話
- [ ] 留資表單可正確填寫與提交，後台可見 Lead 紀錄
- [ ] 轉人工流程正確觸發，非服務時間顯示留資引導
- [ ] 機密攔截與 Prompt Injection 攔截顯示正確提示訊息
- [ ] API 失敗 / timeout 顯示錯誤提示並提供重試
- [ ] AI 服務不可用時進入降級模式，Widget 仍可開啟
- [ ] 滿意度回饋可送出（`POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback`），同一訊息僅能回饋一次（可切換）
- [ ] 繁中 / 英文語系切換正確套用所有前台文案
- [ ] 桌機、平板、手機版 RWD 布局均符合設計規範

### 10.2 後台驗收

- [ ] 管理者可直接存取後台所有功能頁面（本期無需登入驗證），預設入口導向 `/admin/dashboard`
- [ ] Dashboard 統計卡片與圖表正確顯示，資料與後端一致
- [ ] 知識庫條目可新增、編輯、刪除，版本歷史可查詢差異並還原
- [ ] 批次匯入 CSV / JSON 顯示正確成功 / 錯誤結果
- [ ] 對話紀錄列表可依條件篩選並查看詳情，可匯出 CSV
- [ ] Lead 與 Ticket 可查看詳情並更新狀態
- [ ] 意圖 / 模板與快捷提問可正確 CRUD 及排序
- [ ] Widget 設定修改後即時預覽面板正確反映
- [ ] 稽核事件列表依類型篩選正確
- [ ] 回饋紀錄列表可依類型與時間範圍篩選

### 10.3 安全與穩定性驗收

- [ ] 前端原始碼（含 bundle）中不含任何 OpenAI API Key 或後端機密資訊
- [ ] 本期後台無需登入驗證，所有 `/admin/*` 路由可直接存取（auth 移至未來規劃）
- [ ] 前台 Prompt Injection 測試：輸入注入指令，後端攔截後前端正確顯示提示
- [ ] Widget 在 AI 服務模擬故障時，降級模式正確啟動
- [ ] 串流 Timeout 測試：30 秒無回應後顯示 timeout 提示

---

## 11. 待釐清事項

以下問題需在 clarify 階段與甲方或後端團隊確認：

| # | 問題 | 影響範圍 |
|---|------|---------|
| Q1 | Session token 儲存方式：localStorage vs sessionStorage vs HttpOnly Cookie？後端支援哪種方式？ | Session 恢復策略、安全性 |
| Q2 | 轉人工客服成功後，前端需對接的即時客服系統為何（如 Zendesk、自建 WebSocket）？前端需嵌入第三方 SDK 或僅更新狀態 UI？ | 轉人工流程實作範圍 |
| Q3 | 知識庫條目編輯器：採用富文字編輯器（WYSIWYG）或 Markdown 編輯器？ | 知識庫管理 UI |
| Q4 | Widget 設定（文案、快捷提問）是否以 API 動態取得（每次開啟 Widget 時拉取），或採靜態打包搭配 CDN 快取？這影響更新即時性。 | Widget 設定管理、前台初始化流程 |
| Q5 | 滿意度回饋的倒讚原因：開放文字輸入 or 預設選項清單（如：回覆不正確 / 無法理解 / 未回答問題）？ | 前台回饋 UI |
| Q6 | Lead 指派業務功能是否需整合至本後台？或由 CRM 系統接手後僅需本後台顯示狀態？ | Lead 管理範疇 |
| Q7 | 前台事件追蹤是否需要整合第三方分析工具（GA4、GTM、Mixpanel）？或僅送往自有後端？ | 埋點與資料隱私 |
| Q8 | Widget 是否需支援「自訂主題色」供未來其他品牌嵌入使用？或固定震南品牌色即可？ | Widget 設計與元件架構 |
| Q9 | ~~AI 串流回覆協議：後端確認使用 SSE 或 WebSocket？~~ | **已拍板：本期使用 `fetch + ReadableStream` 接收 SSE（Server-Sent Events）**，前台 `useStreaming.ts` 以此實作，不使用 `EventSource`，不使用 WebSocket |

---

## 12. 建議實作優先順序

| Phase | 功能範圍 | 優先度 |
|-------|---------|--------|
| **Phase 1（MVP）** | 前台 Widget 收合 / 展開、多輪對話、串流回覆、快捷提問、機密攔截提示、降級模式 | P1 |
| **Phase 2** | 留資表單、轉人工流程（簡化版）、滿意度回饋（Feedback API 串接）、對話紀錄查詢 | P1 |
| **Phase 3** | Dashboard 概覽、知識庫管理（含版本）、Lead / Ticket 管理 | P2 |
| **Phase 4** | 意圖 / 模板管理、快捷提問管理、Widget 設定管理（含即時預覽）、稽核事件 | P2 |
| **Phase 5** | 回饋紀錄、多語系（英文）、無障礙優化、事件追蹤埋點；**營運報表移至未來規劃** | P3 |

---

## User Scenarios & Testing

### User Story 1 — 官網訪客透過 Widget 取得即時 AI 回覆 (Priority: P1)

訪客進入震南官網，點擊右下角 AI 客服入口，輸入產品詢問問題，獲得 AI 串流回覆，並可繼續多輪追問。

**Why this priority**: 這是整個系統最核心的使用者旅程，也是所有後續功能的基礎。

**Independent Test**: 啟動前台 Widget，輸入「請問有哪些產品系列？」，應收到 AI 串流回覆，可繼續追問。

**Acceptance Scenarios**:

1. **Given** 訪客在官網頁面，**When** 點擊右下角 Widget 收合按鈕，**Then** 聊天面板展開，顯示歡迎訊息與快捷提問
2. **Given** 聊天面板已展開，**When** 點擊「產品查詢」快捷提問，**Then** 訊息送出，AI 串流回覆開始逐字顯示
3. **Given** AI 已回覆，**When** 訪客繼續追問，**Then** 對話歷史保留，AI 回覆新問題
4. **Given** 訪客已有 session，**When** 重新整理頁面後再次開啟 Widget，**Then** 歷史對話正確恢復

---

### User Story 2 — 訪客填寫留資表單取得報價引導 (Priority: P1)

訪客詢問報價時，AI 引導填寫留資表單，提交後後台建立 Lead 紀錄。

**Why this priority**: 留資是系統最直接的商業轉換目標。

**Independent Test**: 輸入「我想詢問報價」，AI 顯示留資卡片，填寫並送出，後台 Lead 列表出現新筆記錄。

**Acceptance Scenarios**:

1. **Given** 訪客詢問報價，**When** AI 引導後留資卡片出現，**Then** 訪客可填寫姓名、公司、聯絡方式
2. **Given** 表單填妥，**When** 送出，**Then** 顯示確認訊息，後台 Lead 列表新增一筆記錄
3. **Given** 同一 session 已提交過留資，**When** 再次觸發留資，**Then** 顯示「已登記」提示，不重複送出

---

### User Story 3 — 後台管理者查看對話紀錄與稽核事件 (Priority: P2)

管理者進入後台，篩選特定時間範圍的對話紀錄，查看含機密攔截事件的對話詳情。

**Why this priority**: 可追溯性是系統合規與品質保證的基礎。

**Independent Test**: 以管理者帳號登入，進入對話紀錄頁面，篩選「含機密攔截」對話，點擊查看完整對話。

**Acceptance Scenarios**:

1. **Given** 管理者已登入，**When** 進入對話紀錄頁面並選擇時間範圍，**Then** 列表正確顯示符合條件的 Session
2. **Given** 列表已顯示，**When** 篩選「含機密攔截」，**Then** 僅顯示包含攔截事件的 Session
3. **Given** 點擊某 Session，**When** 進入詳情頁，**Then** 完整對話內容顯示，攔截事件以高亮標記呈現

---

### Edge Cases

- Widget 展開時，若 API 回傳 AI 服務不可用，顯示降級提示，聯絡捷徑與留資入口仍可用
- 使用者輸入超過 500 字時，輸入框顯示字數警告並禁止送出
- 串流回覆進行中使用者關閉 Widget，重新開啟後串流中斷，顯示部分回覆 + 重試按鈕
- 批次匯入知識庫時，部分條目格式錯誤，顯示成功筆數 + 失敗原因列表

---

## Requirements

### Functional Requirements

- **FR-001**: 前台 Widget 必須在官網右下角固定顯示，支援收合與展開狀態切換
- **FR-002**: 前台必須透過後端 API 進行所有 AI 通訊，不得直接呼叫任何 AI 服務
- **FR-003**: 前台必須支援 Server-Sent Events（SSE）串流回覆顯示（本期確認使用 `fetch + ReadableStream`，不使用 `EventSource`）
- **FR-004**: 前台必須在 AI 服務不可用時顯示降級模式，保留聯絡入口
- **FR-005**: 前台必須支援多輪對話與 session 恢復
- **FR-006**: 前台留資表單必填欄位為姓名（name）與 Email（email）；公司（company）、電話（phone）、訊息（message）、語言偏好（language）為選填；`language` 由前端自動帶入當前語系（`zh-TW` / `en`），驗證通過後向後端建立 Lead（`POST /api/v1/chat/sessions/:sessionToken/lead`）
- **FR-007**: 前台機密攔截與 Prompt Injection 攔截必須顯示對應提示訊息
- **FR-008**: 前台滿意度回饋本期正式串接 Feedback API（`POST /api/v1/chat/sessions/:sessionToken/messages/:messageId/feedback`）；payload `{ "value": "up"|"down", "reason": "string（選填）" }`；並維護本地 UI 狀態同步
- **FR-009**: 前台 Widget 必須支援繁體中文與英文語系切換
- **FR-010**: 前台必須在桌機、平板、手機三種斷點正確呈現 RWD 布局
- **FR-011**: 本期後台不設置登入驗證，所有 `/admin/*` 路由直接存取；Auth / RBAC 移至未來規劃
- **FR-012**: 後台知識庫必須支援版本歷史、差異比對與還原
- **FR-013**: 後台知識庫必須支援審核流程（送審 → 核准 / 退回）
- **FR-014**: 後台對話紀錄必須支援篩選、搜尋與 CSV 匯出
- **FR-015**: 後台 Widget 設定必須有即時預覽功能
- **FR-016**: 本期後台無需登入，管理功能直接存取；未來加入登入保護時再新增 middleware

### Key Entities

- **ChatSession**：一次完整的訪客對話，含 session ID、語系、狀態、建立時間
- **Message**：單則訊息，含角色（user / ai）、內容、時間戳、信心度、攔截標記
- **Lead**：訪客留資記錄，含聯絡資訊（name、email、company?、phone?）、訊息（message?）、語言偏好（language?）、關聯 session、觸發原因、處理狀態
- **Ticket**：技術支援工單，含主旨、描述、優先級、狀態、關聯 session
- **KnowledgeEntry**：知識庫條目，含標題、內容、分類、版本、發佈狀態
- **Intent**：意圖定義，含名稱、觸發關鍵字、對應回覆模板
- **AuditEvent**：稽核事件，含事件類型、嚴重程度、關聯 session、時間
- **Feedback**：滿意度回饋，含回饋類型、原因、關聯訊息 ID
- **WidgetConfig**：Widget 設定，含文案、捷徑、語系、狀態文字

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 官網訪客可在 30 秒內完成第一次問答互動（從點擊 Widget 到收到 AI 回覆）
- **SC-002**: AI 串流回覆第一個字元顯示時間 ≤ 2 秒（P95 用戶體驗）
- **SC-003**: Widget 在桌機、平板、手機三種裝置上的核心功能（問答、留資）100% 可正常操作
- **SC-004**: 後台管理者可在 5 分鐘內完成一個知識庫條目從新增到送審的流程
- **SC-005**: 機密問題與 Prompt Injection 攔截後，使用者 100% 看到明確提示，無空白或系統錯誤頁
- **SC-006**: AI 服務不可用期間，前台 Widget 降級模式啟動率 100%，聯絡入口 100% 可用

---

## Assumptions

- 後端提供 RESTful API 與 SSE 串流介面（`fetch + ReadableStream`），前端不需自行實作 AI 邏輯
- 前台 Widget 以 iframe 或 Web Component 形式嵌入震南官網（TBD），不影響官網主體樣式
- 後台使用者帳號由管理者在後台建立，初期無需對接外部 SSO / LDAP
- 多語系 i18n 資源以前端靜態檔案為主，後台文案設定可覆蓋特定欄位
- Widget 設計風格以震南品牌色為主，具體色票與字型由設計稿提供
- 本 spec 不涵蓋後端 RAG、Prompt Guard、OpenAI 整合細節，僅定義前端所需 API 能力

---

## 本次修正摘要（spec.md 一致性修訂）

> **修訂原則**：本次修訂僅針對 spec.md 內部一致性，不修改 design.md / plan.md / task.md。

| # | 修訂位置 | 修訂內容 |
|---|---------|---------|
| 1 | API Contract 原則（頁首 callout） | 補全 Widget status enum（`online\|offline\|degraded`，不使用 `busy`）、Lead `language?` 欄位、end session API 不在本期、後台預設入口 `/admin/dashboard` |
| 2 | §5 In Scope 回饋紀錄 | 移除 `~~報表本期不做~~` strikethrough 語氣混亂，改為 Deferred 列表統一說明；新增 end session API 至 Deferred |
| 3 | §6.1 Widget 收合狀態 | 明確標示三色對應值（`online`/`degraded`/`offline`）；新增「Widget 在三種狀態下均保持可見」說明；`offline`/`degraded` 改為觸發降級模式 |
| 4 | §6.4 Header | 狀態文字 `繁忙` → `降級` |
| 5 | §6.10 多輪對話 | 「重新開始對話」補充說明為純前端行為，本期不提供後端 end session API |
| 6 | §6.13 留資表單 | 新增選填欄位 `language?`；補充 `language` 由前端自動帶入當前語系；新增 Lead payload 與後端 SRS 最小資料契約對齊說明 |
| 7 | §6.16 降級模式表格 | 觸發條件從「AI 服務完全不可用」擴展為明確列出 `status: offline`、`status: degraded`、Widget Config API 失敗三種情境；強調 Widget 可見性不受影響 |
| 8 | §7.10 | 章節名稱「回饋紀錄與基本營運報表」→「回饋紀錄」；移除「**營運報表**」整個子節（趨勢圖、圓餅圖、CSV 匯出等） |
| 9 | §8.1 Widget Config API 欄 | 明確標示 `status` 值為 `online\|offline\|degraded`；`offline`/`degraded` 及 API 失敗均觸發降級模式；Widget 可見性不受影響 |
| 10 | §8.1 Lead API 欄 | payload 新增 `language?`；補充自動帶入說明 |
| 11 | §9.2 錯誤處理 | 401 處理說明改為「本期後台無登入，暫不處理」，避免與無 auth 決定矛盾 |
| 12 | §9.3 降級模式 | 重寫：列出三種觸發條件（`offline`/`degraded`/API 失敗）；強調 Widget 可見性不受影響；保留後台維護中提示說明 |
| 13 | §9.8 Session 恢復策略 | 新增：本期不提供 end session API；「重新開始對話」為純前端行為（清除 localStorage + 重新呼叫 POST sessions） |
| 14 | §10.2 後台驗收 | 修正管理者驗收項目加入「預設入口 `/admin/dashboard`」；回饋記錄項目移除報表圖表相關描述 |
| 15 | Edge Cases | 移除「後台管理者角色被修改後 403 清除 token」條目（與無 auth 決定矛盾） |
| 16 | FR-006 | 選填欄位新增 `語言偏好（language）`；補充自動帶入語系說明 |
| 17 | Key Entities — Lead | 更新描述：明確列出 `language?` 欄位 |
| 18 | SC-007 | 移除「無權限角色 100% 無法存取」驗收標準（與無 auth 決定矛盾） |
| 19 | Assumptions | `SSE / WebSocket` → `SSE（fetch + ReadableStream）`，移除 WebSocket 提及 |

/**
 * useKnowledgeBaseStore
 *
 * 暫時以 Pinia store 模擬後台知識資料庫。
 * 結構仿照附件 ChatWidget.vue 的 KNOWLEDGE_BASE + DEFAULT_RESPONSE。
 *
 * TODO: 串接後台 API 後，移除此 store，改由 /api/chat/knowledge 取得資料。
 */

export interface KnowledgeEntry {
  keywords: string[]
  response: {
    content: string
    quickReplies?: string[]
  }
}

// ── 假資料：知識庫條目 ─────────────────────────────────────────────────────

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ['你好', '您好', '哈囉', 'hi', 'hello', '嗨', '開始', '幫助', 'help'],
    response: {
      content:
        '您好！歡迎來到智能客服中心 🏭\n\n我們專注於精密工業零件的研發與製造，提供全球客戶高品質的工業解決方案。\n\n請選擇您想了解的問題類別，或直接輸入您的問題：',
      quickReplies: ['產品查詢', '技術支援', '報價與訂購', '公司資訊', '聯絡我們'],
    },
  },
  {
    keywords: ['產品', 'product', '零件', '查詢', '型號', '規格', '目錄', 'catalogue'],
    response: {
      content:
        '**主要產品系列：**\n\n🔩 **精密機械零件**\n高精度CNC加工件、鑄造件、鍛造件\n\n⚙️ **工業傳動元件**\n齒輪、軸承座、聯軸器、皮帶輪\n\n🏗️ **客製化工業配件**\n依客戶圖面/需求量身製造\n\n🌐 **五金沖壓件**\n薄板金屬沖壓成型零件\n\n如需詳細型號規格或產品目錄，請提供您的需求，我們的業務專員將在 24 小時內與您聯繫。',
      quickReplies: ['精密機械零件', '傳動元件', '客製化報價', '下載產品目錄', '聯繫業務'],
    },
  },
  {
    keywords: ['精密', 'cnc', '加工', '鑄造', '鍛造'],
    response: {
      content:
        '**精密機械零件 – 製造能力：**\n\n✅ CNC 車床加工（精度 ±0.005mm）\n✅ CNC 銑床加工（5軸複合加工）\n✅ 精密研磨加工\n✅ 表面處理：陽極氧化、電鍍、噴塗\n\n**可加工材質：**\n鋁合金 · 不鏽鋼 · 碳鋼 · 鈦合金 · 銅合金\n\n**品質認證：** ISO 9001:2015 · IATF 16949\n\n需要樣品或詳細報價，請告知您的零件圖面與數量需求。',
      quickReplies: ['索取報價', '上傳圖面諮詢', '品質認證資訊', '回主選單'],
    },
  },
  {
    keywords: ['傳動', '齒輪', '軸承', '聯軸器', '皮帶輪'],
    response: {
      content:
        '**工業傳動元件 – 產品規格：**\n\n⚙️ **標準齒輪系列**\n正齒輪、斜齒輪、蝸輪蝸桿\nModule: 0.5 – 10 / 材質: S45C、SCM440\n\n🔄 **聯軸器系列**\n剛性聯軸器、撓性聯軸器、膜片聯軸器\n扭矩範圍: 5 Nm – 5,000 Nm\n\n🏷️ **軸承座系列**\n立式、法蘭式、四點式\n軸徑範圍: 20mm – 200mm\n\n提供 OEM/ODM 服務，依客戶需求設計。',
      quickReplies: ['索取報價', '技術規格下載', 'OEM諮詢', '回主選單'],
    },
  },
  {
    keywords: ['報價', '訂購', '訂單', 'price', 'quote', '購買', '採購', '詢價'],
    response: {
      content:
        '**報價與訂購流程：**\n\n📋 **Step 1** 提供需求\n填寫詢價單或提供技術圖面（DWG/PDF/STEP）\n\n💬 **Step 2** 技術確認\n業務工程師評估可行性，通常 1-2 個工作日回覆\n\n💰 **Step 3** 報價書\n提供詳細報價含材料、工法、交期、包裝\n\n✅ **Step 4** 下單確認\n確認訂單後安排生產排程\n\n🚢 **Step 5** 出貨交付\n品質檢驗合格後出貨，提供出貨文件\n\n**最低訂購量 (MOQ)**：依產品而定，歡迎洽詢。',
      quickReplies: ['立即詢價', '聯繫業務專員', '了解交期', '回主選單'],
    },
  },
  {
    keywords: ['技術', 'technical', '支援', 'support', '問題', '故障', '安裝', '維修'],
    response: {
      content:
        '**技術支援服務：**\n\n🛠️ **售前技術支援**\n• 產品選型建議\n• 工程圖面審查\n• 材料與表面處理建議\n\n🔧 **售後技術支援**\n• 安裝指引文件提供\n• 遠端視訊技術諮詢\n• 現場技術服務（台灣地區）\n\n📞 **技術支援時間**\n週一至週五 08:30 – 17:30\n（台灣時間，國定假日除外）\n\n緊急技術問題請直接撥打技術服務專線。',
      quickReplies: ['技術規格文件', '遠端諮詢預約', '緊急技術支援', '回主選單'],
    },
  },
  {
    keywords: ['公司', '關於', 'about', '介紹', '歷史', '資訊'],
    response: {
      content:
        '**關於我們**\n\n🏭 深耕精密工業零件製造領域超過 **30 年**，是亞洲地區知名的精密零件製造商與出口商。\n\n🌐 **全球服務**\n產品出口至歐洲、美洲、日本、東南亞等 **40+ 國家**\n\n🏆 **企業認證**\n• ISO 9001:2015 品質管理\n• IATF 16949 汽車供應鏈\n• SGS 檢驗認證\n\n👥 **團隊規模**\n專業工程與技術人員 500+ 人',
      quickReplies: ['查看產品系列', '下載公司簡介', '聯絡業務', '參觀工廠'],
    },
  },
  {
    keywords: ['認證', 'iso', 'iatf', '品質', 'quality', 'sgs', '檢驗'],
    response: {
      content:
        '**品質認證：**\n\n🏅 **ISO 9001:2015** – 品質管理系統\n\n🚗 **IATF 16949** – 汽車供應鏈品質管理\n\n🔬 **SGS 檢驗認證** – 第三方品質保證\n\n📊 **內部品管設備：**\n• 三次元量測儀 (CMM)\n• 表面粗糙度儀\n• 硬度試驗機\n• X-Ray 螢光分析儀\n\n每批產品出貨均附品質保證書 (COC) 及檢驗報告。',
      quickReplies: ['查看認證文件', '品質檢驗流程', '回主選單'],
    },
  },
  {
    keywords: ['聯絡', '聯繫', 'contact', '電話', '地址', 'email', '信箱', '位置', '在哪'],
    response: {
      content:
        '**聯絡我們：**\n\n📞 **業務電話**\n+886-4-2680-5678\n\n📧 **業務信箱**\nservice@example.com\n\n📍 **公司地址**\n台灣 台中市工業區精密工業路101號\n\n⏰ **服務時間**\n週一至週五 08:30 – 17:30\n週六 08:30 – 12:00',
      quickReplies: ['前往官網', '填寫詢問單', '預約參觀', '回主選單'],
    },
  },
  {
    keywords: ['交期', 'delivery', '出貨', '多久', '時間', 'lead time', '幾天'],
    response: {
      content:
        '**生產交期參考：**\n\n⏱️ **標準零件**\n庫存品：3-5 個工作日\n\n🔧 **客製化加工件**\n• 單件樣品：7-14 個工作日\n• 小批量（< 100 pcs）：14-21 個工作日\n• 批量生產：21-35 個工作日\n\n🚀 **急件服務**\n可申請加急處理，另計加急費用',
      quickReplies: ['急件詢問', '物流追蹤', '索取報價', '回主選單'],
    },
  },
  {
    keywords: ['目錄', 'catalogue', '下載', 'download', '簡介', 'brochure', '資料'],
    response: {
      content:
        '**下載資料中心：**\n\n📥 我們提供以下資料供您參考：\n\n📗 公司簡介（中文版）\n📘 公司簡介（English Version）\n📋 產品總目錄 2024\n🔩 精密零件系列型錄\n⚙️ 傳動元件系列型錄\n\n請前往官網下載中心或留下您的 Email，我們將以電子郵件寄送相關資料：',
      quickReplies: ['前往官網下載', 'Email索取資料', '聯繫業務', '回主選單'],
    },
  },
  {
    keywords: ['oem', 'odm', '客製', 'customize', '訂製', '圖面', '設計'],
    response: {
      content:
        '**OEM / ODM 客製化服務：**\n\n🎯 **OEM（依圖製造）**\n客戶提供：2D圖面 / 3D模型 / 實品樣本\n我們提供：可行性評估 → 試製樣品 → 量產\n\n💡 **ODM（依需求設計）**\n客戶提供：功能需求 / 應用場景\n我們提供：設計建議 → 工程圖面 → 製造\n\n🔑 **客製化流程：**\n1️⃣ 需求溝通\n2️⃣ NDA 簽署（保密協議）\n3️⃣ 技術評估與報價\n4️⃣ 樣品確認\n5️⃣ 量產交付',
      quickReplies: ['上傳圖面諮詢', '簽署NDA說明', '索取樣品', '回主選單'],
    },
  },
  {
    keywords: ['真人', '人工', '業務', '專員', 'agent', '轉接'],
    response: {
      content:
        '**轉接業務專員：**\n\n正在為您安排業務專員服務 👨‍💼\n\n**直接聯絡方式：**\n\n📞 業務熱線：+886-4-2680-5678\n📧 Email：service@example.com\n\n🕐 **服務時間**\n週一至週五 08:30 – 17:30（台灣時間）\n\n目前服務時間內，業務專員通常可在 30 分鐘內回覆您的需求。',
      quickReplies: ['前往官網', '回主選單'],
    },
  },
  {
    keywords: ['回主選單', '主選單', '回首頁', '返回'],
    response: {
      content: '請選擇您想了解的問題類別，或直接輸入您的問題：',
      quickReplies: ['產品查詢', '技術支援', '報價與訂購', '公司資訊', '聯絡我們'],
    },
  },
]

// ── 假資料：預設回覆（無匹配時） ──────────────────────────────────────────

const DEFAULT_RESPONSE = {
  content:
    '感謝您的提問！我已記錄您的問題，由於這個問題需要更專業的回答，建議您：\n\n📧 發送 Email 至 service@example.com\n📞 撥打業務熱線 +886-4-2680-5678\n\n或者，您可以從以下常見問題中找到答案：',
  quickReplies: ['產品查詢', '報價與訂購', '技術支援', '聯絡我們'],
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useKnowledgeBaseStore = defineStore('knowledgeBase', () => {
  /**
   * 根據使用者輸入文字，從知識庫中找出第一個關鍵字匹配的條目。
   * 若無匹配則回傳 DEFAULT_RESPONSE。
   *
   * TODO: 串接 API 後，以 POST /api/chat/query 取代此邏輯。
   */
  function query(input: string): { content: string; quickReplies?: string[] } {
    const text = input.toLowerCase()
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        return entry.response
      }
    }
    return DEFAULT_RESPONSE
  }

  /** 取得預設歡迎訊息的 quickReplies（用於 session 初始化）。 */
  function getWelcomeQuickReplies(): string[] {
    return ['產品查詢', '技術支援', '報價與訂購', '公司資訊', '聯絡我們']
  }

  return {
    query,
    getWelcomeQuickReplies,
  }
})

<script setup lang="ts">
/**
 * ChatWidget
 *
 * 聊天 Widget 根元件，fixed bottom-right。
 * 控制 Launcher（FAB）↔ Panel 的切換，並負責整合所有 composables 初始化。
 *
 * Launcher 邏輯直接內嵌（原 ChatLauncher.vue 已合併）
 */

import ChatPanel from './ChatPanel.vue';

const { isOpen } = storeToRefs(useChatWidgetStore());
const { setOpen } = useChatWidgetStore();

// ── Composable 整合 ───────────────────────────────────────────────────────
const { initSession, restartSession } = useChatSession();
const { sendMessage, cancelStream, retryLastMessage, rateMessage, messages } = useChat();

// Widget Config 在 isOpen 時自動 fetch（useWidgetConfig 內部 watch isOpen）
useWidgetConfig();

// 第一次展開時初始化 session；同時處理 mobile body scroll lock
let _sessionInitialised = false;
watch(
  isOpen,
  async (open) => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : '';
    }
    if (open && !_sessionInitialised) {
      _sessionInitialised = true;
      await initSession();
    }
  },
);

onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = '';
});

// ── 事件 handlers ─────────────────────────────────────────────────────────
async function handleSend(text: string) {
  await sendMessage(text);
}
async function handleCancel() {
  await cancelStream();
}
async function handleRetry(_messageId: string) {
  await retryLastMessage();
}
async function handleReset() {
  _sessionInitialised = false;
  await restartSession();
}
function handleRate(messageId: string, value: import('~/types/chat').FeedbackValue) {
  rateMessage(messageId, value);
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[9999]" aria-label="AI 客服聊天">
    <!-- Launcher（FAB）：panel 收合時顯示 -->
    <div v-if="!isOpen" class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <!-- Tooltip hint -->
      <div
        class="bg-white rounded-xl shadow-xl px-4 py-2.5 flex items-center gap-2 cursor-pointer hover:shadow-2xl transition-all"
        @click="setOpen(true)"
      >
        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span class="text-sm text-gray-700 whitespace-nowrap">AI 客服在線，立即諮詢</span>
        <UIcon name="fluent:chevron-right-24-regular" class="text-gray-400" size="14" />
      </div>
      <!-- Launch button -->
      <UButton
        data-testid="chat-launcher"
        class="w-14 h-14 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-400 text-white"
        @click="setOpen(true)"
      >
        <UIcon name="fluent:chat-24-regular" size="24" />
      </UButton>
    </div>

    <!-- Panel：展開時顯示 -->
    <ChatPanel
      v-else
      :messages
      @send="handleSend"
      @cancel="handleCancel"
      @quick-reply="handleSend"
      @retry="handleRetry"
      @rate="handleRate"
      @reset="handleReset"
    />
  </div>
</template>

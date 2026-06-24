<script setup lang="ts">
import type { LocaleKey } from '~/types/chat';
import type { WidgetSettingsVM } from '~/types/admin';

const props = defineProps<{
  settings: WidgetSettingsVM | null;
}>();

const localeItems: { label: string; value: LocaleKey }[] = [
  { label: '繁中', value: 'zh-TW' },
  { label: 'English', value: 'en' },
];
const locale = ref<LocaleKey>('zh-TW');

function text(value?: Partial<Record<LocaleKey, string>>) {
  return value?.[locale.value] || value?.['zh-TW'] || value?.en || '';
}

const quickReplies = computed(() => props.settings?.quickReplies?.[locale.value] ?? []);
const statusLabel = computed(() => {
  if (props.settings?.status === 'offline') return '離線';
  if (props.settings?.status === 'degraded') return '降級';
  return '線上';
});
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-gray-700">即時預覽</p>
        <USelect v-model="locale" :items="localeItems" value-key="value" class="w-32" />
      </div>
    </template>

    <div class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="bg-gradient-to-r from-primary-800 to-primary-600 p-4 text-white">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">{{ text(settings?.ctaText) || 'AI 客服' }}</p>
            <p class="mt-1 text-xs text-primary-50">{{ statusLabel }}</p>
          </div>
          <div
            class="rounded-full"
            :class="settings?.status === 'online' ? 'bg-emerald-300' : 'bg-gray-300'"
          />
        </div>
      </div>

      <div class="space-y-4 p-4">
        <div class="rounded-xl bg-gray-50 p-3">
          <p class="text-sm text-gray-700">
            {{ text(settings?.welcomeMessage) || '您好，請問需要什麼協助？' }}
          </p>
        </div>

        <UAlert
          v-if="settings?.status !== 'online'"
          color="warning"
          variant="soft"
          :description="text(settings?.fallbackMessage) || '目前服務暫時不可用，請稍後再試。'"
        />

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="reply in quickReplies"
            :key="reply"
            size="sm"
            variant="outline"
            class="rounded-full"
          >
            {{ reply }}
          </UButton>
        </div>

        <p class="border-t border-gray-100 pt-3 text-xs text-gray-400">
          {{ text(settings?.disclaimer) || 'AI 回覆僅供參考。' }}
        </p>
      </div>
    </div>
  </UCard>
</template>

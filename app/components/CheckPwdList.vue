<script setup lang="ts">
const password = defineModel();

const { pwdRegExpItems } = usePwdField(password);
</script>

<template>
  <div>
    <p class="text-sm font-medium mb-2">{{ $t('form.pwdShouldBe') }}</p>

    <ul class="space-y-1" aria-label="Password requirements">
      <li
        v-for="(item, index) in pwdRegExpItems"
        :key="index"
        class="flex items-center gap-1"
        :class="item.isChecked ? 'text-teal-500' : 'text-muted'"
      >
        <UIcon
          :name="item.isChecked ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
          class="size-4"
        />

        <span class="text-sm">
          {{ item.name }}
          <span class="sr-only">
            {{ item.isChecked ? ' - Requirement met' : ' - Requirement not met' }}
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>

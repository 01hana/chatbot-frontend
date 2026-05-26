<script setup lang="ts">
import { useAdminStatus } from '~/features/admin/composables/useAdminStatus'

const { getAdminStatusColor, getAdminStatusLabel } = useAdminStatus()

const props = defineProps<{
  status: string
}>()
</script>

<template>
  <UBadge :color="getAdminStatusColor(props.status)" variant="subtle" size="lg">
    {{ getAdminStatusLabel(props.status) }}
  </UBadge>
</template>

<script setup lang="ts">
// T-010 — 後台 layout 骨架
// 左側固定導覽 240px + 右側 flex-1 主內容區
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- 左側導覽列 (AdminSidebar 占位) -->
    <aside class="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200">
      <!-- Logo / brand area -->
      <div class="h-14 flex items-center px-5 border-b border-gray-200">
        <span class="font-semibold text-gray-800 text-sm">震南 Admin</span>
      </div>
      <!-- Nav placeholder — will be replaced by AdminSidebar in T-049 -->
      <nav class="flex-1 p-3 space-y-1 text-sm text-gray-500">
        <div class="px-3 py-2 rounded-lg bg-gray-100 text-gray-400 cursor-default">
          導覽列（T-049 實作）
        </div>
      </nav>
    </aside>

    <!-- 右側主內容區 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Topbar (AdminTopbar 占位) -->
      <header class="h-14 shrink-0 flex items-center px-6 bg-white border-b border-gray-200">
        <!-- Topbar placeholder — will be replaced by AdminTopbar in T-049 -->
        <span class="text-sm text-gray-400">頂部導覽列（T-049 實作）</span>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

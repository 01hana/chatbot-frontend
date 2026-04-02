export interface AdminNavItem {
  label: string;
  title: string;
  subtitle: string;
  icon: string;
  to: string;
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: '儀表板數據',
    title: '儀表板數據',
    subtitle: 'AI 智能客服即時統計概覽',
    icon: 'fluent:board-20-regular',
    to: '/admin/dashboard',
  },
  {
    label: '會話管理',
    title: '會話管理',
    subtitle: '查看並處理所有客服對話紀錄',
    icon: 'fluent:chat-multiple-24-regular',
    to: '/admin/conversations',
  },
];

export function useAdminNav() {
  const route = useRoute();

  const currentNav = computed<AdminNavItem | undefined>(() =>
    adminNavItems.find(item => route.path.startsWith(item.to)),
  );

  const pageTitle = computed(() => currentNav.value?.title ?? '後台管理');
  const pageSubtitle = computed(() => currentNav.value?.subtitle ?? '');

  return { adminNavItems, currentNav, pageTitle, pageSubtitle };
}

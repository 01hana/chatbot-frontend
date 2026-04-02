export default defineNuxtRouteMiddleware(async to => {
  const { getUser, setLoginState } = useAuth();
  const { user, isLoginState } = storeToRefs(useAuth());

  const { getItem } = useStorage();

  const isEnterAuthRoute = to.meta.resource === 'auth';

  const accessToken = getItem('accessToken');

  const authPages = ['/member', '/cart'];

  const requiresAuth = authPages.some(page => to.path.includes(page));

  // if (accessToken) {
  //   if (!isLoginState.value) {
  //     await getUser().catch(error => {
  //       if (error) {
  //         const { clearAuth } = useAuth();

  //         clearAuth();
  //       }
  //     });
  //   }
  // }

  /**
   * 登入後重設登入狀態
   */
  // if (requiresAuth && isLoginState.value && !isEnterAuthRoute) setLoginState(false);

  if (requiresAuth && !accessToken) {
    return navigateTo('/admin/auth/login');
  }

  // if (to.path.includes('/auth/reset') && !to.query.token) {
  //   return navigateTo('/auth/login');
  // }

  // if (!requiresAuth && accessToken) {
  //   return navigateTo('/');
  // }
});

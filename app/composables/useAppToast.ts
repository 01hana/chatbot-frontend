type ToastType = 'success' | 'info' | 'warning' | 'error';

export function useAppToast() {
  const toast = useToast();

  const show = (type: ToastType, title?: string, message?: string) => {
    const base = {
      title: title || type.toUpperCase(),
      description: message,
      color: type,
      duration: 3000,
      progress: false,
    };

    switch (type) {
      case 'success':
        toast.add({
          ...base,
          icon: 'i-heroicons-check-circle',
        });
        break;
      case 'info':
        toast.add({
          ...base,
          icon: 'i-heroicons-information-circle',
        });
        break;
      case 'warning':
        toast.add({
          ...base,
          icon: 'i-heroicons-exclamation-triangle',
        });
        break;
      case 'error':
        toast.add({ ...base, icon: 'i-heroicons-x-circle' });
        break;
    }
  };

  return {
    success: (title?: string, msg?: string) => show('success', title, msg),
    info: (title?: string, msg?: string) => show('info', title, msg),
    warning: (title?: string, msg?: string) => show('warning', title, msg),
    error: (title?: string, msg?: string) => show('error', title, msg),
  };
}

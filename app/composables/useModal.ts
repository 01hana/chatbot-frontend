import type { Ref, ComputedRef } from 'vue';

export interface ModalProps {
  id: Ref<string | undefined>;
  type: Ref<'ADD' | 'EDIT' | undefined>;
  show: Ref<boolean>;
  title: Ref<string>;
  subtitle: Ref<string>;
  loading: Ref<boolean>;
  spinner: Ref<boolean>;
  setTitle: (title: string, subtitle?: string) => void;
  afterEnter: () => void;
  afterLeave: () => void;
  setModal: (statusOrId: boolean | string | number, isView?: boolean | undefined) => void;
  setLoading: (state: boolean) => void;
  setSpinner: (state: boolean) => void;
  isShown: ComputedRef<boolean>;
  isView: ComputedRef<boolean>;
  isAdd: ComputedRef<boolean>;
  isEdit: ComputedRef<boolean>;
}

export const useModalKey = Symbol('useModal') as InjectionKey<ModalProps>;

export function useModal(): ModalProps {
  const [loading, setLoading] = useAppState(false);
  const [spinner, setSpinner] = useAppState(false);

  const { t } = useI18n();
  const route = useRoute();

  const id = ref();
  const type = ref();
  const show = ref(false);
  const title = ref('');
  const subtitle = ref('');

  const _shown = shallowRef(false);

  const isShown = computed(() => _shown.value);
  const isView = computed(() => type.value === 'VIEW');
  const isAdd = computed(() => type.value === 'ADD');
  const isEdit = computed(() => type.value === 'EDIT');

  function setTitle(modalTitle?: string, modalSubtitle?: string) {
    title.value = modalTitle ?? t(`menu.${String(route.name)}`);
    subtitle.value = modalSubtitle ?? '';
  }

  function afterEnter() {
    _shown.value = true;
  }

  function afterLeave() {
    _shown.value = false;

    id.value = undefined;
    type.value = undefined;

    setLoading(false);
    setSpinner(false);
  }

  function setModal(statusOrId: boolean | string | number, isView?: boolean | undefined) {
    setTitle();

    if (typeof statusOrId === 'boolean') {
      if (!statusOrId) {
        show.value = false;

        return;
      }

      id.value = undefined;
      type.value = 'ADD';
      subtitle.value = t('actions.create');
      show.value = true;

      return;
    }

    id.value = statusOrId;

    type.value = !isView ? 'EDIT' : 'VIEW';
    subtitle.value = !isView ? t('actions.edit') : t('actions.view');
    show.value = true;
  }

  return {
    id,
    type,
    show,
    title,
    subtitle,
    loading,
    spinner,
    isShown,
    isView,
    isAdd,
    isEdit,

    afterEnter,
    afterLeave,
    setModal,
    setTitle,
    setLoading,
    setSpinner,
  };
}

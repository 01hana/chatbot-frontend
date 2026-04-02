export const useUiMode = () => {
  const liquid = useState<boolean>('liquid-mode', () => false);

  const toggleLiquid = () => {
    liquid.value = !liquid.value;
  };

  return { liquid, toggleLiquid };
};

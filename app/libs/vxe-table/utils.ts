export const getLocalePackage = (value?: string): Promise<any> => {
  const locale: string = value ?? 'zh-TW';

  const packageConfigurations: { [key: string]: () => Promise<any> } = {
    en: () => import('vxe-pc-ui/lib/language/en-US'),
    'zh-TW': () => import('vxe-pc-ui/lib/language/zh-TW'),
  };

  const isPackageExist: boolean = Object.prototype.hasOwnProperty.call(
    packageConfigurations,
    locale,
  );

  if (isPackageExist) return packageConfigurations[locale]!();

  return packageConfigurations['zh-TW']!();
};

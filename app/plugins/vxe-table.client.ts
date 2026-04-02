import type { VxeGlobalI18nLocale } from 'vxe-table';

import VxeTable from 'vxe-table';
import VxeUI from 'vxe-pc-ui';

// import ExcelJS from 'exceljs';
// import VXETablePluginExportXLSX from 'vxe-table-plugin-export-xlsx';

import 'vxe-table/lib/style.css';
import 'vxe-pc-ui/lib/style.css';

import { tableConfig, iconConfig } from '../libs/vxe-table/config';
import { getLocalePackage } from '../libs/vxe-table/utils';

export default defineNuxtPlugin(async ({ vueApp }) => {
  vueApp.use(VxeTable);
  vueApp.use(VxeUI);

  VxeTable.formats.add('formatDate', {
    cellFormatMethod({ cellValue }) {
      if (!cellValue) return '';

      const { formatDate } = useFormat();

      return formatDate(cellValue);
    },
  });

  const nuxtApp = useNuxtApp();
  const locale = nuxtApp.$i18n.locale.value;

  const localeMap: { [key: string]: VxeGlobalI18nLocale } = {
    en: 'en-US',
    'zh-TW': 'zh-TW',
  };

  const loadVxeLocale = async (lang: string) => {
    const { default: message } = await getLocalePackage(lang);
    const vxeLang = localeMap[lang] ?? 'zh-TW';

    VxeUI.setI18n(vxeLang, message);
    VxeUI.setLanguage(vxeLang);
  };

  await loadVxeLocale(locale);

  watch(nuxtApp.$i18n.locale, async newLocale => {
    await loadVxeLocale(newLocale);
  });

  VxeUI.setConfig(tableConfig);
  VxeUI.setIcon(iconConfig);
  //   VxeUI.use(VXETablePluginExportXLSX, {
  //     ExcelJS,
  //   });
});

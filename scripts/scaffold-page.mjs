import fs from 'fs';
import path from 'path';

const __dirname = process.cwd(); // 根目錄
const templatesDir = path.resolve(__dirname, 'scripts/templates');
const pagesDir = path.resolve(__dirname, 'app/pages');
const storesDir = path.resolve(__dirname, 'app/stores');
const servicesDir = path.resolve(__dirname, 'app/services/api');

function pascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createPageScaffold(entity) {
  const hookName = 'use' + pascalCase(entity);
  const PascalEntity = pascalCase(entity);

  // --- Pages ---
  const pageTargetDir = path.join(pagesDir, entity);
  if (!fs.existsSync(pageTargetDir)) fs.mkdirSync(pageTargetDir, { recursive: true });

  const pageFiles = ['index.vue', 'DtHeader.vue', 'DtTable.vue', 'FormModal.vue'];
  pageFiles.forEach(file => {
    const template = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
    const replaced = template
      .replace(/__HOOK__/g, hookName) // e.g. useProducts
      .replace(/__ENTITY__/g, entity) // e.g. products
      .replace(/__ENTITY__Fields/g, `${entity}Fields`);
    fs.writeFileSync(path.join(pageTargetDir, file), replaced, 'utf-8'); // e.g. productsFields
  });

  // --- Store ---
  const storeTemplate = fs.readFileSync(path.join(templatesDir, 'store.ts'), 'utf-8');
  const storeReplaced = storeTemplate
    .replace(/__PascalEntity__/g, PascalEntity)
    .replace(/__ENTITY__/g, entity);
  fs.writeFileSync(path.join(storesDir, `${entity}.ts`), storeReplaced, 'utf-8');

  // --- Service ---
  const serviceTemplate = fs.readFileSync(path.join(templatesDir, 'service.ts'), 'utf-8');
  const serviceReplaced = serviceTemplate
    .replace(/__PascalEntity__/g, PascalEntity)
    .replace(/__ENTITY__/g, entity);
  fs.writeFileSync(path.join(servicesDir, `${entity}.ts`), serviceReplaced, 'utf-8');

  console.log(`✅ Scaffold created for ${entity}`);
}

const entity = process.argv[2];
if (!entity) {
  console.error('❌ 請輸入資料夾名稱，例如: npm run scaffold products');
  process.exit(1);
}

createPageScaffold(entity);

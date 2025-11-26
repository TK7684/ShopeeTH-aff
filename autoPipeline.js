import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToGoogleSheet } from './googleSheets.js';
import { loadEnv } from './env.js';
import { resolveProjectPath } from './paths.js';
import {
  getCategoryNameList,
  getMainCategoryId,
  getMainCategorySheetTitle,
} from './categoryNames.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv();

let cronModule = null;

async function getCronModule() {
  if (cronModule) {
    return cronModule;
  }
  try {
    const imported = await import('node-cron');
    cronModule = imported.default ?? imported;
    return cronModule;
  } catch (error) {
    throw new Error(
      'node-cron is required to use the scheduler. Please run "npm install" to install project dependencies.',
    );
  }
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1l3PESURRNXpZDTxQbZYM2KxpdPvWcZdnGVKQC_jKtFo';
const SHEET_RANGE = process.env.GOOGLE_SHEETS_RANGE || 'DailyTop!A1';
const CATEGORY_RANGE = process.env.GOOGLE_SHEETS_CATEGORY_RANGE || 'CategoryTop!A1';
const MIN_RATE = process.env.PIPELINE_MIN_RATE || '10';
const MIN_COMMISSION = process.env.PIPELINE_MIN_COMMISSION || '60';
const TOP = process.env.PIPELINE_TOP || '100';
const LIMIT = process.env.PIPELINE_LIMIT || '50';
const MAX_PAGES = process.env.PIPELINE_MAX_PAGES || '10';
const TIMEZONE = process.env.PIPELINE_TIMEZONE || 'Asia/Bangkok';
const HISTORY_LIMIT = parseInt(process.env.PIPELINE_HISTORY_LIMIT || '1000', 10);
const CATEGORY_TOP_LIMIT = parseInt(process.env.PIPELINE_CATEGORY_TOP_LIMIT || '5', 10);
const CATEGORY_TAB_LIMIT = parseInt(process.env.PIPELINE_CATEGORY_TAB_LIMIT || '20', 10);

function runCommand(command, args, label) {
  console.log(`\n⏳ Running ${label}...`);
  const result = spawnSync(command, args, {
    cwd: __dirname,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function buildSheetRows(products) {
  const timestamp = new Date().toISOString();
  const header = [
    'Run Timestamp',
    'Product Name',
    'Commission Rate (%)',
    'Seller Commission (%)',
    'Shopee Commission (%)',
    'Commission (THB)',
    'Price (THB)',
    'Price Min',
    'Price Max',
    'Sales',
    'Rating',
    'Shop Name',
    'Product Link',
    'Categories (ชื่อหมวดหมู่)',
  ];

  const rows = [header];

  products.forEach((product) => {
    const categoriesText = getCategoryNameList(product.categoryIds).join(', ');

    rows.push([
      timestamp,
      product.name,
      ((product.commissionRate || 0) * 100).toFixed(2),
      ((product.sellerCommissionRate || 0) * 100).toFixed(2),
      ((product.shopeeCommissionRate || 0) * 100).toFixed(2),
      product.commission || 0,
      product.price || 0,
      product.priceMin || 0,
      product.priceMax || 0,
      product.sales || 0,
      product.ratingStar || 0,
      product.shopName || '',
      product.productLink || '',
      categoriesText,
    ]);
  });

  return rows;
}

function buildCategoryRows(products, topLimit) {
  const resolvedLimit = Number.isFinite(topLimit) && topLimit > 0 ? topLimit : 1;
  const header = [
    'Category ID',
    'Rank',
    'Product Name',
    'Commission Rate (%)',
    'Commission (THB)',
    'Price (THB)',
    'Sales',
    'Rating',
    'Product Link',
  ];

  const map = new Map();
  products.forEach((product) => {
    const categories = Array.isArray(product.categoryIds) ? product.categoryIds : [];
    categories.forEach((categoryId) => {
      if (categoryId === undefined || categoryId === null || categoryId === '') {
        return;
      }
      const key = String(categoryId);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(product);
    });
  });

  const rows = [header];
  const sortedCategories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

  sortedCategories.forEach(([categoryId, categoryProducts]) => {
    const sortedProducts = [...categoryProducts].sort(
      (a, b) => (b.commissionRate || 0) - (a.commissionRate || 0),
    );
    const topProducts = sortedProducts.slice(0, resolvedLimit);
    topProducts.forEach((product, index) => {
      rows.push([
        categoryId,
        index + 1,
        product.name,
        ((product.commissionRate || 0) * 100).toFixed(2),
        product.commission || 0,
        product.price || 0,
        product.sales || 0,
        product.ratingStar || 0,
        product.productLink || '',
      ]);
    });
  });

  return rows;
}

function buildCategoryTabs(products, topLimit) {
  const resolvedLimit = Number.isFinite(topLimit) && topLimit > 0 ? topLimit : 20;
  const header = [
    'Rank',
    'Product Name',
    'Commission Rate (%)',
    'Commission (THB)',
    'Price (THB)',
    'Sales',
    'Rating',
    'Shop Name',
    'Product Link',
  ];

  const map = new Map();
  products.forEach((product) => {
    const mainId = getMainCategoryId(product.categoryIds);
    if (!mainId) return;
    const key = String(mainId);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(product);
  });

  const tabs = [];
  const sortedCategories = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

  sortedCategories.forEach(([categoryId, categoryProducts]) => {
    const sortedProducts = [...categoryProducts].sort(
      (a, b) => (b.commissionRate || 0) - (a.commissionRate || 0),
    );
    const topProducts = sortedProducts.slice(0, resolvedLimit);

    const rows = [header];
    topProducts.forEach((product, index) => {
      rows.push([
        index + 1,
        product.name,
        ((product.commissionRate || 0) * 100).toFixed(2),
        product.commission || 0,
        product.price || 0,
        product.sales || 0,
        product.ratingStar || 0,
        product.shopName || '',
        product.productLink || '',
      ]);
    });

    const sheetTitle = getMainCategorySheetTitle(categoryId);
    tabs.push({
      sheetTitle,
      range: `${sheetTitle}!A1`,
      values: rows,
    });
  });

  return tabs;
}

async function runPipeline() {
  console.log('\n==============================');
  console.log(`🚀 Starting pipeline @ ${new Date().toLocaleString()}`);
  console.log('==============================\n');

  runCommand('node', ['fetchProducts.js', `--limit=${LIMIT}`, `--max-pages=${MAX_PAGES}`], 'fetchProducts');
  runCommand(
    'node',
    [
      'analyzeProducts.js',
      `--min-rate=${MIN_RATE}`,
      `--min-commission=${MIN_COMMISSION}`,
      `--top=${TOP}`,
      '--input=products.json',
      '--output=filtered_products.json',
    ],
    'analyzeProducts',
  );

  const filteredPath = resolveProjectPath('filtered_products.json');
  if (!fs.existsSync(filteredPath)) {
    throw new Error('filtered_products.json not found. Did analyzeProducts run successfully?');
  }

  const products = JSON.parse(fs.readFileSync(filteredPath, 'utf8'));
  if (!Array.isArray(products) || products.length === 0) {
    console.warn('⚠️ No products available to upload.');
    return;
  }

  const rows = buildSheetRows(products);
  const categoryRows = buildCategoryRows(products, CATEGORY_TOP_LIMIT);
  const categoryTabs = buildCategoryTabs(products, CATEGORY_TAB_LIMIT);
  await uploadToGoogleSheet({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    values: rows,
    historyLimit: HISTORY_LIMIT,
    categoryRange: CATEGORY_RANGE,
    categoryValues: categoryRows,
    categoryTabs,
  });

  console.log(`\n✅ Uploaded ${products.length} rows to Google Sheet ${SHEET_ID} (${SHEET_RANGE}).`);
}

async function startScheduler() {
  const cron = await getCronModule();
  console.log(`🕛 Scheduler active. Next run at midnight (${TIMEZONE}).`);
  cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        await runPipeline();
      } catch (error) {
        console.error('❌ Pipeline failed:', error);
      }
    },
    {
      timezone: TIMEZONE,
    },
  );
}

if (process.argv.includes('--once')) {
  runPipeline().catch((error) => {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  });
} else {
  startScheduler().catch((error) => {
    console.error('❌ Failed to start scheduler:', error);
    process.exit(1);
  });
}


import { fetchAllPages } from '../fetchProducts.js';
import { filterProducts } from '../analyzeProducts.js';
import { uploadToGoogleSheet } from '../googleSheets.js';
import { getCategoryNameList, getMainCategoryId, getMainCategorySheetTitle } from '../categoryNames.js';

// Configuration from Environment Variables
const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEETS_RANGE || 'DailyTop!A1';
const CATEGORY_RANGE = process.env.GOOGLE_SHEETS_CATEGORY_RANGE || 'CategoryTop!A1';
const MIN_RATE = parseFloat(process.env.PIPELINE_MIN_RATE || '10');
const MIN_COMMISSION = parseFloat(process.env.PIPELINE_MIN_COMMISSION || '60');
const TOP = parseInt(process.env.PIPELINE_TOP || '100', 10);
const LIMIT = parseInt(process.env.PIPELINE_LIMIT || '50', 10);
const MAX_PAGES = parseInt(process.env.PIPELINE_MAX_PAGES || '5', 10); // Lower default for Vercel
const HISTORY_LIMIT = parseInt(process.env.PIPELINE_HISTORY_LIMIT || '1000', 10);
const CATEGORY_TOP_LIMIT = parseInt(process.env.PIPELINE_CATEGORY_TOP_LIMIT || '5', 10);
const CATEGORY_TAB_LIMIT = parseInt(process.env.PIPELINE_CATEGORY_TAB_LIMIT || '20', 10);

// Helper functions (copied from autoPipeline.js as we can't easily import from root without type: module issues in some Vercel setups, but here we are ESM so importing should work if paths are correct)
// Actually, we can just duplicate the build logic or export it from autoPipeline.js. 
// Refactoring autoPipeline.js is cleaner but let's keep this self-contained for now to avoid breaking local setup.

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

export default async function handler(req, res) {
    // Verify Cron Secret (optional but recommended)
    // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return res.status(401).end('Unauthorized');
    // }

    try {
        console.log('🚀 Starting Vercel Cron Job...');

        // 1. Fetch Products
        // Note: We override limit and maxPages for Vercel execution to avoid timeouts
        // You might need to adjust MAX_PAGES in env vars if it times out
        const products = await fetchAllPages(null); // null = all categories

        if (!products || products.length === 0) {
            console.log('⚠️ No products fetched.');
            return res.status(200).json({ message: 'No products fetched', count: 0 });
        }

        // 2. Analyze & Filter
        const filteredProducts = filterProducts(products, {
            minCommissionRate: MIN_RATE,
            minCommission: MIN_COMMISSION,
            topN: TOP
        });

        if (filteredProducts.length === 0) {
            console.log('⚠️ No products matched filters.');
            return res.status(200).json({ message: 'No products matched filters', count: 0 });
        }

        // 3. Upload to Google Sheets
        const rows = buildSheetRows(filteredProducts);
        const categoryRows = buildCategoryRows(filteredProducts, CATEGORY_TOP_LIMIT);
        const categoryTabs = buildCategoryTabs(filteredProducts, CATEGORY_TAB_LIMIT);

        await uploadToGoogleSheet({
            spreadsheetId: SHEET_ID,
            range: SHEET_RANGE,
            values: rows,
            historyLimit: HISTORY_LIMIT,
            categoryRange: CATEGORY_RANGE,
            categoryValues: categoryRows,
            categoryTabs,
        });

        console.log(`✅ Successfully processed ${filteredProducts.length} products.`);
        res.status(200).json({
            message: 'Success',
            fetched: products.length,
            filtered: filteredProducts.length
        });

    } catch (error) {
        console.error('❌ Cron Job Failed:', error);
        res.status(500).json({ error: error.message });
    }
}

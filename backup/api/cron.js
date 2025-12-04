import { fetchAllPages } from '../fetchProducts.js';
import { filterProducts } from '../analyzeProducts.js';
import { uploadToGoogleSheet } from '../googleSheets.js';
import {
  buildSheetRows,
  buildCategoryRows,
  buildCategoryTabs,
} from '../sheetBuilders.js';

// Configuration from Environment Variables
const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1l3PESURRNXpZDTxQbZYM2KxpdPvWcZdnGVKQC_jKtFo';
const SHEET_RANGE = process.env.GOOGLE_SHEETS_RANGE || 'DailyTop!A1';
const CATEGORY_RANGE = process.env.GOOGLE_SHEETS_CATEGORY_RANGE || 'CategoryTop!A1';
const MIN_RATE = parseFloat(process.env.PIPELINE_MIN_RATE || '10');
const MIN_COMMISSION = parseFloat(process.env.PIPELINE_MIN_COMMISSION || '60');
const TOP = parseInt(process.env.PIPELINE_TOP || '100', 10);
const HISTORY_LIMIT = parseInt(process.env.PIPELINE_HISTORY_LIMIT || '1000', 10);
const CATEGORY_TOP_LIMIT = parseInt(process.env.PIPELINE_CATEGORY_TOP_LIMIT || '5', 10);
const CATEGORY_TAB_LIMIT = parseInt(process.env.PIPELINE_CATEGORY_TAB_LIMIT || '20', 10);

export default async function handler(req, res) {
  console.log('=== CRON JOB STARTED ===');

  // Verify cron secret if needed (Vercel automatically protects cron jobs, but good practice)
  // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  try {
    // 1. Fetch Products (In-memory, no file save)
    console.log('Fetching products...');
    const products = await fetchAllPages(null, { saveToFile: false });
    console.log(`Fetched ${products.length} products.`);

    if (products.length === 0) {
      console.log('No products fetched. Aborting.');
      return res.status(200).json({ message: 'No products fetched', count: 0 });
    }

    // 2. Analyze/Filter Products
    console.log('Analyzing products...');
    const filteredProducts = filterProducts(products, {
      minCommissionRate: MIN_RATE,
      minCommission: MIN_COMMISSION,
      topN: TOP
    });
    console.log(`Filtered to ${filteredProducts.length} top products.`);

    if (filteredProducts.length === 0) {
      console.log('No products matched filters. Aborting upload.');
      return res.status(200).json({ message: 'No products matched filters', count: 0 });
    }

    // 3. Upload to Google Sheets
    console.log('Uploading to Google Sheets...');
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

    console.log('Upload complete.');
    console.log('=== CRON JOB COMPLETED SUCCESSFULLY ===');

    res.status(200).json({
      message: 'Pipeline executed successfully',
      fetched: products.length,
      filtered: filteredProducts.length,
      uploaded: true
    });
  } catch (error) {
    console.error('CRON JOB FAILED:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}

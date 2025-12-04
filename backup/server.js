import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchAllPages } from './fetchProducts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the HTML interface
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// API endpoint to get products
app.get('/api/products', (req, res) => {
  try {
    const inputFile = req.query.file || 'products.json';
    const filePath = join(__dirname, inputFile);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Products file not found. Please run "npm run fetch" first.' });
    }

    const products = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to filter products
app.post('/api/filter', (req, res) => {
  try {
    const {
      inputFile = 'products.json',
      minCommissionRate = 0,
      maxCommissionRate = 100,
      minPrice = 0,
      maxPrice = Infinity,
      minSellerRate = 0,
      minShopeeRate = 0,
      sortBy = 'commissionRate',
      sortOrder = 'desc',
      limit = 100
    } = req.body;

    const filePath = join(__dirname, inputFile);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Products file not found.' });
    }

    let products = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Filter products
    products = products.filter(p => {
      const commissionRate = (p.commissionRate || 0) * 100;
      const sellerRate = (p.sellerCommissionRate || 0) * 100;
      const shopeeRate = (p.shopeeCommissionRate || 0) * 100;
      const price = p.price || 0;

      return commissionRate >= minCommissionRate &&
        commissionRate <= maxCommissionRate &&
        sellerRate >= minSellerRate &&
        shopeeRate >= minShopeeRate &&
        price >= minPrice &&
        price <= maxPrice;
    });

    // Sort products
    products.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'commissionRate':
          aVal = (a.commissionRate || 0) * 100;
          bVal = (b.commissionRate || 0) * 100;
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'commission':
          aVal = a.commission || 0;
          bVal = b.commission || 0;
          break;
        case 'sales':
          aVal = a.sales || 0;
          bVal = b.sales || 0;
          break;
        default:
          aVal = (a.commissionRate || 0) * 100;
          bVal = (b.commissionRate || 0) * 100;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Limit results
    const limited = products.slice(0, limit);

    // Calculate statistics
    const stats = {
      total: products.length,
      averageCommissionRate: products.length > 0
        ? (products.reduce((sum, p) => sum + (p.commissionRate || 0), 0) / products.length * 100).toFixed(2)
        : 0,
      highestCommissionRate: products.length > 0
        ? (Math.max(...products.map(p => p.commissionRate || 0)) * 100).toFixed(2)
        : 0,
      averagePrice: products.length > 0
        ? (products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toFixed(2)
        : 0
    };

    res.json({
      products: limited,
      stats,
      totalMatches: products.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to fetch products from Shopee
app.post('/api/fetch', async (req, res) => {
  console.log('=== FETCH API REQUEST STARTED ===');
  try {
    const {
      limit = 50,
      maxPages = 5,
      categoryId = null
    } = req.body;

    console.log('Fetch configuration:', { limit, maxPages, categoryId });

    // Fetch products using the shared logic
    const products = await fetchAllPages(categoryId);

    // Save products to file
    const filePath = join(__dirname, 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

    res.json({
      message: 'Products fetched and saved successfully',
      count: products.length
    });
  } catch (error) {
    console.error('Error in fetch API:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Open your browser and navigate to the URL above\n`);
});


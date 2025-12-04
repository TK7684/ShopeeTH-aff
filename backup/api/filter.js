import fs from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  console.log('=== FILTER API REQUEST STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));

  if (req.method !== 'POST') {
    console.log('ERROR: Invalid method, only POST allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    console.log('Filter parameters:', {
      inputFile,
      minCommissionRate,
      maxCommissionRate,
      minPrice,
      maxPrice,
      minSellerRate,
      minShopeeRate,
      sortBy,
      sortOrder,
      limit
    });

    const filePath = join(process.cwd(), inputFile);
    console.log('Full file path:', filePath);

    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    console.log('File exists:', fileExists);

    if (!fileExists) {
      console.log('ERROR: Products file not found');
      return res.status(404).json({ error: 'Products file not found.' });
    }

    // Read and parse the file
    console.log('Reading file...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File size:', fileContent.length, 'bytes');

    console.log('Parsing JSON...');
    let products = JSON.parse(fileContent);
    console.log('Successfully parsed', products.length, 'products');

    // Filter products
    console.log('Starting product filtering...');
    const initialCount = products.length;

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

    console.log('Filtered from', initialCount, 'to', products.length, 'products');

    // Sort products
    console.log('Sorting products by:', sortBy, 'in', sortOrder, 'order');
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
    const totalMatches = products.length;
    const limited = products.slice(0, limit);
    console.log('Limited results from', totalMatches, 'to', limited.length);

    // Calculate statistics
    console.log('Calculating statistics...');
    const stats = {
      total: totalMatches,
      averageCommissionRate: totalMatches > 0
        ? (products.reduce((sum, p) => sum + (p.commissionRate || 0), 0) / totalMatches * 100).toFixed(2)
        : 0,
      highestCommissionRate: totalMatches > 0
        ? (Math.max(...products.map(p => p.commissionRate || 0)) * 100).toFixed(2)
        : 0,
      averagePrice: totalMatches > 0
        ? (products.reduce((sum, p) => sum + (p.price || 0), 0) / totalMatches).toFixed(2)
        : 0
    };

    console.log('Calculated statistics:', stats);

    const response = {
      products: limited,
      stats,
      totalMatches
    };

    console.log('=== FILTER API REQUEST COMPLETED SUCCESSFULLY ===');
    res.status(200).json(response);
  } catch (error) {
    console.log('ERROR: Exception in filter API');
    console.log('Error type:', typeof error);
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);

    res.status(500).json({
      error: error.message,
      type: error.name,
      stack: error.stack
    });
  }
}

import fs from 'fs';
import { join } from 'path';

import { fetchAllPages } from '../fetchProducts.js';

export default async function handler(req, res) {
  console.log('=== PRODUCTS API REQUEST STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request query:', req.query);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));

  if (req.method !== 'GET') {
    console.log('ERROR: Invalid method, only GET allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const inputFile = req.query.file || 'products.json';
    console.log('Attempting to load file:', inputFile);

    // In Vercel, we need to use a different path approach
    const filePath = join(process.cwd(), inputFile);
    console.log('Full file path:', filePath);

    let products = [];

    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    console.log('File exists:', fileExists);

    if (fileExists) {
      // Read and parse the file
      console.log('Reading file...');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      console.log('File size:', fileContent.length, 'bytes');

      console.log('Parsing JSON...');
      products = JSON.parse(fileContent);
      console.log('Successfully parsed', products.length, 'products');
    } else {
      console.log('Products file not found. Fetching live data...');
      // Fallback to live fetch
      try {
        products = await fetchAllPages(null, { saveToFile: false });
        console.log('Successfully fetched live data:', products.length, 'products');

        // Cache the response for 1 hour (3600 seconds)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      } catch (fetchError) {
        console.log('Error fetching live data:', fetchError);
        throw new Error('Failed to load products from file or live API');
      }
    }

    // Add logging for first product sample
    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products[0], null, 2));
    }

    console.log('=== PRODUCTS API REQUEST COMPLETED SUCCESSFULLY ===');
    res.status(200).json(products);
  } catch (error) {
    console.log('ERROR: Exception in products API');
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

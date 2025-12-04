import { fetchAllPages } from '../fetchProducts.js';
import fs from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  console.log('=== FETCH API REQUEST STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request query:', req.query);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));

  if (req.method !== 'POST') {
    console.log('ERROR: Invalid method, only POST allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting product fetch from Shopee...');
    const startTime = Date.now();

    // Get configuration from request body or use defaults
    const {
      limit = 50,
      maxPages = 5,
      categoryId = null
    } = req.body;

    console.log('Fetch configuration:', { limit, maxPages, categoryId });

    // Fetch products from Shopee API
    // Fetch products from Shopee API
    const products = await fetchAllPages(categoryId, { saveToFile: false });
    console.log('Fetched', products.length, 'products');

    // Skip saving to file in API route to avoid EROFS on Vercel
    console.log('Skipping file save in API route');


    const elapsedTime = Date.now() - startTime;
    console.log('Fetch completed in', elapsedTime, 'ms');

    console.log('=== FETCH API REQUEST COMPLETED SUCCESSFULLY ===');
    res.status(200).json({
      message: 'Products fetched and saved successfully',
      count: products.length,
      elapsedTime
    });
  } catch (error) {
    console.log('ERROR: Exception in fetch API');
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

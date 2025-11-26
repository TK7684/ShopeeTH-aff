import { fetchProductsByCategory, fetchAllProducts } from './shopeeApi.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const categoryId = args.find(arg => arg.startsWith('--category='))?.split('=')[1];
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'products.json';
const maxPages = parseInt(args.find(arg => arg.startsWith('--max-pages='))?.split('=')[1]) || 10;
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 50;

export async function fetchAllPages(categoryId = null, customLimit = null, customMaxPages = null) {
  const allProducts = [];
  let currentPage = 1;
  let hasNextPage = true;
  let totalFetched = 0;

  const pageLimit = customLimit || limit;
  const maxPagesToFetch = customMaxPages || maxPages;

  console.log(`🚀 Starting to fetch products${categoryId ? ` for category ${categoryId}` : ' (all categories)'}...\n`);

  while (hasNextPage && currentPage <= maxPagesToFetch) {
    try {
      console.log(`📄 Fetching page ${currentPage}...`);

      const result = categoryId
        ? await fetchProductsByCategory(categoryId, pageLimit, currentPage)
        : await fetchAllProducts(pageLimit, currentPage);

      if (result.error) {
        console.error(`❌ Error on page ${currentPage}:`, result.error);
        break;
      }

      if (result.errors) {
        console.error(`❌ API Errors on page ${currentPage}:`, JSON.stringify(result.errors, null, 2));
        break;
      }

      if (!result.data || !result.data.productOfferV2) {
        console.error(`❌ No data returned on page ${currentPage}`);
        console.log('Response:', JSON.stringify(result, null, 2));
        break;
      }

      const { nodes, pageInfo } = result.data.productOfferV2;

      if (!nodes || nodes.length === 0) {
        console.log(`⚠️  No products found on page ${currentPage}`);
        break;
      }

      // Extract required fields
      const products = nodes.map(node => ({
        name: node.productName || 'N/A',
        commissionRate: parseFloat(node.commissionRate) || 0,
        sellerCommissionRate: parseFloat(node.sellerCommissionRate) || 0,
        shopeeCommissionRate: parseFloat(node.shopeeCommissionRate) || 0,
        commission: parseFloat(node.commission) || 0,
        price: parseFloat(node.price) || 0,
        priceMax: parseFloat(node.priceMax) || 0,
        priceMin: parseFloat(node.priceMin) || 0,
        // Additional useful fields
        itemId: node.itemId,
        shopId: node.shopId,
        shopName: node.shopName,
        categoryIds: node.productCatIds || [],
        sales: parseInt(node.sales) || 0,
        ratingStar: parseFloat(node.ratingStar) || 0,
        imageUrl: node.imageUrl,
        productLink: node.productLink,
        offerLink: node.offerLink
      }));

      allProducts.push(...products);
      totalFetched += products.length;

      console.log(`✅ Fetched ${products.length} products (Total: ${totalFetched})`);

      hasNextPage = pageInfo?.hasNextPage || false;
      currentPage++;

      // Add delay to avoid rate limiting
      if (hasNextPage && currentPage <= maxPagesToFetch) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${currentPage}:`, error.message);
      break;
    }
  }

  return allProducts;
}

async function main() {
  try {
    const products = await fetchAllPages(categoryId);

    if (products.length === 0) {
      console.log('\n⚠️  No products fetched. Please check your API credentials and category ID.');
      return;
    }

    // Save to JSON file
    const outputPath = join(__dirname, outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), 'utf8');

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total products fetched: ${products.length}`);
    if (products.length > 0) {
      const validRates = products.filter(p => p.commissionRate && p.commissionRate > 0);
      if (validRates.length > 0) {
        console.log(`Average commission rate: ${(validRates.reduce((sum, p) => sum + p.commissionRate, 0) / validRates.length * 100).toFixed(2)}%`);
        console.log(`Highest commission rate: ${(Math.max(...validRates.map(p => p.commissionRate)) * 100).toFixed(2)}%`);
        console.log(`Lowest commission rate: ${(Math.min(...validRates.map(p => p.commissionRate)) * 100).toFixed(2)}%`);
      } else {
        console.log(`Average commission rate: 0.00%`);
      }
    }
    console.log(`\n💾 Data saved to: ${outputPath}`);
    console.log('\n💡 Next step: Run "npm run analyze" or open the web interface with "npm run server"');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

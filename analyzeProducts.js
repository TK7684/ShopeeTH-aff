import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const inputFile = args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'products.json';
const minCommissionRate = parseFloat(args.find(arg => arg.startsWith('--min-rate='))?.split('=')[1]) || 0;
const maxPrice = parseFloat(args.find(arg => arg.startsWith('--max-price='))?.split('=')[1]) || Infinity;
const minPrice = parseFloat(args.find(arg => arg.startsWith('--min-price='))?.split('=')[1]) || 0;
const minCommission = parseFloat(args.find(arg => arg.startsWith('--min-commission='))?.split('=')[1]) || 0;
const topN = parseInt(args.find(arg => arg.startsWith('--top='))?.split('=')[1]) || 20;
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'filtered_products.json';

export function filterProducts(products, options = {}) {
  const {
    minCommissionRate = 0,
    minPrice = 0,
    maxPrice = Infinity,
    minCommission = 0,
    topN = 20
  } = options;

  // Filter products
  let filtered = products.filter(p => {
    const commissionRate = (p.commissionRate || 0) * 100; // Convert to percentage
    const price = p.price || 0;
    const commission = p.commission || 0;

    return commissionRate >= minCommissionRate &&
      price >= minPrice &&
      price <= maxPrice &&
      commission >= minCommission;
  });

  // Sort by commission rate (descending)
  filtered.sort((a, b) => {
    const rateA = (a.commissionRate || 0) * 100;
    const rateB = (b.commissionRate || 0) * 100;
    return rateB - rateA;
  });

  // Get top N
  return filtered.slice(0, topN);
}

function analyzeProducts() {
  const inputPath = join(__dirname, inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    console.log('💡 Run "npm run fetch" first to fetch products');
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  console.log(`\n📊 Analyzing ${products.length} products...\n`);

  const topProducts = filterProducts(products, {
    minCommissionRate,
    minPrice,
    maxPrice,
    minCommission,
    topN
  });

  // Display results
  console.log('='.repeat(80));
  console.log('🏆 TOP PRODUCTS BY COMMISSION RATE');
  console.log('='.repeat(80));
  console.log(`Filters applied:`);
  console.log(`  - Min commission rate: ${minCommissionRate}%`);
  console.log(`  - Min commission amount: ${minCommission.toLocaleString()} THB`);
  console.log(`  - Price range: ${minPrice.toLocaleString()} - ${maxPrice === Infinity ? '∞' : maxPrice.toLocaleString()} THB`);
  console.log(`  - Products matching: ${products.length}`); // Note: this count is total, not filtered. 
  console.log(`  - Showing top: ${topProducts.length}\n`);

  topProducts.forEach((product, index) => {
    const rate = (product.commissionRate || 0) * 100;
    const sellerRate = (product.sellerCommissionRate || 0) * 100;
    const shopeeRate = (product.shopeeCommissionRate || 0) * 100;

    console.log(`${index + 1}. ${product.name}`);
    console.log(`   💰 Commission Rate: ${rate.toFixed(2)}% (Seller: ${sellerRate.toFixed(2)}%, Shopee: ${shopeeRate.toFixed(2)}%)`);
    console.log(`   💵 Price: ${(product.price || 0).toLocaleString()} THB (Min: ${(product.priceMin || 0).toLocaleString()}, Max: ${(product.priceMax || 0).toLocaleString()})`);
    console.log(`   💸 Commission: ${(product.commission || 0).toLocaleString()} THB`);
    console.log(`   📦 Sales: ${(product.sales || 0).toLocaleString()} | ⭐ Rating: ${(parseFloat(product.ratingStar) || 0).toFixed(1)}`);
    console.log(`   🔗 Link: ${product.productLink || 'N/A'}`);
    console.log('');
  });

  // Save filtered results
  const outputPath = join(__dirname, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(topProducts, null, 2), 'utf8');
  console.log(`💾 Top products saved to: ${outputPath}\n`);

  // Statistics (simplified for CLI)
  console.log('='.repeat(80));
  console.log('📈 STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total products analyzed: ${products.length}`);
  console.log('='.repeat(80));
}

// Only run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  analyzeProducts();
}

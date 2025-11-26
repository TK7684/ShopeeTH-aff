import { fetchProduct, fetchAllProducts } from './shopeeApi.js';

// Test the Shopee Affiliate API
async function testAPI() {
  console.log('🧪 Testing Shopee Affiliate API...\n');
  console.log('='.repeat(60));

  // Test 1: Try to fetch all products (without specific shopId/itemId)
  console.log('\n📋 Test 1: Fetching all products (limit: 5)...');
  let test1Result = null;
  try {
    test1Result = await fetchAllProducts(5, 1);
    
    if (test1Result.error) {
      console.log('❌ Error:', test1Result.error);
    } else if (test1Result.errors) {
      console.log('❌ API Errors:', JSON.stringify(test1Result.errors, null, 2));
    } else if (test1Result.data && test1Result.data.productOfferV2) {
      const products = test1Result.data.productOfferV2.nodes || [];
      console.log(`✅ Success! Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log('\n📦 Sample Product:');
        const p = products[0];
        console.log(`   Name: ${p.productName || 'N/A'}`);
        console.log(`   Commission Rate: ${((p.commissionRate || 0) * 100).toFixed(2)}%`);
        console.log(`   Price: ${(p.price || 0).toLocaleString()} THB`);
        console.log(`   Item ID: ${p.itemId}`);
        console.log(`   Shop ID: ${p.shopId}`);
      }
    } else {
      console.log('⚠️  Unexpected response format:');
      console.log(JSON.stringify(test1Result, null, 2));
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
  }

  // Test 2: Try fetching a specific product using IDs from Test 1
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Test 2: Fetching specific product...');
  
  if (test1Result && test1Result.data && test1Result.data.productOfferV2 && test1Result.data.productOfferV2.nodes.length > 0) {
    const sampleProduct = test1Result.data.productOfferV2.nodes[0];
    const shopId = sampleProduct.shopId;
    const itemId = sampleProduct.itemId;
    
    console.log(`   Using Shop ID: ${shopId}, Item ID: ${itemId}`);
    
    try {
      const productResult = await fetchProduct(shopId, itemId);
      
      if (productResult.error) {
        console.log('❌ Error:', productResult.error);
      } else if (productResult.errors) {
        console.log('❌ API Errors:', JSON.stringify(productResult.errors, null, 2));
      } else if (productResult.data && productResult.data.productOfferV2) {
        const products = productResult.data.productOfferV2.nodes || [];
        console.log(`✅ Success! Fetched product details`);
        
        if (products.length > 0) {
          const p = products[0];
          console.log('\n📦 Product Details:');
          console.log(`   Name: ${p.productName || 'N/A'}`);
          console.log(`   Commission Rate: ${((p.commissionRate || 0) * 100).toFixed(2)}%`);
          console.log(`   Seller Commission: ${((p.sellerCommissionRate || 0) * 100).toFixed(2)}%`);
          console.log(`   Shopee Commission: ${((p.shopeeCommissionRate || 0) * 100).toFixed(2)}%`);
          console.log(`   Commission Amount: ${(p.commission || 0).toLocaleString()} THB`);
          console.log(`   Price: ${(p.price || 0).toLocaleString()} THB`);
          console.log(`   Price Range: ${(p.priceMin || 0).toLocaleString()} - ${(p.priceMax || 0).toLocaleString()} THB`);
          console.log(`   Sales: ${(p.sales || 0).toLocaleString()}`);
          console.log(`   Rating: ${(parseFloat(p.ratingStar) || 0).toFixed(1)} ⭐`);
          console.log(`   Shop: ${p.shopName || 'N/A'}`);
          console.log(`   Categories: ${(p.productCatIds || []).join(', ')}`);
        }
      } else {
        console.log('⚠️  Unexpected response format');
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
  } else {
    console.log('⚠️  No products from Test 1 to use for Test 2');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 API Testing Complete!');
  console.log('\nIf you see errors, check:');
  console.log('  1. API credentials in shopeeApi.js (APP_ID, SECRET)');
  console.log('  2. Network connectivity');
  console.log('  3. API endpoint: https://open-api.affiliate.shopee.co.th/graphql');
  console.log('  4. Shopee Affiliate API documentation');
}

// Run the test
testAPI().catch(console.error);


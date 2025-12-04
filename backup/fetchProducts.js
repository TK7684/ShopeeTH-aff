import fs from "fs";
import { fileURLToPath } from 'url';
import { fetchAllProducts, fetchProductsByCategory } from "./shopeeApi.js";

// Configuration from Environment Variables
const LIMIT = parseInt(process.env.PIPELINE_LIMIT || "50", 10);
const MAX_PAGES = parseInt(process.env.PIPELINE_MAX_PAGES || "5", 10);

async function fetchAllPages(categoryId = null, options = {}) {
  const { saveToFile = true } = options;
  console.log("=== FETCH ALL PAGES STARTED ===");
  console.log("Parameters:", {
    categoryId,
    saveToFile,
    LIMIT,
    MAX_PAGES,
    isProduction: process.env.NODE_ENV === "production",
  });

  let allProducts = [];
  let page = 1;
  let hasMore = true;
  let totalFetched = 0;

  try {
    while (hasMore && page <= MAX_PAGES) {
      console.log(`Fetching page ${page} of ${MAX_PAGES}...`);
      const startTime = Date.now();

      // Fetch products from API using GraphQL
      let response;
      if (categoryId) {
        response = await fetchProductsByCategory(categoryId, LIMIT, page);
      } else {
        response = await fetchAllProducts(LIMIT, page);
      }

      const elapsedTime = Date.now() - startTime;
      console.log(`Page ${page} fetched in ${elapsedTime}ms`);

      // Check response structure for GraphQL
      if (!response || !response.data || !response.data.productOfferV2) {
        console.log("Invalid GraphQL response:", JSON.stringify(response, null, 2));
        hasMore = false;
        break;
      }

      const { nodes: products, pageInfo } = response.data.productOfferV2;
      const hasMorePages = pageInfo ? pageInfo.hasNextPage : false;

      if (!products || products.length === 0) {
        console.log("No products found in response");
        hasMore = false;
        break;
      }

      console.log(`Found ${products.length} products on page ${page}`);

      // Add page info to each product for debugging
      const productsWithPageInfo = products.map((product) => ({
        ...product,
        // Map GraphQL fields to expected format if necessary
        name: product.productName, // Map productName to name
        _fetchPage: page,
        _fetchTime: new Date().toISOString(),
      }));

      allProducts = [...allProducts, ...productsWithPageInfo];
      totalFetched += products.length;

      hasMore = hasMorePages && page < MAX_PAGES;
      page++;

      // Log a sample product from this page
      if (products.length > 0) {
        console.log(
          "Sample product from page",
          page - 1,
          ":",
          JSON.stringify(
            {
              id: products[0].itemId,
              name: products[0].name,
              commissionRate: products[0].commissionRate,
              price: products[0].price,
            },
            null,
            2,
          ),
        );
      }
    }

    console.log(`Total products fetched: ${totalFetched}`);

    // Save to file only if requested
    if (saveToFile) {
      const filePath = "products.json";
      console.log("Saving products to file:", filePath);

      const saveStartTime = Date.now();
      fs.writeFileSync(filePath, JSON.stringify(allProducts, null, 2));
      const saveElapsedTime = Date.now() - saveStartTime;

      console.log(`Products saved to ${filePath} in ${saveElapsedTime}ms`);
    } else {
      console.log("Skipping file save (saveToFile=false)");
    }

    console.log("=== FETCH ALL PAGES COMPLETED ===");
    return allProducts;

  } catch (error) {
    console.log("ERROR: Exception in fetchAllPages");
    console.log("Error type:", typeof error);
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);

    if (error.response) {
      console.log(
        "Response data:",
        JSON.stringify(error.response.data, null, 2),
      );
      console.log("Response status:", error.response.status);
      console.log(
        "Response headers:",
        JSON.stringify(error.response.headers, null, 2),
      );
    }

    console.log("=== FETCH ALL PAGES FAILED ===");
    throw error;
  }
}

// Check if running directly (ES Module equivalent of require.main === module)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchAllPages().catch(console.error);
}

export { fetchAllPages };

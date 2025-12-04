import { fetchAllPages } from "~/server/utils/fetchProducts";

// In-memory cache for products
let cachedProducts: any[] | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export default defineEventHandler(async (event) => {
  console.log("=== PRODUCTS API REQUEST STARTED ===");

  try {
    const now = Date.now();

    // Check if we have valid cached data
    if (cachedProducts && cacheTime && now - cacheTime < CACHE_DURATION) {
      console.log("Returning cached products");
      setHeader(event, "X-Cache", "HIT");
      return cachedProducts;
    }

    console.log("Cache miss or expired, fetching fresh data...");

    // Fetch fresh data
    const products = await fetchAllPages(null);

    // Update cache
    cachedProducts = products;
    cacheTime = now;

    console.log(`Successfully fetched ${products.length} products`);
    console.log("=== PRODUCTS API REQUEST COMPLETED SUCCESSFULLY ===");

    setHeader(event, "X-Cache", "MISS");
    setHeader(event, "Cache-Control", "s-maxage=3600, stale-while-revalidate");

    return products;
  } catch (error: any) {
    console.log("ERROR: Exception in products API");
    console.log("Error type:", typeof error);
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }
});

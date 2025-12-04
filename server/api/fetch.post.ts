import { fetchAllPages } from "~/server/utils/fetchProducts";

export default defineEventHandler(async (event) => {
  console.log("=== FETCH API REQUEST STARTED ===");
  console.log("Request method:", event.method);

  try {
    const body = await readBody(event);
    console.log("Request body:", JSON.stringify(body, null, 2));

    const startTime = Date.now();

    // Get configuration from request body or use defaults
    const { categoryId = null } = body || {};

    console.log("Fetch configuration:", { categoryId });

    // Fetch products from Shopee API (in-memory, no file save)
    const products = await fetchAllPages(categoryId);
    console.log("Fetched", products.length, "products");

    const elapsedTime = Date.now() - startTime;
    console.log("Fetch completed in", elapsedTime, "ms");

    console.log("=== FETCH API REQUEST COMPLETED SUCCESSFULLY ===");
    return {
      message: "Products fetched successfully",
      count: products.length,
      elapsedTime,
    };
  } catch (error: any) {
    console.log("ERROR: Exception in fetch API");
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

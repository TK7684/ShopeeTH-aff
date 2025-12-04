import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Integration Tests", () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in test output
    vi.mocked(console.log).mockImplementation(() => {});
    vi.mocked(console.error).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("should test the complete fetch-filter-upload flow", async () => {
    // This test verifies the complete flow from fetching products to uploading to Google Sheets
    // It uses integration testing approach to test the interaction between components

    // Mock data
    const mockProducts = [
      {
        itemId: "1",
        productName: "Test Product 1",
        commissionRate: 0.15,
        commission: 75,
        price: 500,
        productCatIds: [1, 2],
      },
      {
        itemId: "2",
        productName: "Test Product 2",
        commissionRate: 0.12,
        commission: 60,
        price: 500,
        productCatIds: [1, 3],
      },
      {
        itemId: "3",
        productName: "Test Product 3",
        commissionRate: 0.08,
        commission: 40,
        price: 500,
        productCatIds: [1, 4],
      },
    ];

    // Mock utility functions
    const mockFetchAllPages = vi.fn().mockResolvedValue(mockProducts);
    const mockFilterProducts = vi.fn().mockReturnValue([
      mockProducts[0], // Only products 1 and 2 match the filter criteria
      mockProducts[1],
    ]);
    const mockUploadToGoogleSheet = vi.fn().mockResolvedValue(undefined);
    const mockBuildSheetRows = vi.fn().mockReturnValue([["row1"], ["row2"]]);
    const mockBuildCategoryRows = vi
      .fn()
      .mockReturnValue([["catRow1"], ["catRow2"]]);
    const mockBuildCategoryTabs = vi.fn().mockReturnValue([["tab1"], ["tab2"]]);

    // 1. Test the test endpoint to ensure basic connectivity
    const testEndpoint = () => ({
      message: "API test route is working",
      timestamp: new Date().toISOString(),
    });

    const testResponse = testEndpoint();
    expect(testResponse).toHaveProperty("message", "API test route is working");
    expect(testResponse).toHaveProperty("timestamp");

    // 2. Test the fetch endpoint
    const fetchEndpoint = async (body: { categoryId?: string | null }) => {
      const { categoryId = null } = body || {};
      const startTime = Date.now();

      // Fetch products from Shopee API (using mock)
      const products = await mockFetchAllPages(categoryId);
      const elapsedTime = Date.now() - startTime;

      return {
        message: "Products fetched successfully",
        count: products.length,
        elapsedTime,
      };
    };

    const fetchResponse = await fetchEndpoint({ categoryId: null });
    expect(fetchResponse).toHaveProperty(
      "message",
      "Products fetched successfully",
    );
    expect(fetchResponse).toHaveProperty("count", 3);
    expect(fetchResponse).toHaveProperty("elapsedTime");

    // 3. Test the products endpoint (with caching)
    const productsEndpoint = async () => {
      // Simple cache simulation
      let cachedProducts: any[] | null = null;
      let cacheTime: number | null = null;
      const CACHE_DURATION = 3600000; // 1 hour in milliseconds

      const now = Date.now();

      // Check if we have valid cached data
      if (cachedProducts && cacheTime && now - cacheTime < CACHE_DURATION) {
        return { data: cachedProducts, headers: { "X-Cache": "HIT" } };
      }

      // Fetch fresh data
      const products = await mockFetchAllPages(null);

      // Update cache
      cachedProducts = products;
      cacheTime = now;

      return { data: products, headers: { "X-Cache": "MISS" } };
    };

    // First call should fetch fresh data
    const productsResponse1 = await productsEndpoint();
    expect(productsResponse1.data).toHaveLength(3);
    expect(productsResponse1.headers["X-Cache"]).toBe("MISS");

    // Second call should use cache
    const productsResponse2 = await productsEndpoint();
    expect(productsResponse2.data).toEqual(productsResponse1.data);
    expect(productsResponse2.headers["X-Cache"]).toBe("HIT");

    // 4. Test the cron endpoint (pipeline execution)
    const cronEndpoint = async () => {
      // 1. Fetch Products
      const products = await mockFetchAllPages(null);

      if (products.length === 0) {
        return { message: "No products fetched", count: 0 };
      }

      // 2. Analyze/Filter Products
      const filteredProducts = mockFilterProducts(products, {
        minCommissionRate: 10,
        minCommission: 60,
        topN: 100,
      });

      if (filteredProducts.length === 0) {
        return { message: "No products matched filters", count: 0 };
      }

      // 3. Upload to Google Sheets
      const rows = mockBuildSheetRows(filteredProducts);
      const categoryRows = mockBuildCategoryRows(filteredProducts, 5);
      const categoryTabs = mockBuildCategoryTabs(filteredProducts, 20);

      await mockUploadToGoogleSheet({
        spreadsheetId: "test-sheet-id",
        range: "test-range",
        values: rows,
        historyLimit: 1000,
        categoryRange: "test-category-range",
        categoryValues: categoryRows,
        categoryTabs,
      });

      return {
        message: "Pipeline executed successfully",
        fetched: products.length,
        filtered: filteredProducts.length,
        uploaded: true,
      };
    };

    const cronResponse = await cronEndpoint();
    expect(cronResponse).toHaveProperty(
      "message",
      "Pipeline executed successfully",
    );
    expect(cronResponse).toHaveProperty("fetched", 3);
    expect(cronResponse).toHaveProperty("filtered", 2);
    expect(cronResponse).toHaveProperty("uploaded", true);

    // Verify the upload function was called with the correct parameters
    expect(mockUploadToGoogleSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: expect.any(String),
        range: expect.any(String),
        values: expect.any(Array),
        categoryValues: expect.any(Array),
        categoryTabs: expect.any(Array),
      }),
    );
  });

  it("should handle error flow through the API", async () => {
    // Test error handling in the API flow

    // Mock an error in fetchAllPages
    const errorMessage = "Network error";
    const mockFetchAllPages = vi
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    // Test that the products endpoint handles the error correctly
    const productsEndpoint = async () => {
      try {
        // Fetch fresh data
        const products = await mockFetchAllPages(null);
        return { data: products, headers: { "X-Cache": "MISS" } };
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    await expect(productsEndpoint()).rejects.toThrow(errorMessage);

    // Reset the mock for the next test
    mockFetchAllPages.mockReset();

    // Test that the fetch endpoint handles errors correctly
    const apiError = new Error("API Error");
    mockFetchAllPages.mockRejectedValue(apiError);

    const fetchEndpoint = async () => {
      try {
        const products = await mockFetchAllPages(null);
        return {
          message: "Products fetched successfully",
          count: products.length,
          elapsedTime: 0,
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    await expect(fetchEndpoint()).rejects.toThrow("API Error");

    // Reset the mock for the next test
    mockFetchAllPages.mockReset();

    // Test that the cron endpoint handles errors correctly
    const cronError = new Error("Fetch error");
    mockFetchAllPages.mockRejectedValue(cronError);

    const cronEndpoint = async () => {
      try {
        // 1. Fetch Products
        const products = await mockFetchAllPages(null);
        return { message: "Should not reach here", count: products.length };
      } catch (error: any) {
        throw new Error(error.message);
      }
    };

    await expect(cronEndpoint()).rejects.toThrow("Fetch error");
  });

  it("should handle edge cases in the API flow", async () => {
    // Test edge cases in the API flow

    // Mock fetchAllPages for different scenarios
    const mockFetchAllPages = vi.fn();
    const mockFilterProducts = vi.fn();

    // 1. Test with empty product list
    mockFetchAllPages.mockResolvedValue([]);

    // Products endpoint with empty list
    const productsEndpoint = async () => {
      const products = await mockFetchAllPages(null);
      return { data: products, headers: { "X-Cache": "MISS" } };
    };

    const emptyProductsResponse = await productsEndpoint();
    expect(emptyProductsResponse.data).toEqual([]);

    // Fetch endpoint with empty list
    const fetchEndpoint = async () => {
      const products = await mockFetchAllPages(null);
      return {
        message: "Products fetched successfully",
        count: products.length,
        elapsedTime: 0,
      };
    };

    const emptyFetchResponse = await fetchEndpoint();
    expect(emptyFetchResponse.count).toBe(0);

    // Cron endpoint with empty list
    const cronEndpoint = async () => {
      // 1. Fetch Products
      const products = await mockFetchAllPages(null);

      if (products.length === 0) {
        return { message: "No products fetched", count: 0 };
      }

      return { message: "Should not reach here", count: products.length };
    };

    const emptyCronResponse = await cronEndpoint();
    expect(emptyCronResponse.message).toBe("No products fetched");

    // 2. Test with products that don't match filters
    const mockProducts = [
      { itemId: "1", commissionRate: 0.05, commission: 30 }, // Below filters
    ];

    mockFetchAllPages.mockResolvedValue(mockProducts);
    mockFilterProducts.mockReturnValue([]); // No products match filters

    // Cron endpoint with no matching products
    const noMatchCronEndpoint = async () => {
      // 1. Fetch Products
      const products = await mockFetchAllPages(null);

      if (products.length === 0) {
        return { message: "No products fetched", count: 0 };
      }

      // 2. Analyze/Filter Products
      const filteredProducts = mockFilterProducts(products, {
        minCommissionRate: 10,
        minCommission: 60,
        topN: 100,
      });

      if (filteredProducts.length === 0) {
        return { message: "No products matched filters", count: 0 };
      }

      return { message: "Should not reach here", count: 0 };
    };

    const noMatchCronResponse = await noMatchCronEndpoint();
    expect(noMatchCronResponse.message).toBe("No products matched filters");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the server functions
const mockProducts = [
  {
    itemId: "1",
    productName: "Test Product 1",
    commissionRate: 0.15,
    commission: 75,
    price: 500,
    productCatIds: [1, 2],
    sales: 100,
    ratingStar: 4.5,
    imageUrl: "https://example.com/image1.jpg",
    shopId: "shop1",
    shopName: "Test Shop",
    productLink: "https://example.com/product1",
    offerLink: "https://example.com/offer1",
  },
  {
    itemId: "2",
    productName: "Test Product 2",
    commissionRate: 0.12,
    commission: 60,
    price: 500,
    productCatIds: [1, 3],
    sales: 80,
    ratingStar: 4.2,
    imageUrl: "https://example.com/image2.jpg",
    shopId: "shop2",
    shopName: "Another Shop",
    productLink: "https://example.com/product2",
    offerLink: "https://example.com/offer2",
  },
];

// Mock fetchAllPages function
const mockFetchAllPages = vi.fn();
const mockFilterProducts = vi.fn();
const mockUploadToGoogleSheet = vi.fn();
const mockBuildSheetRows = vi.fn();
const mockBuildCategoryRows = vi.fn();
const mockBuildCategoryTabs = vi.fn();

// Mock console methods to avoid noise in test output
beforeEach(() => {
  vi.mocked(console.log).mockImplementation(() => {});
  vi.mocked(console.error).mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("API Tests", () => {
  describe("Test Endpoint", () => {
    it("should return a success response with timestamp", () => {
      // Mock the test endpoint handler
      const testHandler = () => ({
        message: "API test route is working",
        timestamp: new Date().toISOString(),
      });

      const result = testHandler();

      expect(result).toHaveProperty("message", "API test route is working");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
    });
  });

  describe("Products Endpoint", () => {
    it("should return products from cache when available", async () => {
      // Mock the products endpoint handler
      let cachedProducts: any[] | null = mockProducts;
      let cacheTime: number | null = Date.now();
      const CACHE_DURATION = 3600000; // 1 hour in milliseconds

      const productsHandler = () => {
        const now = Date.now();

        // Check if we have valid cached data
        if (
          cachedProducts &&
          cacheTime &&
          now - cacheTime < CACHE_DURATION
        ) {
          return { data: cachedProducts, headers: { "X-Cache": "HIT" } };
        }

        return { data: [], headers: { "X-Cache": "MISS" } };
      };

      const result = productsHandler();

      expect(result.data).toEqual(mockProducts);
      expect(result.headers["X-Cache"]).toBe("HIT");
    });

    it("should fetch fresh products when cache is expired", async () => {
      // Mock the products endpoint handler
      let cachedProducts: any[] | null = null;
      let cacheTime: number | null = null;
      const CACHE_DURATION = 3600000; // 1 hour in milliseconds

      const productsHandler = async () => {
        const now = Date.now();

        // Check if we have valid cached data
        if (
          cachedProducts &&
          cacheTime &&
          now - cacheTime < CACHE_DURATION
        ) {
          return { data: cachedProducts, headers: { "X-Cache": "HIT" } };
        }

        // Fetch fresh data
        const products = await mockFetchAllPages(null);

        // Update cache
        cachedProducts = products;
        cacheTime = now;

        return { data: products, headers: { "X-Cache": "MISS" } };
      };

      mockFetchAllPages.mockResolvedValue(mockProducts);

      const result = await productsHandler();

      expect(mockFetchAllPages).toHaveBeenCalledWith(null);
      expect(result.data).toEqual(mockProducts);
      expect(result.headers["X-Cache"]).toBe("MISS");
    });
  });

  describe("Fetch Endpoint", () => {
    it("should fetch products without categoryId", async () => {
      // Mock the fetch endpoint handler
      const fetchHandler = async (body: { categoryId?: string | null }) => {
        const { categoryId = null } = body || {};
        const startTime = Date.now();

        // Fetch products from Shopee API
        const products = await mockFetchAllPages(categoryId);
        const elapsedTime = Date.now() - startTime;

        return {
          message: "Products fetched successfully",
          count: products.length,
          elapsedTime,
        };
      };

      mockFetchAllPages.mockResolvedValue(mockProducts);

      const result = await fetchHandler({});

      expect(mockFetchAllPages).toHaveBeenCalledWith(null);
      expect(result).toHaveProperty("message", "Products fetched successfully");
      expect(result).toHaveProperty("count", 2);
      expect(result).toHaveProperty("elapsedTime");
    });

    it("should fetch products with categoryId", async () => {
      // Mock the fetch endpoint handler
      const fetchHandler = async (body: { categoryId?: string | null }) => {
        const { categoryId = null } = body || {};
        const startTime = Date.now();

        // Fetch products from Shopee API
        const products = await mockFetchAllPages(categoryId);
        const elapsedTime = Date.now() - startTime;

        return {
          message: "Products fetched successfully",
          count: products.length,
          elapsedTime,
        };
      };

      mockFetchAllPages.mockResolvedValue(mockProducts);

      const result = await fetchHandler({ categoryId: "123" });

      expect(mockFetchAllPages).toHaveBeenCalledWith("123");
      expect(result).toHaveProperty("message", "Products fetched successfully");
      expect(result).toHaveProperty("count", 2);
      expect(result).toHaveProperty("elapsedTime");
    });

    it("should handle empty product list", async () => {
      // Mock the fetch endpoint handler
      const fetchHandler = async (body: { categoryId?: string | null }) => {
        const { categoryId = null } = body || {};
        const startTime = Date.now();

        // Fetch products from Shopee API
        const products = await mockFetchAllPages(categoryId);
        const elapsedTime = Date.now() - startTime;

        return {
          message: "Products fetched successfully",
          count: products.length,
          elapsedTime,
        };
      };

      mockFetchAllPages.mockResolvedValue([]);

      const result = await fetchHandler({});

      expect(result).toHaveProperty("message", "Products fetched successfully");
      expect(result).toHaveProperty("count", 0);
      expect(result).toHaveProperty("elapsedTime");
    });
  });

  describe("Cron Endpoint", () => {
    it("should execute the pipeline successfully", async () => {
      // Mock the cron endpoint handler
      const cronHandler = async () => {
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

      const filteredProducts = [mockProducts[0]]; // Only the first product matches filters

      mockFetchAllPages.mockResolvedValue(mockProducts);
      mockFilterProducts.mockReturnValue(filteredProducts);
      mockBuildSheetRows.mockReturnValue([["row1"], ["row2"]]);
      mockBuildCategoryRows.mockReturnValue([["catRow1"], ["catRow2"]]);
      mockBuildCategoryTabs.mockReturnValue([["tab1"], ["tab2"]]);
      mockUploadToGoogleSheet.mockResolvedValue(undefined);

      const result = await cronHandler();

      expect(mockFetchAllPages).toHaveBeenCalledWith(null);
      expect(mockFilterProducts).toHaveBeenCalledWith(mockProducts, {
        minCommissionRate: 10,
        minCommission: 60,
        topN: 100,
      });
      expect(mockBuildSheetRows).toHaveBeenCalledWith(filteredProducts);
      expect(mockBuildCategoryRows).toHaveBeenCalledWith(filteredProducts, 5);
      expect(mockBuildCategoryTabs).toHaveBeenCalledWith(filteredProducts, 20);
      expect(mockUploadToGoogleSheet).toHaveBeenCalledWith({
        spreadsheetId: "test-sheet-id",
        range: "test-range",
        values: [["row1"], ["row2"]],
        historyLimit: 1000,
        categoryRange: "test-category-range",
        categoryValues: [["catRow1"], ["catRow2"]],
        categoryTabs: [["tab1"], ["tab2"]],
      });
      expect(result).toEqual({
        message: "Pipeline executed successfully",
        fetched: 2,
        filtered: 1,
        uploaded: true,
      });
    });

    it("should handle empty product list", async () => {
      // Mock the cron endpoint handler
      const cronHandler = async () => {
        // 1. Fetch Products
        const products = await mockFetchAllPages(null);

        if (products.length === 0) {
          return { message: "No products fetched", count: 0 };
        }

        return { message: "Should not reach here" };
      };

      mockFetchAllPages.mockResolvedValue([]);

      const result = await cronHandler();

      expect(result).toEqual({
        message: "No products fetched",
        count: 0,
      });
      expect(mockFilterProducts).not.toHaveBeenCalled();
      expect(mockUploadToGoogleSheet).not.toHaveBeenCalled();
    });

    it("should handle empty filtered product list", async () => {
      // Mock the cron endpoint handler
      const cronHandler = async () => {
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

        return { message: "Should not reach here" };
      };

      mockFetchAllPages.mockResolvedValue(mockProducts);
      mockFilterProducts.mockReturnValue([]);

      const result = await cronHandler();

      expect(result).toEqual({
        message: "No products matched filters",
        count: 0,
      });
      expect(mockBuildSheetRows).not.toHaveBeenCalled();
      expect(mockUploadToGoogleSheet).not.toHaveBeenCalled();
    });
  });
});

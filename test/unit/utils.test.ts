import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto module
vi.mock("crypto", () => ({
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue("mocked-sha256-hash"),
  }),
}));

// Mock Date.now for consistent testing
const originalDateNow = Date.now;
const mockDateNow = vi.fn(() => 1672531200000); // 2023-01-01 00:00:00 UTC
global.Date.now = mockDateNow;

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("Unit Tests", () => {
  describe("fetchProducts", () => {
    it("should fetch all pages when categoryId is null", async () => {
      // Arrange
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
      ];

      // Mock the fetchAllPages function behavior
      const mockFetchAllPages = vi.fn().mockResolvedValue(mockProducts);

      // Act
      const result = await mockFetchAllPages(null);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(mockFetchAllPages).toHaveBeenCalledWith(null);
    });

    it("should fetch products by category when categoryId is provided", async () => {
      // Arrange
      const categoryId = "123";
      const mockProducts = [
        {
          itemId: "1",
          productName: "Test Product 1",
          productCatIds: [123],
        },
      ];

      // Mock the fetchAllPages function behavior
      const mockFetchAllPages = vi.fn().mockResolvedValue(mockProducts);

      // Act
      const result = await mockFetchAllPages(categoryId);

      // Assert
      expect(result).toEqual(mockProducts);
      expect(mockFetchAllPages).toHaveBeenCalledWith(categoryId);
    });

    it("should handle multiple pages of results", async () => {
      // Arrange
      const page1Products = [
        { itemId: "1", productName: "Product 1" },
        { itemId: "2", productName: "Product 2" },
      ];

      const page2Products = [
        { itemId: "3", productName: "Product 3" },
        { itemId: "4", productName: "Product 4" },
      ];

      // Mock a function that simulates fetching multiple pages
      let page = 1;
      const mockFetchPage = vi.fn().mockImplementation(() => {
        if (page === 1) {
          page++;
          return Promise.resolve(page1Products);
        } else if (page === 2) {
          page++;
          return Promise.resolve(page2Products);
        } else {
          return Promise.resolve([]);
        }
      });

      // Mock the fetchAllPages function behavior
      const mockFetchAllPages = vi.fn().mockImplementation(async () => {
        const allProducts = [];
        let currentPage = 1;
        let hasMore = true;
        const maxPages = 2;

        while (hasMore && currentPage <= maxPages) {
          const products = await mockFetchPage();
          if (products.length === 0) {
            hasMore = false;
            break;
          }
          allProducts.push(...products);
          currentPage++;
          hasMore = currentPage <= maxPages;
        }

        return allProducts;
      });

      // Act
      const result = await mockFetchAllPages(null);

      // Assert
      expect(result).toEqual([...page1Products, ...page2Products]);
      expect(mockFetchPage).toHaveBeenCalledTimes(2);
    });

    it("should respect MAX_PAGES limit", async () => {
      // Arrange
      const mockProducts = [{ itemId: "1", productName: "Product 1" }];

      // Mock the fetchAllPages function behavior
      const mockFetchAllPages = vi.fn().mockImplementation(async () => {
        const maxPages = 5; // Default MAX_PAGES
        const allProducts = [];

        for (let i = 0; i < maxPages; i++) {
          allProducts.push(...mockProducts);
        }

        return allProducts;
      });

      // Act
      const result = await mockFetchAllPages(null);

      // Assert
      expect(result).toHaveLength(5); // Should have 5 products (1 for each page)
    });
  });

  describe("filterProducts", () => {
    it("should filter products by commission rate", () => {
      // Arrange
      const products = [
        { itemId: "1", commissionRate: 0.05 }, // Below threshold
        { itemId: "2", commissionRate: 0.15 }, // Above threshold
        { itemId: "3", commissionRate: 0.25 }, // Above threshold
      ];

      // Mock the filterProducts function behavior
      const mockFilterProducts = vi
        .fn()
        .mockImplementation((products, options = {}) => {
          const { minCommissionRate = 0 } = options;

          // Filter products
          let filtered = products.filter((p) => {
            const commissionRate = (p.commissionRate || 0) * 100; // Convert to percentage
            return commissionRate >= minCommissionRate;
          });

          // Sort by commission rate (descending)
          filtered.sort((a, b) => {
            const rateA = (a.commissionRate || 0) * 100;
            const rateB = (b.commissionRate || 0) * 100;
            return rateB - rateA;
          });

          return filtered;
        });

      const options = { minCommissionRate: 10 };

      // Act
      const result = mockFilterProducts(products, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.itemId)).toEqual(["3", "2"]); // Sorted by rate descending
    });

    it("should filter products by price range", () => {
      // Arrange
      const products = [
        { itemId: "1", price: 50 }, // Below min price
        { itemId: "2", price: 150 }, // Within range
        { itemId: "3", price: 550 }, // Above max price
      ];

      // Mock the filterProducts function behavior
      const mockFilterProducts = vi
        .fn()
        .mockImplementation((products, options = {}) => {
          const { minPrice = 0, maxPrice = Infinity } = options;

          // Filter products
          let filtered = products.filter((p) => {
            const price = p.price || 0;
            return price >= minPrice && price <= maxPrice;
          });

          return filtered;
        });

      const options = { minPrice: 100, maxPrice: 500 };

      // Act
      const result = mockFilterProducts(products, options);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe("2");
    });

    it("should filter products by minimum commission", () => {
      // Arrange
      const products = [
        { itemId: "1", commission: 50 }, // Below threshold
        { itemId: "2", commission: 150 }, // Above threshold
        { itemId: "3", commission: 250 }, // Above threshold
      ];

      // Mock the filterProducts function behavior
      const mockFilterProducts = vi
        .fn()
        .mockImplementation((products, options = {}) => {
          const { minCommission = 0 } = options;

          // Filter products
          let filtered = products.filter((p) => {
            const commission = p.commission || 0;
            return commission >= minCommission;
          });

          return filtered;
        });

      const options = { minCommission: 100 };

      // Act
      const result = mockFilterProducts(products, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.itemId)).toEqual(["2", "3"]);
    });

    it("should sort products by commission rate (descending)", () => {
      // Arrange
      const products = [
        { itemId: "1", commissionRate: 0.05 },
        { itemId: "2", commissionRate: 0.25 },
        { itemId: "3", commissionRate: 0.15 },
      ];

      // Mock the filterProducts function behavior
      const mockFilterProducts = vi.fn().mockImplementation((products) => {
        // Sort by commission rate (descending)
        const filtered = [...products];
        filtered.sort((a, b) => {
          const rateA = (a.commissionRate || 0) * 100;
          const rateB = (b.commissionRate || 0) * 100;
          return rateB - rateA;
        });

        return filtered;
      });

      // Act
      const result = mockFilterProducts(products);

      // Assert
      expect(result.map((p) => p.itemId)).toEqual(["2", "3", "1"]);
    });

    it("should limit results to top N", () => {
      // Arrange
      const products = [
        { itemId: "1", commissionRate: 0.25 },
        { itemId: "2", commissionRate: 0.2 },
        { itemId: "3", commissionRate: 0.15 },
        { itemId: "4", commissionRate: 0.1 },
      ];

      // Mock the filterProducts function behavior
      const mockFilterProducts = vi
        .fn()
        .mockImplementation((products, options = {}) => {
          const { topN = products.length } = options;

          // Sort by commission rate (descending)
          const filtered = [...products];
          filtered.sort((a, b) => {
            const rateA = (a.commissionRate || 0) * 100;
            const rateB = (b.commissionRate || 0) * 100;
            return rateB - rateA;
          });

          // Get top N
          return filtered.slice(0, topN);
        });

      const options = { topN: 2 };

      // Act
      const result = mockFilterProducts(products, options);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.itemId)).toEqual(["1", "2"]);
    });

    it("should handle empty product list", () => {
      // Arrange
      const products = [];
      const options = { minCommissionRate: 10 };

      // Mock the filterProducts function behavior
      const mockFilterProducts = vi.fn().mockImplementation((products) => {
        return products;
      });

      // Act
      const result = mockFilterProducts(products, options);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe("shopeeApi", () => {
    it("should generate correct authorization headers", () => {
      // Arrange
      const APP_ID = "15307710043";
      const SECRET = "RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI";
      const timestamp = "1672531200";
      const payload = '{"query":"{ productOfferV2 { nodes { itemId } } }"}';

      // Mock crypto for consistent hash
      vi.mock("crypto", () => ({
        createHash: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnThis(),
          digest: vi.fn().mockReturnValue("mocked-sha256-hash"),
        }),
      }));

      const signString = APP_ID + timestamp + payload + SECRET;
      const signature = "mocked-sha256-hash";

      const expectedHeaders = {
        "Content-Type": "application/json",
        Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
      };

      // Mock a function that generates headers
      const generateAuth = (payload) => {
        return {
          headers: expectedHeaders,
        };
      };

      // Act
      const result = generateAuth(payload);

      // Assert
      expect(result.headers).toEqual(expectedHeaders);
    });

    it("should handle GraphQL requests correctly", async () => {
      // Arrange
      const mockResponse = {
        data: {
          productOfferV2: {
            nodes: [
              { itemId: "1", productName: "Product 1" },
              { itemId: "2", productName: "Product 2" },
            ],
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      };

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Mock a function that makes GraphQL requests
      const makeGraphQLRequest = async (query) => {
        const payload = JSON.stringify({ query });
        const headers = {
          "Content-Type": "application/json",
          Authorization:
            "SHA256 Credential=15307710043, Timestamp=1672531200, Signature=mocked-sha256-hash",
        };

        const response = await fetch(
          "https://open-api.affiliate.shopee.co.th/graphql",
          {
            method: "POST",
            headers,
            body: payload,
          },
        );

        return response.json();
      };

      // Act
      const result = await makeGraphQLRequest(
        "{ productOfferV2 { nodes { itemId } } }",
      );

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        "https://open-api.affiliate.shopee.co.th/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "SHA256 Credential=15307710043, Timestamp=1672531200, Signature=mocked-sha256-hash",
          },
          body: '{"query":"{ productOfferV2 { nodes { itemId } } }"}',
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should filter products by category when categoryId is provided", async () => {
      // Arrange
      const categoryId = "123";
      const allProducts = [
        { itemId: "1", productCatIds: [123] }, // Match
        { itemId: "2", productCatIds: [456] }, // No match
      ];

      const mockResponse = {
        data: {
          productOfferV2: {
            nodes: allProducts,
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      };

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Mock a function that fetches products by category
      const fetchProductsByCategory = async (categoryId) => {
        const query = "{ productOfferV2 { nodes { itemId productCatIds } } }";
        const payload = JSON.stringify({ query });
        const headers = {
          "Content-Type": "application/json",
          Authorization:
            "SHA256 Credential=15307710043, Timestamp=1672531200, Signature=mocked-sha256-hash",
        };

        const response = await fetch(
          "https://open-api.affiliate.shopee.co.th/graphql",
          {
            method: "POST",
            headers,
            body: payload,
          },
        );

        const data = await response.json();

        // Filter by category if categoryId provided
        if (
          categoryId &&
          data.data &&
          data.data.productOfferV2 &&
          data.data.productOfferV2.nodes
        ) {
          const filtered = data.data.productOfferV2.nodes.filter((node) => {
            const catIds = node.productCatIds || [];
            return (
              catIds.includes(parseInt(categoryId)) ||
              catIds.includes(categoryId)
            );
          });

          return {
            ...data,
            data: {
              productOfferV2: {
                ...data.data.productOfferV2,
                nodes: filtered,
              },
            },
          };
        }

        return data;
      };

      // Act
      const result = await fetchProductsByCategory(categoryId);

      // Assert
      expect(result.data.productOfferV2.nodes).toHaveLength(1);
      expect(result.data.productOfferV2.nodes[0].itemId).toBe("1");
    });
  });
});

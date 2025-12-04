import axios from "axios";
import crypto from "crypto";

// Create axios instance with default configuration
const api = axios.create({
  baseURL: "https://affiliate.shopee.co.th/api/docs/v2",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log("=== SHOPEE API REQUEST ===");
    console.log("URL:", config.baseURL + config.url);
    console.log("Method:", config.method.toUpperCase());
    console.log("Headers:", JSON.stringify(config.headers, null, 2));
    console.log("Params:", JSON.stringify(config.params, null, 2));
    console.log("Data:", JSON.stringify(config.data, null, 2));
    console.time("API Request Time");
    return config;
  },
  (error) => {
    console.log("ERROR: Request interceptor error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log("=== SHOPEE API RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Headers:", JSON.stringify(response.headers, null, 2));
    console.log("Data keys:", Object.keys(response.data || {}));
    console.timeEnd("API Request Time");

    // Log only a subset of the response data to avoid cluttering logs
    if (response.data && response.data.products) {
      console.log("Products count:", response.data.products.length);
      if (response.data.products.length > 0) {
        console.log(
          "Sample product:",
          JSON.stringify(
            {
              id: response.data.products[0].itemId,
              name: response.data.products[0].name,
              price: response.data.products[0].price,
            },
            null,
            2,
          ),
        );
      }
    } else {
      console.log("Response data:", JSON.stringify(response.data, null, 2));
    }

    return response;
  },
  (error) => {
    console.log("=== SHOPEE API ERROR ===");
    console.log("Error message:", error.message);
    console.timeEnd("API Request Time");

    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log(
        "Response data:",
        JSON.stringify(error.response.data, null, 2),
      );
      console.log(
        "Response headers:",
        JSON.stringify(error.response.headers, null, 2),
      );
    } else if (error.request) {
      console.log("Request made but no response received");
    } else {
      console.log("Error setting up request:", error.message);
    }

    return Promise.reject(error);
  },
);

// Alternative implementation using GraphQL endpoint
const APP_ID = "15307710043";
const SECRET = "RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI";
const ENDPOINT = "https://open-api.affiliate.shopee.co.th/graphql";

// SHA256 hash function
function sha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

// Generate authorization signature
function generateAuth(payload) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signString = APP_ID + timestamp + payload + SECRET;
  const signature = sha256(signString);
  return {
    timestamp,
    signature,
    headers: {
      "Content-Type": "application/json",
      Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
    },
  };
}

// Fetch products by category (if supported by API)
// Note: Shopee API may require shopId/itemId, so this might need adjustment
export async function fetchProductsByCategory(
  categoryId,
  limit = 100,
  page = 1,
) {
  console.log("=== FETCH PRODUCTS BY CATEGORY ===");
  console.log("Parameters:", { categoryId, limit, page });

  const query = `
  {
    productOfferV2(limit: ${limit}, page: ${page}) {
      nodes {
        itemId
        productName
        commissionRate
        sellerCommissionRate
        shopeeCommissionRate
        commission
        price
        priceMax
        priceMin
        productCatIds
        sales
        ratingStar
        imageUrl
        shopId
        shopName
        productLink
        offerLink
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
  `;

  const payload = JSON.stringify({ query });
  const { headers } = generateAuth(payload);

  try {
    console.log("Making GraphQL request...");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload,
    });

    const data = await res.json();
    console.log("GraphQL response received");

    // Filter by category if categoryId provided
    if (
      categoryId &&
      data.data &&
      data.data.productOfferV2 &&
      data.data.productOfferV2.nodes
    ) {
      console.log("Filtering by category:", categoryId);
      const filtered = data.data.productOfferV2.nodes.filter((node) => {
        const catIds = node.productCatIds || [];
        return (
          catIds.includes(parseInt(categoryId)) || catIds.includes(categoryId)
        );
      });
      console.log(
        `Filtered from ${data.data.productOfferV2.nodes.length} to ${filtered.length} products`,
      );

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
  } catch (e) {
    console.error("GraphQL error:", e);
    return { error: e.toString() };
  }
}

// Fetch all products (without category filter - gets all available)
export async function fetchAllProducts(limit = 100, page = 1) {
  console.log("=== FETCH ALL PRODUCTS ===");
  console.log("Parameters:", { limit, page });

  const query = `
  {
    productOfferV2(limit: ${limit}, page: ${page}) {
      nodes {
        itemId
        productName
        commissionRate
        sellerCommissionRate
        shopeeCommissionRate
        commission
        price
        priceMax
        priceMin
        productCatIds
        sales
        ratingStar
        imageUrl
        shopId
        shopName
        productLink
        offerLink
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
  `;

  const payload = JSON.stringify({ query });
  const { headers } = generateAuth(payload);

  try {
    console.log("Making GraphQL request...");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload,
    });

    const data = await res.json();
    console.log("GraphQL response received");

    if (
      data.data &&
      data.data.productOfferV2 &&
      data.data.productOfferV2.nodes
    ) {
      console.log(`Found ${data.data.productOfferV2.nodes.length} products`);
    }

    return data;
  } catch (e) {
    console.error("GraphQL error:", e);
    return { error: e.toString() };
  }
}

// Fetch single product by shopId and itemId
export async function fetchProduct(shopId, itemId) {
  console.log("=== FETCH SINGLE PRODUCT ===");
  console.log("Parameters:", { shopId, itemId });

  const query = `
  {
    productOfferV2(shopId: ${shopId}, itemId: ${itemId}, limit: 1) {
      nodes {
        itemId
        productName
        commissionRate
        sellerCommissionRate
        shopeeCommissionRate
        commission
        price
        priceMax
        priceMin
        productCatIds
        sales
        ratingStar
        imageUrl
        shopId
        shopName
        productLink
        offerLink
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
  `;

  const payload = JSON.stringify({ query });
  const { headers } = generateAuth(payload);

  try {
    console.log("Making GraphQL request...");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload,
    });

    const data = await res.json();
    console.log("GraphQL response received");

    return data;
  } catch (e) {
    console.error("GraphQL error:", e);
    return { error: e.toString() };
  }
}

// Simple REST API functions for compatibility
export async function getProductList(params = {}) {
  console.log("=== GET PRODUCT LIST ===");
  console.log("Parameters:", params);

  try {
    const response = await api.get("/product/search", { params });
    console.log("Product list response:", response.status);
    return response.data;
  } catch (error) {
    console.error("Error fetching product list:", error);
    throw error;
  }
}

export async function getProductDetails(itemId, shopId) {
  console.log("=== GET PRODUCT DETAILS ===");
  console.log("Parameters:", { itemId, shopId });

  try {
    const response = await api.get("/product/detail", {
      params: { itemId, shopId },
    });
    console.log("Product details response:", response.status);
    return response.data;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
}

// Default export for compatibility
export default api;

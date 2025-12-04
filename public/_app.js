// Client-side logging utility
const logger = {
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message, data) => {
    console.warn(
      `[WARN] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  },
};

// API client with detailed logging
const apiClient = {
  // Get products
  async getProducts(file = "products.json") {
    logger.info("Fetching products", { file });
    try {
      const response = await fetch(`/api/products?file=${file}`);
      logger.info("Products response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Failed to load products", errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const products = await response.json();
      logger.info("Products loaded successfully", { count: products.length });
      return products;
    } catch (error) {
      logger.error("Error in getProducts", error);
      throw error;
    }
  },

  // Filter products
  async filterProducts(filters) {
    logger.info("Filtering products", filters);
    try {
      const response = await fetch("/api/filter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      logger.info("Filter response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Failed to filter products", errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      logger.info("Products filtered successfully", {
        totalMatches: data.totalMatches,
        returned: data.products.length,
      });
      return data;
    } catch (error) {
      logger.error("Error in filterProducts", error);
      throw error;
    }
  },

  // Fetch products from Shopee
  async fetchProducts(options = {}) {
    logger.info("Fetching products from Shopee", options);
    try {
      const response = await fetch("/api/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      logger.info("Fetch response", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error("Failed to fetch products from Shopee", errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();
      logger.info("Products fetched from Shopee successfully", data);
      return data;
    } catch (error) {
      logger.error("Error in fetchProducts", error);
      throw error;
    }
  },
};

// DOM elements
const resultsDiv = document.getElementById("results");
const statsDiv = document.getElementById("stats");
const fetchButton = document.getElementById("fetchButton");

// Add font family to root element
document.documentElement.style.fontFamily =
  "'IBM Plex Sans Thai Looped', sans-serif";
// Function to fetch products from Shopee API
async function fetchProducts() {
  logger.info("fetchProducts called");
  resultsDiv.innerHTML =
    '<div class="loading" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">⏳ Fetching products from Shopee...</div>';
  try {
    const data = await apiClient.fetchProducts();
    resultsDiv.innerHTML = `<div class="loading" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">✅ Successfully fetched ${data.count} products. Click "Load Products" to continue.</div>`;
    return data;
  } catch (error) {
    logger.error("Error in fetchProducts", error);
    resultsDiv.innerHTML = `<div class="error">❌ Error fetching products: ${error.message}</div>`;
    throw error;
  }
}

if (fetchButton) {
  fetchButton.addEventListener("click", async () => {
    await fetchProducts();
  });
}

// Load products function with detailed logging
async function loadProducts() {
  logger.info("loadProducts called");
  resultsDiv.innerHTML = '<div class="loading">⏳ Loading products...</div>';

  try {
    logger.info("Attempting to load products from API");
    const allProducts = await apiClient.getProducts();
    resultsDiv.innerHTML = `<div class="loading" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">✅ Loaded ${allProducts.length} products. Click "Apply Filters" to see results.</div>`;
    return allProducts;
  } catch (error) {
    logger.error("Error loading products", error);
    resultsDiv.innerHTML = `<div class="error" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">❌ Error: ${error.message}. Make sure you've run "Fetch Products" first.</div>`;
    return [];
  }
}

// Apply filters function with detailed logging
async function applyFilters() {
  logger.info("applyFilters called");

  let allProducts = [];

  // Check if we have products loaded
  if (window.allProducts && window.allProducts.length > 0) {
    logger.info("Using already loaded products");
    allProducts = window.allProducts;
  } else {
    logger.info("Loading products before filtering");
    allProducts = await loadProducts();
    window.allProducts = allProducts;
  }

  if (allProducts.length === 0) {
    logger.warn("No products available for filtering");
    return;
  }

  resultsDiv.innerHTML =
    '<div class="loading" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">⏳ Filtering products...</div>';

  const filters = {
    minCommissionRate:
      parseFloat(document.getElementById("minCommissionRate").value) || 0,
    maxCommissionRate:
      parseFloat(document.getElementById("maxCommissionRate").value) || 100,
    minPrice: parseFloat(document.getElementById("minPrice").value) || 0,
    maxPrice: document.getElementById("maxPrice").value
      ? parseFloat(document.getElementById("maxPrice").value)
      : Infinity,
    minSellerRate:
      parseFloat(document.getElementById("minSellerRate").value) || 0,
    sortBy: document.getElementById("sortBy").value,
    sortOrder: document.getElementById("sortOrder").value,
    limit: parseInt(document.getElementById("limit").value) || 100,
  };

  logger.info("Filter parameters", filters);

  try {
    const data = await apiClient.filterProducts(filters);
    displayResults(data);
  } catch (error) {
    logger.error("Error applying filters", error);
    resultsDiv.innerHTML = `<div class="error" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">❌ Error: ${error.message}</div>`;
  }
}

// Display results function
function displayResults(data) {
  logger.info("displayResults called", { total: data.total });
  const { products, stats } = data;

  // Display statistics
  statsDiv.style.display = "grid";
  resultsDiv.innerHTML = `
  <div class="stat-card" style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
    <h3>Total Matches</h3>
    <div class="value">${stats.total}</div>
  </div>
  <div class="stat-card" style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
    <h3>Avg Commission Rate</h3>
    <div class="value">${stats.averageCommissionRate}%</div>
  </div>
  <div class="stat-card" style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
    <h3>Highest Rate</h3>
    <div class="value">${stats.highestCommissionRate}%</div>
  </div>
  <div class="stat-card" style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
    <h3>Avg Price</h3>
    <div class="value">${parseFloat(stats.averagePrice).toLocaleString()} ฿</div>
  </div>
`;

  if (products.length === 0) {
    resultsDiv.innerHTML =
      '<div class="no-results" style="font-family: \'IBM Plex Sans Thai Looped\', sans-serif;">No products match your filters. Try adjusting your criteria.</div>';
    return;
  }

  // Display products table
  let html = `
    <h2 style="margin: 30px 0 20px 0; font-family: 'IBM Plex Sans Thai Looped', sans-serif;">📦 Products (${products.length})</h2>
    <div style="overflow-x: auto;">
      <table class="products-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Commission Rate</th>
            <th>Seller Rate</th>
            <th>Shopee Rate</th>
            <th>Price</th>
            <th>Commission</th>
            <th>Sales</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
  `;

  products.forEach((product) => {
    const commissionRate = (product.commissionRate || 0) * 100;
    const sellerRate = (product.sellerCommissionRate || 0) * 100;
    const shopeeRate = (product.shopeeCommissionRate || 0) * 100;

    let badgeClass = "badge-low";
    if (commissionRate >= 10) badgeClass = "badge-high";
    else if (commissionRate >= 5) badgeClass = "badge-medium";

    html += `      <tr style="font-family: 'IBM Plex Sans Thai Looped', sans-serif;">
        <td><img src="${product.imageUrl || ""}" alt="${product.name}" onerror="this.style.display='none'"></td>
        <td><strong>${product.name || "N/A"}</strong></td>
        <td><span class="badge ${badgeClass}">${commissionRate.toFixed(2)}%</span></td>
        <td>${sellerRate.toFixed(2)}%</td>
        <td>${shopeeRate.toFixed(2)}%</td>
        <td>${(product.price || 0).toLocaleString()} ฿</td>
        <td>${(product.commission || 0).toLocaleString()} ฿</td>
        <td>${(product.sales || 0).toLocaleString()}</td>
        <td><a href="${product.productLink || "#"}" target="_blank" class="product-link">View →</a></td>
      </tr>`;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  resultsDiv.innerHTML = html;
  logger.info("Results displayed successfully");
}

// Reset filters function
function resetFilters() {
  logger.info("resetFilters called");
  document.getElementById("minCommissionRate").value = 0;
  document.getElementById("maxCommissionRate").value = 100;
  document.getElementById("minPrice").value = 0;
  document.getElementById("maxPrice").value = "";
  document.getElementById("minSellerRate").value = 0;
  document.getElementById("sortBy").value = "commissionRate";
  document.getElementById("sortOrder").value = "desc";
  document.getElementById("limit").value = 100;
}

// Initialize app
window.addEventListener("load", () => {
  logger.info("App initialized");
  // Don't automatically load products on page load
  // Users should click "Load Products" or "Fetch Products" explicitly
});

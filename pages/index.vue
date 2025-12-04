<template>
  <div>
    <header class="header">
      <div class="container">
        <h1>Shopee Product Commission Analyzer</h1>
        <p class="subtitle">Find high-commission products to maximize your affiliate earnings</p>
      </div>
    </header>

    <div class="container">
      <div class="controls">
        <div class="filter-controls">
          <div class="form-group">
            <label>Min Commission Rate (%)</label>
            <input v-model.number="filters.minCommissionRate" type="number" min="0" max="100" step="0.1" />
          </div>
          <div class="form-group">
            <label>Max Commission Rate (%)</label>
            <input v-model.number="filters.maxCommissionRate" type="number" min="0" max="100" step="0.1" />
          </div>
          <div class="form-group">
            <label>Min Price (฿)</label>
            <input v-model.number="filters.minPrice" type="number" min="0" step="1" />
          </div>
          <div class="form-group">
            <label>Max Price (฿)</label>
            <input v-model.number="filters.maxPrice" type="number" min="0" step="1" />
          </div>
          <div class="form-group">
            <label>Sort By</label>
            <select v-model="filters.sortBy">
              <option value="commissionRate">Commission Rate</option>
              <option value="price">Price</option>
              <option value="sales">Sales</option>
              <option value="commission">Commission</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sort Order</label>
            <select v-model="filters.sortOrder">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          <div class="form-group">
            <label>Results Limit</label>
            <input v-model.number="filters.limit" type="number" min="1" max="1000" step="10" />
          </div>
        </div>

        <div class="button-group">
          <button @click="fetchProducts" :disabled="loading">🔄 Fetch Products</button>
          <button @click="loadProducts" :disabled="loading">📋 Load Products</button>
          <button @click="applyFilters" :disabled="loading">🔍 Apply Filters</button>
          <button @click="resetFilters">🔄 Reset Filters</button>
        </div>
      </div>

      <div v-if="stats" class="stats">
        <div class="stat-card">
          <h3>Total Matches</h3>
          <div class="value">{{ stats.total }}</div>
        </div>
        <div class="stat-card">
          <h3>Avg Commission Rate</h3>
          <div class="value">{{ stats.averageCommissionRate }}%</div>
        </div>
        <div class="stat-card">
          <h3>Highest Rate</h3>
          <div class="value">{{ stats.highestCommissionRate }}%</div>
        </div>
        <div class="stat-card">
          <h3>Avg Price</h3>
          <div class="value">{{ parseFloat(stats.averagePrice).toLocaleString() }} ฿</div>
        </div>
      </div>

      <div class="results">
        <div v-if="loading" class="loading">⏳ {{ loadingMessage }}</div>
        <div v-else-if="error" class="error">❌ {{ error }}</div>
        <div v-else-if="products.length === 0" class="no-results">
          Welcome! Click "Fetch Products" to get latest products from Shopee, or "Load Products" to view existing data.
        </div>
        <div v-else>
          <h2 style="margin: 30px 0 20px 0;">📦 Products ({{ products.length }})</h2>
          <div style="overflow-x: auto;">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Commission Rate</th>
                  <th>Price</th>
                  <th>Commission</th>
                  <th>Sales</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in products" :key="product.itemId">
                  <td><img :src="product.imageUrl" :alt="product.name" @error="$event.target.style.display='none'" /></td>
                  <td><strong>{{ product.name || product.productName }}</strong></td>
                  <td>
                    <span :class="['badge', getBadgeClass((product.commissionRate || 0) * 100)]">
                      {{ ((product.commissionRate || 0) * 100).toFixed(2) }}%
                    </span>
                  </td>
                  <td>{{ (product.price || 0).toLocaleString() }} ฿</td>
                  <td>{{ (product.commission || 0).toLocaleString() }} ฿</td>
                  <td>{{ (product.sales || 0).toLocaleString() }}</td>
                  <td><a :href="product.productLink" target="_blank" class="product-link">View →</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(false);
const loadingMessage = ref('');
const error = ref('');
const products = ref<any[]>([]);
const allProducts = ref<any[]>([]);
const stats = ref<any>(null);

const filters = ref({
  minCommissionRate: 0,
  maxCommissionRate: 100,
  minPrice: 0,
  maxPrice: null as number | null,
  sortBy: 'commissionRate',
  sortOrder: 'desc',
  limit: 100
});

async function fetchProducts() {
  loading.value = true;
  loadingMessage.value = 'Fetching products from Shopee...';
  error.value = '';

  try {
    const data = await $fetch('/api/fetch', {
      method: 'POST',
      body: {}
    });
    loadingMessage.value = `Successfully fetched ${data.count} products. Click "Load Products" to continue.`;
  } catch (e: any) {
    error.value = `Error fetching products: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

async function loadProducts() {
  loading.value = true;
  loadingMessage.value = 'Loading products...';
  error.value = '';

  try {
    const data = await $fetch('/api/products');
    allProducts.value = data as any[];
    loadingMessage.value = `Loaded ${allProducts.value.length} products. Click "Apply Filters" to see results.`;
  } catch (e: any) {
    error.value = `Error loading products: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  if (allProducts.value.length === 0) {
    error.value = 'No products loaded. Please load products first.';
    return;
  }

  loading.value = true;
  loadingMessage.value = 'Filtering products...';
  error.value = '';

  try {
    // Client-side filtering
    let filtered = allProducts.value.filter(p => {
      const commissionRate = (p.commissionRate || 0) * 100;
      const price = p.price || 0;

      return commissionRate >= filters.value.minCommissionRate &&
             commissionRate <= filters.value.maxCommissionRate &&
             price >= filters.value.minPrice &&
             (filters.value.maxPrice === null || price <= filters.value.maxPrice);
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (filters.value.sortBy) {
        case 'commissionRate':
          aVal = (a.commissionRate || 0) * 100;
          bVal = (b.commissionRate || 0) * 100;
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'commission':
          aVal = a.commission || 0;
          bVal = b.commission || 0;
          break;
        case 'sales':
          aVal = a.sales || 0;
          bVal = b.sales || 0;
          break;
        default:
          aVal = (a.commissionRate || 0) * 100;
          bVal = (b.commissionRate || 0) * 100;
      }

      return filters.value.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Statistics
    const totalMatches = filtered.length;
    stats.value = {
      total: totalMatches,
      averageCommissionRate: totalMatches > 0
        ? (filtered.reduce((sum, p) => sum + (p.commissionRate || 0), 0) / totalMatches * 100).toFixed(2)
        : 0,
      highestCommissionRate: totalMatches > 0
        ? (Math.max(...filtered.map(p => p.commissionRate || 0)) * 100).toFixed(2)
        : 0,
      averagePrice: totalMatches > 0
        ? (filtered.reduce((sum, p) => sum + (p.price || 0), 0) / totalMatches).toFixed(2)
        : 0
    };

    // Limit results
    products.value = filtered.slice(0, filters.value.limit);
  } catch (e: any) {
    error.value = `Error filtering products: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.value = {
    minCommissionRate: 0,
    maxCommissionRate: 100,
    minPrice: 0,
    maxPrice: null,
    sortBy: 'commissionRate',
    sortOrder: 'desc',
    limit: 100
  };
}

function getBadgeClass(rate: number) {
  if (rate >= 10) return 'badge-high';
  if (rate >= 5) return 'badge-medium';
  return 'badge-low';
}
</script>

<style scoped>
/* Font family is already defined in main.css, but adding explicit declaration for this component */
.header, .container, .controls, .filter-controls, .form-group,
label, input, select, button, .button-group, .stats, .stat-card,
.stat-card h3, .value, .results, .loading, .no-results,
.error, .products-table, .products-table th, .products-table td,
.products-table tr, .products-table img, .badge, .product-link {
  font-family: "IBM Plex Sans Thai Looped", sans-serif;
}
.header {
  background-color: #ee4d2d;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  text-align: center;
  opacity: 0.9;
}

.controls {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #555;
}

input, select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  background-color: #ee4d2d;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #d93815;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-card h3 {
  color: #555;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #ee4d2d;
}

.results {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  min-height: 100px;
}

.loading, .no-results {
  text-align: center;
  padding: 20px;
  font-size: 1.1rem;
  color: #666;
}

.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.products-table th {
  background-color: #f5f5f5;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #ee4d2d;
}

.products-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.products-table tr:hover {
  background-color: #f9f9f9;
}

.products-table img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
}

.badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}

.badge-low {
  background-color: #66bb6a;
}

.badge-medium {
  background-color: #ffa726;
}

.badge-high {
  background-color: #ef5350;
}

.product-link {
  color: #ee4d2d;
  text-decoration: none;
  font-weight: 600;
}

.product-link:hover {
  text-decoration: underline;
}
</style>

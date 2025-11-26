import crypto from 'crypto';
// Using Node.js built-in fetch (available in Node 18+)

const APP_ID = "15307710043";
const SECRET = "RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI";
const ENDPOINT = "https://open-api.affiliate.shopee.co.th/graphql";

// SHA256 hash function
function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
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
      "Authorization": `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`
    }
  };
}

// Fetch products by category (if supported by API)
// Note: Shopee API may require shopId/itemId, so this might need adjustment
export async function fetchProductsByCategory(categoryId, limit = 100, page = 1) {
  // Try with categoryId first, fallback to filtering by productCatIds
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
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload
    });
    const data = await res.json();
    
    // Filter by category if categoryId provided
    if (categoryId && data.data && data.data.productOfferV2 && data.data.productOfferV2.nodes) {
      const filtered = data.data.productOfferV2.nodes.filter(node => {
        const catIds = node.productCatIds || [];
        return catIds.includes(parseInt(categoryId)) || catIds.includes(categoryId);
      });
      return {
        ...data,
        data: {
          productOfferV2: {
            ...data.data.productOfferV2,
            nodes: filtered
          }
        }
      };
    }
    
    return data;
  } catch (e) {
    return { error: e.toString() };
  }
}

// Fetch all products (without category filter - gets all available)
export async function fetchAllProducts(limit = 100, page = 1) {
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
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { error: e.toString() };
  }
}

// Fetch single product by shopId and itemId
export async function fetchProduct(shopId, itemId) {
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
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: payload
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { error: e.toString() };
  }
}


import axios from 'axios';
import crypto from 'crypto';

// Alternative implementation using GraphQL endpoint
const APP_ID = '15307710043';
const SECRET = 'RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI';
const ENDPOINT = 'https://open-api.affiliate.shopee.co.th/graphql';

// SHA256 hash function
function sha256(str: string): string {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

// Generate authorization signature
function generateAuth(payload: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signString = APP_ID + timestamp + payload + SECRET;
    const signature = sha256(signString);
    return {
        timestamp,
        signature,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
        },
    };
}

// Fetch all products (without category filter - gets all available)
export async function fetchAllProducts(limit = 100, page = 1) {
    console.log('=== FETCH ALL PRODUCTS ===');
    console.log('Parameters:', { limit, page });

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
        console.log('Making GraphQL request...');
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers,
            body: payload,
        });

        const data = await res.json();
        console.log('GraphQL response received');

        if (
            data.data &&
            data.data.productOfferV2 &&
            data.data.productOfferV2.nodes
        ) {
            console.log(`Found ${data.data.productOfferV2.nodes.length} products`);
        }

        return data;
    } catch (e) {
        console.error('GraphQL error:', e);
        return { error: e.toString() };
    }
}

// Fetch products by category (if supported by API)
export async function fetchProductsByCategory(
    categoryId: string | number,
    limit = 100,
    page = 1,
) {
    console.log('=== FETCH PRODUCTS BY CATEGORY ===');
    console.log('Parameters:', { categoryId, limit, page });

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
        console.log('Making GraphQL request...');
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers,
            body: payload,
        });

        const data = await res.json();
        console.log('GraphQL response received');

        // Filter by category if categoryId provided
        if (
            categoryId &&
            data.data &&
            data.data.productOfferV2 &&
            data.data.productOfferV2.nodes
        ) {
            console.log('Filtering by category:', categoryId);
            const filtered = data.data.productOfferV2.nodes.filter((node: any) => {
                const catIds = node.productCatIds || [];
                return (
                    catIds.includes(parseInt(categoryId as string)) || catIds.includes(categoryId)
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
        console.error('GraphQL error:', e);
        return { error: e.toString() };
    }
}

import { fetchAllProducts, fetchProductsByCategory } from './shopeeApi';

// Configuration from Environment Variables
const LIMIT = parseInt(process.env.PIPELINE_LIMIT || '50', 10);
const MAX_PAGES = parseInt(process.env.PIPELINE_MAX_PAGES || '5', 10);

export async function fetchAllPages(categoryId: string | null = null) {
    console.log('=== FETCH ALL PAGES STARTED ===');
    console.log('Parameters:', {
        categoryId,
        LIMIT,
        MAX_PAGES,
        isProduction: process.env.NODE_ENV === 'production',
    });

    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;
    let totalFetched = 0;

    try {
        while (hasMore && page <= MAX_PAGES) {
            console.log(`Fetching page ${page} of ${MAX_PAGES}...`);
            const startTime = Date.now();

            // Fetch products from API using GraphQL
            let response;
            if (categoryId) {
                response = await fetchProductsByCategory(categoryId, LIMIT, page);
            } else {
                response = await fetchAllProducts(LIMIT, page);
            }

            const elapsedTime = Date.now() - startTime;
            console.log(`Page ${page} fetched in ${elapsedTime}ms`);

            // Check response structure for GraphQL
            if (!response || !response.data || !response.data.productOfferV2) {
                console.log('Invalid GraphQL response:', JSON.stringify(response, null, 2));
                hasMore = false;
                break;
            }

            const { nodes: products, pageInfo } = response.data.productOfferV2;
            const hasMorePages = pageInfo ? pageInfo.hasNextPage : false;

            if (!products || products.length === 0) {
                console.log('No products found in response');
                hasMore = false;
                break;
            }

            console.log(`Found ${products.length} products on page ${page}`);

            // Add page info to each product for debugging
            const productsWithPageInfo = products.map((product: any) => ({
                ...product,
                // Map GraphQL fields to expected format if necessary
                name: product.productName, // Map productName to name
                categoryIds: product.productCatIds, // Map productCatIds to categoryIds
                _fetchPage: page,
                _fetchTime: new Date().toISOString(),
            }));

            allProducts = [...allProducts, ...productsWithPageInfo];
            totalFetched += products.length;

            hasMore = hasMorePages && page < MAX_PAGES;
            page++;

            // Log a sample product from this page
            if (products.length > 0) {
                console.log(
                    'Sample product from page',
                    page - 1,
                    ':',
                    JSON.stringify(
                        {
                            id: products[0].itemId,
                            name: products[0].productName,
                            commissionRate: products[0].commissionRate,
                            price: products[0].price,
                        },
                        null,
                        2,
                    ),
                );
            }
        }

        console.log(`Total products fetched: ${totalFetched}`);
        console.log('=== FETCH ALL PAGES COMPLETED ===');
        return allProducts;

    } catch (error: any) {
        console.log('ERROR: Exception in fetchAllPages');
        console.log('Error type:', typeof error);
        console.log('Error name:', error.name);
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);

        if (error.response) {
            console.log(
                'Response data:',
                JSON.stringify(error.response.data, null, 2),
            );
            console.log('Response status:', error.response.status);
            console.log(
                'Response headers:',
                JSON.stringify(error.response.headers, null, 2),
            );
        }

        console.log('=== FETCH ALL PAGES FAILED ===');
        throw error;
    }
}

// Filter products function
export function filterProducts(products: any[], options: any = {}) {
    const {
        minCommissionRate = 0,
        minPrice = 0,
        maxPrice = Infinity,
        minCommission = 0,
        topN = 20
    } = options;

    // Filter products
    let filtered = products.filter(p => {
        const commissionRate = (p.commissionRate || 0) * 100; // Convert to percentage
        const price = p.price || 0;
        const commission = p.commission || 0;

        return commissionRate >= minCommissionRate &&
            price >= minPrice &&
            price <= maxPrice &&
            commission >= minCommission;
    });

    // Sort by commission rate (descending)
    filtered.sort((a, b) => {
        const rateA = (a.commissionRate || 0) * 100;
        const rateB = (b.commissionRate || 0) * 100;
        return rateB - rateA;
    });

    // Get top N
    return filtered.slice(0, topN);
}

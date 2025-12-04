import { createApp } from 'vue'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'

/**
 * Creates a mock app context for testing
 */
export function createMockContext() {
  const app = createApp({})
  const router = createRouter({
    history: createWebHistory(),
    routes: []
  })

  app.use(router)
  app.use(createTestingPinia())

  return {
    app,
    router
  }
}

/**
 * Creates a mock API response
 */
export function createMockApiResponse<T>(data: T, status = 200, statusText = 'OK') {
  return {
    data,
    status,
    statusText,
    headers: {},
    config: {}
  }
}

/**
 * Creates a mock error response
 */
export function createMockError(message: string, status = 500) {
  const error = new Error(message) as any
  error.response = {
    status,
    statusText: 'Error',
    data: { error: message }
  }
  return error
}

/**
 * Wait for a specified amount of time (useful for testing async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Creates a partial mock of a product
 */
export function createMockProduct(overrides: Record<string, any> = {}) {
  return {
    itemId: '12345',
    productName: 'Test Product',
    commissionRate: 0.1,
    sellerCommissionRate: 0.08,
    shopeeCommissionRate: 0.02,
    commission: 50,
    price: 500,
    priceMax: 500,
    priceMin: 500,
    productCatIds: [1, 2],
    sales: 100,
    ratingStar: 4.5,
    imageUrl: 'https://example.com/image.jpg',
    shopId: '67890',
    shopName: 'Test Shop',
    productLink: 'https://example.com/product',
    offerLink: 'https://example.com/offer',
    ...overrides
  }
}

/**
 * Creates a GraphQL response structure
 */
export function createMockGraphQLResponse<T>(nodes: T, hasNextPage = false) {
  return {
    data: {
      productOfferV2: {
        nodes: Array.isArray(nodes) ? nodes : [nodes],
        pageInfo: {
          hasNextPage
        }
      }
    }
  }
}

/**
 * Creates a mock API event for Nuxt handlers
 */
export function createMockEvent(overrides: Record<string, any> = {}) {
  return {
    node: {
      req: {
        headers: {},
        url: '/'
      },
      res: {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        end: vi.fn()
      }
    },
    // Methods from Nuxt event
    readBody: vi.fn().mockResolvedValue({}),
    setHeader: vi.fn(),
    // Custom overrides
    ...overrides
  }
}

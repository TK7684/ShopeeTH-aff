// Export all API routes to ensure they're properly included in the build
export { default as productsHandler } from './api/products.get'
export { default as fetchHandler } from './api/fetch.post'
export { default as cronHandler } from './api/cron.get'

// Main server handler that routes requests to appropriate API handlers
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = new URL(url).pathname

  // Route requests to appropriate handlers
  try {
    switch (path) {
      case '/api/products':
        return await productsHandler(event)

      case '/api/fetch':
        return await fetchHandler(event)

      case '/api/cron':
        return await cronHandler(event)

      default:
        // For other paths, return 404
        throw createError({
          statusCode: 404,
          statusMessage: 'Not Found'
        })
    }
  } catch (error) {
    console.error('Server error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
```

This creates a main server index file that explicitly exports and routes all API requests, which should help with the Vercel deployment issues. It will:

1. Import all API route handlers
2. Create a main request handler that routes based on the pathname
3. Ensure all routes are properly registered with Vercel's serverless functions

This approach bypasses any potential issues with automatic route detection in Nuxt 3 on Vercel.

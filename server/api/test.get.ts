export default defineEventHandler(async (event) => {
  return {
    message: 'API test route is working',
    timestamp: new Date().toISOString()
  }
})

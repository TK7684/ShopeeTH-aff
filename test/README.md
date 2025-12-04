# Shopee Product Analyzer - Test Suite

This directory contains a comprehensive test suite for the Shopee Product Analyzer API. The test suite includes unit tests, API endpoint tests, and integration tests to ensure the reliability and correctness of the application.

## Test Structure

```
test/
├── api/                # API endpoint tests
│   ├── cron.get.test.ts
│   ├── fetch.post.test.ts
│   ├── products.get.test.ts
│   └── test.get.test.ts
├── integration/        # Integration tests
│   └── api-flow.test.ts
├── unit/               # Unit tests for utility functions
│   ├── fetchProducts.test.ts
│   └── shopeeApi.test.ts
├── utils/              # Test utilities and helpers
│   └── helpers.ts
├── setup/              # Test setup files
│   └── index.ts
└── reports/            # Test reports and coverage
```

## Running Tests

### Quick Start

To run all tests:

```bash
npm test
```

### Running Specific Test Suites

Run only API tests:
```bash
npm run test:api
```

Run only unit tests:
```bash
npm run test:unit
```

Run only integration tests:
```bash
npm run test:integration
```

### Additional Options

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with UI interface:
```bash
npm run test:ui
```

Run all tests with verbose output:
```bash
node run-tests.js --verbose
```

### Using the Test Runner Script

The `run-tests.js` script provides additional flexibility for running tests:

```bash
# Run all tests
node run-tests.js

# Run specific test types
node run-tests.js --api-only
node run-tests.js --unit-only
node run-tests.js --integration-only

# Run with coverage
node run-tests.js --coverage

# Run in watch mode
node run-tests.js --watch

# Run with UI
node run-tests.js --ui

# Show help
node run-tests.js --help
```

## Test Coverage

The test suite covers:

1. **API Endpoints**
   - `/api/test.get` - Basic connectivity test
   - `/api/products.get` - Product retrieval with caching
   - `/api/fetch.post` - Product fetching with filtering
   - `/api/cron.get` - Pipeline execution and Google Sheets upload

2. **Utility Functions**
   - `fetchAllPages` - Fetching products from multiple pages
   - `filterProducts` - Filtering products based on criteria
   - `fetchAllProducts` - Shopee API integration
   - `fetchProductsByCategory` - Category-based product fetching

3. **Integration Flows**
   - Complete fetch-filter-upload pipeline
   - Error handling across the entire API
   - Edge cases and boundary conditions

## Mock Strategy

The tests use a comprehensive mocking strategy to avoid external API calls:

- External API calls (Shopee API) are mocked
- Google Sheets integration is mocked
- Console outputs are suppressed in tests
- Date/time functions are mocked for consistent test results

## Writing New Tests

When adding new tests:

1. Follow the existing file structure
2. Use the helpers in `test/utils/helpers.ts` for common mock objects
3. Ensure all external dependencies are mocked
4. Test both success and error cases
5. Include edge cases and boundary conditions
6. Add descriptive test names and comments

## Debugging Failed Tests

1. Run the specific test file:
   ```bash
   npm run test:run test/unit/fetchProducts.test.ts
   ```

2. Use the UI for better visualization:
   ```bash
   npm run test:ui
   ```

3. Run with verbose output:
   ```bash
   node run-tests.js --verbose
   ```

4. Check the coverage report to see which lines are not tested:
   ```bash
   npm run test:coverage
   ```

## CI/CD Integration

These tests are designed to run in CI/CD environments:

- They have no external dependencies
- All external API calls are mocked
- Tests complete quickly
- Results are output in standard formats

To integrate with CI, simply run `npm test` as part of your CI pipeline.
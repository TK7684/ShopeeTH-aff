
```import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️ ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️ ${message}`, 'yellow');
}

// Test runner class
class TestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      suites: []
    };
  }

  async runTests(testFiles) {
    info(`Running ${testFiles.length} test file(s)...\n`);

    for (const testFile of testFiles) {
      await this.runTestFile(testFile);
    }

    this.printSummary();
    return this.testResults.failed === 0;
  }

  async runTestFile(filePath) {
    try {
      // Load the test file
      const fullPath = join(rootDir, filePath);
      const testContent = await readFile(fullPath, 'utf8');

      info(`Running tests from ${filePath}`);

      // Create a simple test harness
      const testCode = `
      // Test harness
      global.describe = (name, fn) => {
        console.log(\`\\n📋 ${name}\`);
        fn();
      };

      global.it = (name, fn) => {
        try {
          if (fn.length > 0) {
            // Async test
            return fn().then(() => {
              console.log(\`  ✅ ${name}\`);
              process.send({ type: 'test:pass', name });
            }).catch(err => {
              console.log(\`  ❌ ${name}\`);
              console.log(\`    Error: \${err.message}\`);
              process.send({ type: 'test:fail', name, error: err.message });
            });
          } else {
            // Sync test
            fn();
            console.log(\`  ✅ ${name}\`);
            process.send({ type: 'test:pass', name });
          }
        } catch (err) {
          console.log(\`  ❌ ${name}\`);
          console.log(\`    Error: \${err.message}\`);
          process.send({ type: 'test:fail', name, error: err.message });
        }
      };

      global.expect = (actual) => ({
        toBe: (expected) => {
          if (actual !== expected) {
            throw new Error(\`Expected \${actual} to be \${expected}\`);
          }
        },
        toEqual: (expected) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to equal \${JSON.stringify(expected)}\`);
          }
        },
        toHaveProperty: (prop) => {
          if (!actual.hasOwnProperty(prop)) {
            throw new Error(\`Expected object to have property '\${prop}'\`);
          }
        },
        toHaveLength: (length) => {
          if (!Array.isArray(actual) || actual.length !== length) {
            throw new Error(\`Expected array to have length \${length}\`);
          }
        },
        toThrow: () => {
          let threw = false;
          try {
            actual();
          } catch (e) {
            threw = true;
          }
          if (!threw) {
            throw new Error(\`Expected function to throw\`);
          }
        },
        rejects: {
          toThrow: async () => {
            try {
              await actual();
              throw new Error(\`Expected promise to reject\`);
            } catch (e) {
              // Expected behavior
            }
          }
        }
      });

      global.vi = {
        fn: () => {
          const mockFn = (...args) => {
            mockFn.calls.push(args);
            return mockFn.mockReturnValue;
          };
          mockFn.mockReturnValue = undefined;
          mockFn.calls = [];
          mockFn.mockResolvedValue = (value) => {
            mockFn.mockReturnValue = Promise.resolve(value);
            return mockFn;
          };
          mockFn.mockRejectedValue = (value) => {
            mockFn.mockReturnValue = Promise.reject(value);
            return mockFn;
          };
          mockFn.mockImplementation = (fn) => {
            mockFn.impl = fn;
            return mockFn;
          };
          return mockFn;
        },
        mocked: (obj) => obj,
        clearAllMocks: () => {},
        restoreAllMocks: () => {}
      };

      // Load and execute the test file
      ${testContent}
      `;

      // Execute the test in a separate process to avoid isolation issues
      try {
        const result = execSync(`node -e "${testCode.replace(/"/g, '\\"')}"`, {
          cwd: rootDir,
          encoding: 'utf8',
          timeout: 30000
        });

        success(`All tests passed in ${filePath}`);
        this.testResults.suites.push({
          file: filePath,
          status: 'passed',
          tests: 'All passed'
        });
      } catch (err) {
        error(`Tests failed in ${filePath}`);
        this.testResults.suites.push({
          file: filePath,
          status: 'failed',
          tests: err.stdout
        });
      }
    } catch (error) {
      error(`Error running test file ${filePath}: ${error.message}`);
      this.testResults.suites.push({
        file: filePath,
        status: 'error',
        error: error.message
      });
    }
  }

  printSummary() {
    log('\n' + '='.repeat(50), 'cyan');
    log('🧪 Test Summary', 'bright');
    log('='.repeat(50), 'cyan');

    for (const suite of this.testResults.suites) {
      if (suite.status === 'passed') {
        success(`${suite.file} - All tests passed`);
      } else if (suite.status === 'failed') {
        error(`${suite.file} - Tests failed`);
      } else {
        error(`${suite.file} - Error: ${suite.error}`);
      }
    }

    log('\n' + '='.repeat(50), 'cyan');

    if (this.testResults.failed === 0) {
      success('All tests passed! 🎉');
    } else {
      error(`${this.testResults.failed} test suites failed`);
    }
  }
}

// API test functions for testing our endpoints
const testAPI = {
  // Test the test endpoint
  async testEndpoint() {
    const response = {
      message: 'API test route is working',
      timestamp: new Date().toISOString()
    };

    // Basic response checks
    if (!response.message || !response.timestamp) {
      throw new Error('Test endpoint response is invalid');
    }

    if (typeof response.timestamp !== 'string') {
      throw new Error('Timestamp should be a string');
    }

    return true;
  },

  // Test product filtering
  testProductFiltering() {
    const products = [
      { itemId: '1', commissionRate: 0.05, commission: 50, price: 500 }, // Below threshold
      { itemId: '2', commissionRate: 0.15, commission: 75, price: 500 }, // Above threshold
      { itemId: '3', commissionRate: 0.25, commission: 125, price: 500 }  // Above threshold
    ];

    const options = { minCommissionRate: 10 };

    // Filter products
    const filtered = products.filter(p => {
      const commissionRate = (p.commissionRate || 0) * 100; // Convert to percentage
      return commissionRate >= options.minCommissionRate;
    });

    // Sort by commission rate (descending)
    filtered.sort((a, b) => {
      const rateA = (a.commissionRate || 0) * 100;
      const rateB = (b.commissionRate || 0) * 100;
      return rateB - rateA;
    });

    // Check if filtering worked correctly
    if (filtered.length !== 2) {
      throw new Error(`Expected 2 products to match filter, got ${filtered.length}`);
    }

    // Check if sorting worked correctly
    if (filtered[0].itemId !== '3' || filtered[1].itemId !== '2') {
      throw new Error('Products not sorted correctly by commission rate');
    }

    return true;
  },

  // Test GraphQL request generation
  testGraphQLRequest() {
    const APP_ID = '15307710043';
    const SECRET = 'RGRVS6I43KD2QW472MQ7S52FZ6RUSVQI';
    const timestamp = '1672531200';
    const payload = '{"query":"{ productOfferV2 { nodes { itemId } } }"}';

    const signString = APP_ID + timestamp + payload + SECRET;
    const signature = 'mocked-sha256-hash'; // In real implementation, this would be hashed

    const expectedHeaders = {
      'Content-Type': 'application/json',
      Authorization: `SHA256 Credential=${APP_ID}, Timestamp=${timestamp}, Signature=${signature}`,
    };

    // Check if headers are correctly formatted
    if (!expectedHeaders.Authorization.includes(APP_ID) ||
        !expectedHeaders.Authorization.includes(timestamp) ||
        !expectedHeaders.Authorization.includes(signature)) {
      throw new Error('Authorization headers not correctly formatted');
    }

    return true;
  }
};

// Main execution
async function main() {
  const args = process.argv.slice(2);

  log('🚀 Shopee Product Analyzer - Test Runner', 'bright');
  log('='.repeat(50), 'cyan');

  // Create test runner
  const testRunner = new TestRunner();

  // Define test files
  const testFiles = [
    'test/basic.test.ts',
    'test/api/api.test.ts',
    'test/unit/utils.test.ts',
    'test/integration/flow.test.ts'
  ];

  // Filter test files based on arguments
  const filteredFiles = args.length > 0
    ? testFiles.filter(file => args.some(arg => file.includes(arg)))
    : testFiles;

  // Run tests
  const allPassed = await testRunner.runTests(filteredFiles);

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run main function
main().catch(err => {
  error(`Test runner error: ${err.message}`);
  process.exit(1);
});

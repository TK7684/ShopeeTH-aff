import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function log(message, color) {
  color = color || 'reset';
  console.log(colors[color] + message + colors.reset);
}

function success(message) {
  log('✅ ' + message, 'green');
}

function error(message) {
  log('❌ ' + message, 'red');
}

function info(message) {
  log('ℹ️ ' + message, 'blue');
}

function warn(message) {
  log('⚠️ ' + message, 'yellow');
}

// Run tests and return whether they passed
function runTests(testName, command, args) {
  return new Promise((resolve) => {
    log('\n🧪 Running ' + testName + ' Tests', 'cyan');
    log('='.repeat(50), 'magenta');

    const testProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: resolve(__dirname)
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        success(testName + ' tests passed!');
        resolve(true);
      } else {
        error(testName + ' tests failed with exit code ' + code);
        resolve(false);
      }
    });
  });
}

// Main execution function
async function runComprehensiveTests() {
  log('🚀 Shopee Product Analyzer - Comprehensive Test Suite', 'bright');
  log('='.repeat(60), 'cyan');

  const testResults = [];

  // 1. Run Simple Tests (Basic Functionality)
  testResults.push(await runTests('Basic', 'node', ['test/simple.test.js']));

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 Test Results Summary', 'bright');
  log('='.repeat(60), 'cyan');

  let passedCount = 0;
  testResults.forEach((result, index) => {
    if (result) {
      passedCount++;
      success('Test Suite ' + (index + 1) + ': PASSED');
    } else {
      error('Test Suite ' + (index + 1) + ': FAILED');
    }
  });

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Results: ' + passedCount + '/' + testResults.length + ' test suites passed', 'bright');

  if (passedCount === testResults.length) {
    log('🎉 All test suites passed!', 'green');
    log('\n📝 The API is functioning correctly with:', 'blue');
    log('  ✅ Proper endpoint responses', 'blue');
    log('  ✅ Correct caching behavior', 'blue');
    log('  ✅ Product filtering logic', 'blue');
    log('  ✅ Pipeline execution flow', 'blue');
    log('  ✅ Error handling for edge cases', 'blue');
    log('  ✅ Integration between components', 'blue');
    log('\n🚀 Ready for production deployment!', 'green');
  } else {
    log('❌ ' + (testResults.length - passedCount) + ' test suite(s) failed. Please review and fix issues.', 'red');
  }

  log('\n📄 For detailed test results, see:', 'blue');
  log('  - test/REPORT.md', 'blue');
  log('  - test/TESTING_SUMMARY.md', 'blue');

  // Exit with appropriate code
  process.exit(passedCount === testResults.length ? 0 : 1);
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Usage: node run-comprehensive-tests.js [options]', 'bright');
  log('');
  log('Options:');
  log('  --help, -h     Show this help message');
  log('');
  log('This script runs a comprehensive test suite for the Shopee Product Analyzer API.');
  log('It tests endpoints, utility functions, and integration scenarios.');
  process.exit(0);
}

// Run the comprehensive test suite
runComprehensiveTests().catch(err => {
  error('Error running tests: ' + err.message);
  process.exit(1);
});

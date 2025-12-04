
```import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  ui: args.includes('--ui'),
  apiOnly: args.includes('--api-only'),
  unitOnly: args.includes('--unit-only'),
  integrationOnly: args.includes('--integration-only'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help') || args.includes('-h')
};

// Display help information
if (options.help) {
  console.log("Usage: node run-tests.js [options]\n\nOptions:\n  --coverage         Run tests with coverage report\n  --watch            Run tests in watch mode\n  --ui               Run tests with UI interface\n  --api-only         Run only API tests\n  --unit-only        Run only unit tests\n  --integration-only Run only integration tests\n  --verbose          Run tests with verbose output\n  --help, -h         Show this help message\n\nExamples:\n  node run-tests.js                    # Run all tests\n  node run-tests.js --api-only         # Run only API tests\n  node run-tests.js --coverage         # Run all tests with coverage\n  node run-tests.js --watch            # Run tests in watch mode\n  node run-tests.js --ui               # Run tests with UI interface");
  process.exit(0);
}

// Determine which test suites to run
let testPath = 'test';
if (options.apiOnly) {
  testPath = 'test/api';
} else if (options.unitOnly) {
  testPath = 'test/unit';
} else if (options.integrationOnly) {
  testPath = 'test/integration';
}

// Build the command arguments for Vitest
const vitestArgs = [
  'run',
  testPath
];

if (options.coverage) {
  vitestArgs.push('--coverage');
}

if (options.verbose) {
  vitestArgs.push('--verbose');
}

// Run the tests
console.log("Running tests with command: npm run test:run " + vitestArgs.join(' '));

const testProcess = spawn('npm', ['run', 'test:run', ...vitestArgs], {
  stdio: 'inherit',
  shell: true,
  cwd: resolve(__dirname)
});

// Handle process exit
testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Tests completed successfully!');
  } else {
    console.log('\n❌ Tests failed with exit code ' + code);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test process terminated by user');
  testProcess.kill('SIGINT');
  process.exit(130);
});

// Open UI if requested
if (options.ui) {
  console.log('Opening test UI in browser...');
  const uiProcess = spawn('npm', ['run', 'test:ui'], {
    stdio: 'inherit',
    shell: true,
    cwd: resolve(__dirname)
  });

  uiProcess.on('close', (code) => {
    console.log('UI process exited with code ' + code);
  });
}

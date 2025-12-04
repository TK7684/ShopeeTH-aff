import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { config } from "@vue/test-utils";

// Mock global objects that might not be available in the test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Nuxt server composables
vi.mock("#app", () => ({
  defineEventHandler: vi.fn(),
  readBody: vi.fn(),
  setHeader: vi.fn(),
  createError: vi.fn(),
}));

// Mock the utils that might use Node.js APIs
vi.mock("~/server/utils/googleSheets", () => ({
  uploadToGoogleSheet: vi.fn(),
}));

vi.mock("~/server/utils/sheetBuilders", () => ({
  buildSheetRows: vi.fn(),
  buildCategoryRows: vi.fn(),
  buildCategoryTabs: vi.fn(),
}));

// Set up global test configurations
beforeAll(() => {
  // Configure Vue Test Utils
  config.global.stubs = {
    // Add any global component stubs here
  };

  // Mock any global APIs if needed
  if (typeof global.fetch === "undefined") {
    global.fetch = vi.fn();
  }
});

// Clean up after each test
afterEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Any global cleanup
});

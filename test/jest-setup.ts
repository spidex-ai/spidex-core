// Jest setup file for Zealy tests
import { EEnvironment } from '@constants/env.constant';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test-specific environment variables
process.env.NODE_ENV = EEnvironment.TESTING;
process.env.ZEALY_API_KEY = process.env.ZEALY_API_KEY || 'test_zealy_api_key';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Silence console.error in tests unless explicitly testing errors
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estender expect com matchers do jest-dom
expect.extend(matchers);

// Limpar após cada teste
afterEach(() => {
  cleanup();
});

// Mock do Supabase
vi.mock('@pei/database', async () => {
  const actual = await vi.importActual('@pei/database');
  return {
    ...actual,
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
      },
    },
  };
});

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});


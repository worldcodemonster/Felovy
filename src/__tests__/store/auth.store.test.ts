import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';

// Mock @/lib/api before importing the store
vi.mock('@/lib/api', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  loadTokens: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock localStorage for zustand persist
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

import { setTokens, clearTokens } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const mockUser = { id: 'u1', email: 'dev@test.com', role: 'DEVELOPER' as const };
const ACCESS_TOKEN = 'mock-access-token';
const REFRESH_TOKEN = 'mock-refresh-token';

describe('useAuthStore', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts unauthenticated with no user', () => {
      const { user, isAuthenticated, accessToken, refreshToken } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();
    });
  });

  describe('login', () => {
    it('sets user, tokens, and isAuthenticated to true', () => {
      act(() => {
        useAuthStore.getState().login(mockUser, ACCESS_TOKEN, REFRESH_TOKEN);
      });
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe(ACCESS_TOKEN);
      expect(state.refreshToken).toBe(REFRESH_TOKEN);
      expect(state.isAuthenticated).toBe(true);
    });

    it('calls setTokens with correct arguments', () => {
      act(() => {
        useAuthStore.getState().login(mockUser, ACCESS_TOKEN, REFRESH_TOKEN);
      });
      expect(setTokens).toHaveBeenCalledWith(ACCESS_TOKEN, REFRESH_TOKEN);
    });

    it('replaces existing session on re-login', () => {
      const otherUser = { id: 'u2', email: 'emp@corp.com', role: 'EMPLOYER' as const };
      act(() => {
        useAuthStore.getState().login(mockUser, ACCESS_TOKEN, REFRESH_TOKEN);
        useAuthStore.getState().login(otherUser, 'new-access', 'new-refresh');
      });
      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('emp@corp.com');
      expect(state.accessToken).toBe('new-access');
    });
  });

  describe('logout', () => {
    it('clears all auth state', () => {
      act(() => {
        useAuthStore.getState().login(mockUser, ACCESS_TOKEN, REFRESH_TOKEN);
        useAuthStore.getState().logout();
      });
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('calls clearTokens', () => {
      act(() => {
        useAuthStore.getState().login(mockUser, ACCESS_TOKEN, REFRESH_TOKEN);
        useAuthStore.getState().logout();
      });
      expect(clearTokens).toHaveBeenCalled();
    });

    it('is safe to call when already logged out', () => {
      expect(() => {
        act(() => {
          useAuthStore.getState().logout();
        });
      }).not.toThrow();
      expect(clearTokens).toHaveBeenCalled();
    });
  });
});

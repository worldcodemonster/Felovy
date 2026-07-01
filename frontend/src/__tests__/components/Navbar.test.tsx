import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

const mockLogout = vi.fn();
const mockAuthState = {
  user: null as any,
  isAuthenticated: false,
  logout: mockLogout,
};

vi.mock('@/store/auth.store', () => ({
  useAuthStore: () => mockAuthState,
}));

import { Navbar } from '@/components/shared/Navbar';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;
  });

  describe('unauthenticated state', () => {
    it('renders Sign In and Get Started buttons', () => {
      render(<Navbar />);
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
    });

    it('does not render Dashboard button', () => {
      render(<Navbar />);
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });

    it('does not render Sign Out button', () => {
      render(<Navbar />);
      expect(screen.queryByTitle(/sign out/i)).not.toBeInTheDocument();
    });

    it('renders nav links for Jobs, About, Services', () => {
      render(<Navbar />);
      expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
    });

    it('renders Felovy logo link', () => {
      render(<Navbar />);
      expect(screen.getByText('Felovy')).toBeInTheDocument();
    });

    it('has logo linking to /', () => {
      render(<Navbar />);
      const links = screen.getAllByRole('link');
      const homeLink = links.find(l => l.getAttribute('href') === '/');
      expect(homeLink).toBeTruthy();
    });
  });

  describe('authenticated as DEVELOPER', () => {
    beforeEach(() => {
      mockAuthState.user = { id: 'u1', email: 'dev@test.com', role: 'DEVELOPER' };
      mockAuthState.isAuthenticated = true;
    });

    it('renders Dashboard button pointing to /dashboard/developer', () => {
      render(<Navbar />);
      const dashLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashLink).toHaveAttribute('href', '/dashboard/developer');
    });

    it('renders role badge', () => {
      render(<Navbar />);
      expect(screen.getByText('DEVELOPER')).toBeInTheDocument();
    });

    it('does not render Sign In / Get Started', () => {
      render(<Navbar />);
      expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
    });

    it('calls logout and redirects to / on sign out click', () => {
      render(<Navbar />);
      const signOutBtn = screen.getByTitle(/sign out/i);
      fireEvent.click(signOutBtn);
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('authenticated as EMPLOYER', () => {
    beforeEach(() => {
      mockAuthState.user = { id: 'u2', email: 'emp@corp.com', role: 'EMPLOYER' };
      mockAuthState.isAuthenticated = true;
    });

    it('renders Dashboard button pointing to /dashboard/employer', () => {
      render(<Navbar />);
      const dashLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashLink).toHaveAttribute('href', '/dashboard/employer');
    });

    it('renders role badge as EMPLOYER', () => {
      render(<Navbar />);
      expect(screen.getByText('EMPLOYER')).toBeInTheDocument();
    });
  });

  describe('authenticated as OWNER', () => {
    beforeEach(() => {
      mockAuthState.user = { id: 'o1', email: 'owner@felovy.com', role: 'OWNER' };
      mockAuthState.isAuthenticated = true;
    });

    it('renders Dashboard button pointing to /dashboard/owner', () => {
      render(<Navbar />);
      const dashLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashLink).toHaveAttribute('href', '/dashboard/owner');
    });

    it('renders OWNER role badge', () => {
      render(<Navbar />);
      expect(screen.getByText('OWNER')).toBeInTheDocument();
    });
  });
});

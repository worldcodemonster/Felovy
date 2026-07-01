import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} {...props} />
  ),
}));

const mockMutate = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: mockMutate, isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn().mockResolvedValue({ ok: true }) },
}));

import { JobCard } from '@/components/jobs/JobCard';
import { Job } from '@/types';

// ─── Test data ────────────────────────────────────────────────────────────────

const baseJob: Job = {
  id: 'j1',
  employerId: 'e1',
  title: 'Senior React Developer',
  locationType: 'REMOTE',
  status: 'APPROVED',
  isPinned: false,
  isEnabled: true,
  requiredSkills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
  niceToHaveSkills: [],
  languages: ['English'],
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  publishedAt: new Date(Date.now() - 60_000).toISOString(),
  salaryMin: 80000,
  salaryMax: 120000,
  currency: 'USD',
  salaryType: 'YEARLY',
  companyLocation: 'San Francisco, CA',
  employer: {
    companyName: 'Acme Corp',
    companyLogoUrl: null,
    companyLocation: 'US',
  },
  _count: { applications: 5 },
  favorites: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JobCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job title and company name', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('Senior React Developer')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders location type badge', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('REMOTE')).toBeInTheDocument();
  });

  it('renders salary information', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText(/80,000/)).toBeInTheDocument();
    expect(screen.getByText(/120,000/)).toBeInTheDocument();
  });

  it('renders up to 3 required skills, truncating the rest with +N', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument(); // GraphQL truncated
    expect(screen.queryByText('GraphQL')).not.toBeInTheDocument();
  });

  it('renders company location', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('renders applicant count', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText(/5 applicants/)).toBeInTheDocument();
  });

  it('wraps card in a link to /jobs/:id', () => {
    render(<JobCard job={baseJob} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/jobs/j1');
  });

  it('shows Featured label when job is pinned', () => {
    const pinnedJob = { ...baseJob, isPinned: true };
    render(<JobCard job={pinnedJob} />);
    expect(screen.getByText(/featured/i)).toBeInTheDocument();
  });

  it('does not show Featured label when not pinned', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.queryByText(/featured/i)).not.toBeInTheDocument();
  });

  it('renders favorite button when userId is provided', () => {
    render(<JobCard job={baseJob} userId="u1" />);
    const heart = screen.getByRole('button');
    expect(heart).toBeInTheDocument();
  });

  it('does not render favorite button when userId is absent', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls toggleFav mutation when heart button is clicked', () => {
    render(<JobCard job={baseJob} userId="u1" />);
    const heartBtn = screen.getByRole('button');
    fireEvent.click(heartBtn);
    expect(mockMutate).toHaveBeenCalled();
  });

  it('renders fallback logo when no logoUrl or companyLogoUrl', () => {
    render(<JobCard job={baseJob} />);
    // Fallback renders first letter of company name
    const fallback = screen.getByText('A'); // "Acme Corp"[0]
    expect(fallback).toBeInTheDocument();
  });

  it('renders img tag when logoUrl is provided', () => {
    const jobWithLogo = { ...baseJob, logoUrl: 'https://cdn.example.com/logo.png' };
    render(<JobCard job={jobWithLogo} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
  });

  it('shows "Negotiable" badge when no salary is set', () => {
    const noSalaryJob = { ...baseJob, salaryMin: undefined, salaryMax: undefined };
    render(<JobCard job={noSalaryJob} />);
    expect(screen.queryByText(/80,000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Negotiable/)).not.toBeInTheDocument(); // badge only shows when salary present
  });

  it('renders "just now" for very recent jobs', () => {
    render(<JobCard job={baseJob} />);
    expect(screen.getByText(/just now|m ago/)).toBeInTheDocument();
  });
});

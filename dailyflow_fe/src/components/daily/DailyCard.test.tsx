import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyCard } from './DailyCard';
import { Daily } from '@/types/api';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const baseDaily: Daily = {
  id: 42,
  userId: 1,
  date: '2026-03-03',
  content: 'Yesterday I finished the auth module. Today I will work on tests.',
  selectedTasksSnapshot: [],
  createdAt: '2026-03-03T08:00:00Z',
  updatedAt: '2026-03-03T08:00:00Z',
};

describe('DailyCard', () => {
  it('renders the date as title', () => {
    render(<DailyCard daily={baseDaily} />);
    expect(screen.getByText('2026-03-03')).toBeInTheDocument();
  });

  it('renders the content preview', () => {
    render(<DailyCard daily={baseDaily} />);
    expect(
      screen.getByText('Yesterday I finished the auth module. Today I will work on tests.'),
    ).toBeInTheDocument();
  });

  it('truncates long content to 120 chars with ellipsis', () => {
    const longContent = 'A'.repeat(130);
    render(<DailyCard daily={{ ...baseDaily, content: longContent }} />);
    const preview = screen.getByText(/A+…/);
    expect(preview.textContent).toHaveLength(121); // 120 + '…'
  });

  it('links to the correct daily route', () => {
    render(<DailyCard daily={baseDaily} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/daily/$dailyId');
  });
});

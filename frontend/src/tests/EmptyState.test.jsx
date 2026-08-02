import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => <span data-testid="icon">{icon}</span>
}));

import EmptyState from '../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders icon, title and description', () => {
    render(<EmptyState icon="chart-line" title="Get Started" description="Create a project." />);
    expect(screen.getByTestId('icon')).toHaveTextContent('chart-line');
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Create a project.')).toBeInTheDocument();
  });

  it('renders CTA children when provided', () => {
    render(
      <EmptyState icon="chart-line" title="Get Started" description="Create a project.">
        <button>Create Project</button>
      </EmptyState>
    );
    expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument();
  });

  it('spaces the description above CTAs only when CTAs exist', () => {
    // TrendCharts' empty state has no CTA and no bottom margin on its copy;
    // Dashboard/ProjectView's do.
    const { unmount } = render(
      <EmptyState icon="chart-line" title="No data" description="Record more drafts." />
    );
    expect(screen.getByText('Record more drafts.').className).not.toContain('mb-6');
    unmount();

    render(
      <EmptyState icon="chart-line" title="No data" description="Record more drafts.">
        <button>Go</button>
      </EmptyState>
    );
    expect(screen.getByText('Record more drafts.').className).toContain('mb-6');
  });
});

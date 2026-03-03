import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import { AsanaTask } from '@/types/api';

const baseTask: AsanaTask = {
  gid: 'task-1',
  name: 'Write unit tests',
  notes: '',
  completed: false,
  completed_at: null,
  modified_at: null,
  due_on: '2026-03-10',
  projects: [{ name: 'DailyFlow' }],
};

describe('TaskCard', () => {
  it('renders the task name', () => {
    render(<TaskCard task={baseTask} checked={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });

  it('renders the project badge', () => {
    render(<TaskCard task={baseTask} checked={false} onToggle={vi.fn()} />);
    expect(screen.getByText('DailyFlow')).toBeInTheDocument();
  });

  it('renders the due date', () => {
    render(<TaskCard task={baseTask} checked={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Due: 2026-03-10')).toBeInTheDocument();
  });

  it('calls onToggle with task gid when clicked', () => {
    const onToggle = vi.fn();
    render(<TaskCard task={baseTask} checked={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('Write unit tests'));
    expect(onToggle).toHaveBeenCalledWith('task-1');
  });

  it('does not render due date when absent', () => {
    const taskNoDue = { ...baseTask, due_on: null };
    render(<TaskCard task={taskNoDue} checked={false} onToggle={vi.fn()} />);
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it('does not render project badge when projects empty', () => {
    const taskNoProjects = { ...baseTask, projects: [] };
    render(<TaskCard task={taskNoProjects} checked={false} onToggle={vi.fn()} />);
    expect(screen.queryByText('DailyFlow')).not.toBeInTheDocument();
  });
});

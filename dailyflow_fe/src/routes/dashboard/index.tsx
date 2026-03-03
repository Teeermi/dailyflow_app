import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { AsanaTasksResponse, AsanaProject } from '@/types/api';
import { TaskSection } from '@/components/dashboard/TaskSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { locales } from '@/lib/locales';

export const Route = createFileRoute('/dashboard/')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [selectedGids, setSelectedGids] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { data: projects } = useQuery<AsanaProject[]>({
    queryKey: ['asana-projects'],
    queryFn: async () => {
      const res = await api.get<AsanaProject[]>('/asana/projects');
      return res.data;
    },
  });

  const { data, isLoading, isError } = useQuery<AsanaTasksResponse>({
    queryKey: ['asana-tasks', selectedProject],
    queryFn: async () => {
      const params = selectedProject ? { projectGid: selectedProject } : {};
      const res = await api.get<AsanaTasksResponse>('/asana/tasks', { params });
      return res.data;
    },
  });

  const toggle = (gid: string) => {
    setSelectedGids((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  const handleGenerate = () => {
    const ids = Array.from(selectedGids);
    sessionStorage.setItem('pendingTaskIds', JSON.stringify(ids));
    navigate({ to: '/daily/new' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{locales.dashboard.heading}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {locales.dashboard.subheading}
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={selectedGids.size === 0}
            className="bg-brand hover:bg-brand-light text-white"
          >
            {locales.dashboard.generateButton(selectedGids.size)}
          </Button>
        </div>

        {projects && projects.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedGids(new Set());
              }}
              className="w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">{locales.dashboard.allProjects}</option>
              {projects.map((p) => (
                <option key={p.gid} value={p.gid}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {locales.dashboard.loadError}
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <TaskSection
              title={locales.dashboard.sections.completedYesterday}
              tasks={data.yesterday}
              selectedGids={selectedGids}
              onToggle={toggle}
            />
            <TaskSection
              title={locales.dashboard.sections.inProgressYesterday}
              tasks={data.workedOnYesterday}
              selectedGids={selectedGids}
              onToggle={toggle}
            />
            <TaskSection
              title={locales.dashboard.sections.activeToday}
              tasks={data.today}
              selectedGids={selectedGids}
              onToggle={toggle}
            />
          </div>
        )}
      </main>
    </div>
  );
}

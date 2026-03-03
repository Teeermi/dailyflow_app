import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';
import { AsanaTasksResponse, Daily } from '@/types/api';
import { toast } from 'sonner';
import { locales } from '@/lib/locales';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';

export const Route = createFileRoute('/daily/new')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: NewDaily,
});

function NewDaily() {
  const navigate = useNavigate();

  const selectedTaskIds: string[] = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('pendingTaskIds') ?? '[]');
    } catch {
      return [];
    }
  })();

  const { data: tasksData } = useQuery<AsanaTasksResponse>({
    queryKey: ['asana-tasks'],
    queryFn: async () => {
      const res = await api.get<AsanaTasksResponse>('/asana/tasks');
      return res.data;
    },
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const workedOnYesterdayGids = new Set(
        (tasksData?.workedOnYesterday ?? []).map((t) => t.gid),
      );
      const allTasks = [
        ...(tasksData?.yesterday ?? []),
        ...(tasksData?.workedOnYesterday ?? []),
        ...(tasksData?.today ?? []),
      ];
      const selectedAll = allTasks.filter((t) => selectedTaskIds.includes(t.gid));
      const workedOnYesterdayTasks = selectedAll.filter((t) =>
        workedOnYesterdayGids.has(t.gid),
      );
      const selectedTasks = selectedAll.filter(
        (t) => !workedOnYesterdayGids.has(t.gid),
      );
      const today = new Date().toISOString().split('T')[0];
      const res = await api.post<Daily>('/daily/generate', {
        selectedTasks,
        workedOnYesterdayTasks,
        date: today,
      });
      return res.data;
    },
    onSuccess: (daily) => {
      sessionStorage.removeItem('pendingTaskIds');
      navigate({ to: '/daily/$dailyId', params: { dailyId: String(daily.id) } });
    },
    onError: () => {
      toast.error(locales.dailyNew.generateError);
      navigate({ to: '/dashboard' });
    },
  });

  useEffect(() => {
    if (selectedTaskIds.length === 0) {
      navigate({ to: '/dashboard' });
      return;
    }
    if (tasksData && !mutation.isPending && !mutation.isSuccess) {
      mutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksData]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6 py-16">
          <div className="space-y-3 w-full max-w-md">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">
            {locales.dailyNew.generating}
          </p>
        </div>
      </main>
    </div>
  );
}

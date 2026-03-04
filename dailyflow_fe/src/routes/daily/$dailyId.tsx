import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import type { AxiosError } from 'axios';
import api from '@/lib/api';
import { Daily, User } from '@/types/api';
import { locales } from '@/lib/locales';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';

export const Route = createFileRoute('/daily/$dailyId')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: DailyView,
});

function DailyView() {
  const { dailyId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get<User>('/auth/me');
      return res.data;
    },
    staleTime: Infinity,
    retry: false,
  });

  const { data: daily, isLoading } = useQuery<Daily>({
    queryKey: ['daily', dailyId],
    queryFn: async () => {
      const res = await api.get<Daily>(`/daily/${dailyId}`);
      return res.data;
    },
  });

  const slackMutation = useMutation({
    mutationFn: () => api.post(`/daily/${dailyId}/post-to-slack`),
    onSuccess: () => toast.success(locales.dailyDetail.toast.slackSuccess),
    onError: (err: AxiosError<{ message?: string }>) => {
      const msg = err.response?.data?.message ?? locales.dailyDetail.toast.slackError;
      toast.error(msg);
    },
  });

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.patch<Daily>(`/daily/${dailyId}`, { content });
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['daily', dailyId], updated);
      toast.success(locales.dailyDetail.toast.saved);
    },
    onError: () => {
      toast.error(locales.dailyDetail.toast.saveError);
    },
  });

  const form = useForm({
    defaultValues: { content: daily?.content ?? '' },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value.content);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!daily) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-muted-foreground">{locales.dailyDetail.notFound}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{locales.dailyDetail.heading(daily.date)}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {locales.dailyDetail.taskCount(daily.selectedTasksSnapshot?.length ?? 0)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/dailies' })}
          >
            {locales.dailyDetail.backButton}
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="content">
            {(field) => (
              <Textarea
                value={field.state.value || daily.content}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                rows={20}
                className="font-mono text-sm resize-none"
                placeholder={locales.dailyDetail.contentPlaceholder}
              />
            )}
          </form.Field>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand hover:bg-brand-light text-white"
            >
              {mutation.isPending ? locales.dailyDetail.savingButton : locales.dailyDetail.saveButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  form.getFieldValue('content') || daily.content,
                );
                toast.success(locales.dailyDetail.toast.copied);
              }}
            >
              {locales.dailyDetail.copyButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={slackMutation.isPending || !user?.slackWebhookUrl}
              title={!user?.slackWebhookUrl ? locales.dailyDetail.webhookMissingTitle : locales.dailyDetail.postToSlackButton}
              onClick={() => slackMutation.mutate()}
            >
              {slackMutation.isPending ? locales.dailyDetail.postingButton : locales.dailyDetail.postToSlackButton}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

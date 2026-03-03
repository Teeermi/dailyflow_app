import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';
import { locales } from '@/lib/locales';

export const Route = createFileRoute('/settings/')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: Settings,
});

function Settings() {
  const { data: user } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get<{ id: number; name: string; email: string }>('/auth/me');
      return res.data;
    },
    staleTime: Infinity,
    retry: false,
  });

  const [webhookUrl, setWebhookUrl] = useState('');

  const mutation = useMutation({
    mutationFn: (url: string) => api.patch('/users/me', { slackWebhookUrl: url }),
    onSuccess: () => {
      toast.success(locales.settings.toast.saved);
    },
    onError: () => {
      toast.error(locales.settings.toast.saveError);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    mutation.mutate(webhookUrl.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">{locales.settings.heading}</h1>
        <p className="text-muted-foreground text-sm mb-8">
          {locales.settings.subheading}
          {user ? ` (${user.email})` : ''}
        </p>

        <section className="rounded-lg border p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">{locales.settings.slackSection}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {locales.settings.slackDescription}{' '}
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {locales.settings.slackHowTo}
              </a>
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder={locales.settings.slackPlaceholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <Button
              type="submit"
              disabled={!webhookUrl.trim() || mutation.isPending}
              className="bg-brand hover:bg-brand-light text-white"
            >
              {mutation.isPending ? locales.settings.savingButton : locales.settings.saveButton}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}

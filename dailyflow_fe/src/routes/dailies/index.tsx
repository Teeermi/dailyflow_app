import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Daily } from '@/types/api';
import { DailyCard } from '@/components/daily/DailyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { locales } from '@/lib/locales';

export const Route = createFileRoute('/dailies/')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
    } catch {
      throw redirect({ to: '/' });
    }
  },
  component: DailiesList,
});

function DailiesList() {
  const { data: dailies, isLoading } = useQuery<Daily[]>({
    queryKey: ['dailies'],
    queryFn: async () => {
      const res = await api.get<Daily[]>('/daily');
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{locales.dailies.heading}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {locales.dailies.subheading}
            </p>
          </div>
          <Link to="/dashboard">
            <Button className="bg-brand hover:bg-brand-light text-white">
              {locales.dailies.newButton}
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {dailies && dailies.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">{locales.dailies.empty}</p>
            <p className="text-sm mt-1">
              {locales.dailies.emptyHint}{' '}
              <Link to="/dashboard" className="underline">
                {locales.dailies.emptyHintLink}
              </Link>{' '}
              {locales.dailies.emptyHintSuffix}
            </p>
          </div>
        )}

        {dailies && dailies.length > 0 && (
          <div className="grid gap-3">
            {dailies.map((daily) => (
              <DailyCard key={daily.id} daily={daily} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { createFileRoute, redirect } from '@tanstack/react-router';
import { AsanaButton } from '@/components/landing/AsanaButton';
import api from '@/lib/api';
import { locales } from '@/lib/locales';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
      throw redirect({ to: '/dashboard' });
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }; status?: number; to?: string };
      if (e?.response?.status === 401 || e?.status === 401) {
        return;
      }
      // It's a redirect object thrown by TanStack Router
      if (e?.to) throw err;
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-brand flex flex-col items-center justify-center gap-10 p-6 text-center">
      <h1 className="text-[96px] font-medium text-white max-w-[1061px] leading-[1.05] m-0">
        {locales.landing.heading}
      </h1>
      <p className="text-[36px] font-normal text-white m-0 opacity-90">
        {locales.landing.subheading}
      </p>
      <AsanaButton />
    </div>
  );
}


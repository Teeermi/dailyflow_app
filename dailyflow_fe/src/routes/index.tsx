import { createFileRoute, redirect } from '@tanstack/react-router';
import { AsanaButton } from '@/components/landing/AsanaButton';
import api from '@/lib/api';
import { locales } from '@/lib/locales';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      await api.get('/auth/me');
      throw redirect({ to: '/dashboard' });
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.status === 401) {
        return;
      }
      // It's a redirect object thrown by TanStack Router
      if (err?.to) throw err;
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#6A0233',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '40px',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '96px',
          fontWeight: 500,
          color: '#fff',
          maxWidth: '1061px',
          lineHeight: 1.05,
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          margin: 0,
        }}
      >
        {locales.landing.heading}
      </h1>
      <p
        style={{
          fontSize: '36px',
          fontWeight: 400,
          color: '#fff',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          margin: 0,
          opacity: 0.9,
        }}
      >
        {locales.landing.subheading}
      </p>
      <AsanaButton />
    </div>
  );
}

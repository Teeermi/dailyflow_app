import { locales } from '@/lib/locales';

export function AsanaButton() {
  return (
    <a
      href="/api/auth/asana"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: '#FEE9EC',
        color: '#6A0233',
        borderRadius: '9999px',
        height: '94px',
        padding: '0 48px',
        textDecoration: 'none',
        boxShadow: '0 0 40px 8px rgba(134, 19, 53, 0.6), 0 0 80px 20px rgba(134, 19, 53, 0.3)',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        fontWeight: 500,
        fontSize: '32px',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          '0 0 60px 16px rgba(134, 19, 53, 0.8), 0 0 120px 40px rgba(134, 19, 53, 0.4)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          '0 0 40px 8px rgba(134, 19, 53, 0.6), 0 0 80px 20px rgba(134, 19, 53, 0.3)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
      }}
    >
      <img src="/asana-logo.svg" alt={locales.asanaButton.imgAlt} width={54} height={50} />
      {locales.asanaButton.label}
    </a>
  );
}

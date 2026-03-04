import { locales } from '@/lib/locales';

export function AsanaButton() {
  return (
    <a
      href="/api/auth/asana"
      className="asana-btn inline-flex items-center gap-4 bg-brand-surface text-brand rounded-full h-[94px] px-12 no-underline font-medium text-[32px] whitespace-nowrap"
    >
      <img src="/asana-logo.svg" alt={locales.asanaButton.imgAlt} width={54} height={50} />
      {locales.asanaButton.label}
    </a>
  );
}


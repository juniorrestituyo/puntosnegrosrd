import Link from 'next/link';

interface SiteNavProps {
  current?: 'mapa' | 'datos' | 'metodologia' | 'acerca';
}

const links: { href: string; key: SiteNavProps['current']; label: string }[] = [
  { href: '/', key: 'mapa', label: 'Mapa' },
  { href: '/datos-abiertos', key: 'datos', label: 'Datos abiertos' },
  { href: '/metodologia', key: 'metodologia', label: 'Metodologia' },
  { href: '/acerca-de', key: 'acerca', label: 'Acerca de' },
];

export default function SiteNav({ current }: SiteNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-3">
      {links.map((l) => {
        const isActive = current === l.key;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded px-2 py-1 text-xs transition-colors sm:text-sm ${
              isActive
                ? 'bg-brand text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-brand'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

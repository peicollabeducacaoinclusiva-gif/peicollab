'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

const navItems = [
  { href: '/dashboard/settings', label: 'Geral' },
  { href: '/dashboard/settings/schools', label: 'Escolas', permission: 'schools' as const },
  { href: '/dashboard/settings/users', label: 'Usuários e vínculos', permission: 'users' as const },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const permissions = usePermissions();

  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    if (item.permission === 'users')
      return permissions.canManageUsers() || permissions.canManageFamilyLinks();
    if (item.permission === 'schools') return permissions.canCreateSchool();
    return false;
  });

  return (
    <div className="space-y-6">
      <nav className="flex gap-1 border-b">
        {visibleItems.map((item) => {
          const isActive =
            item.href === pathname ||
            (item.href !== '/dashboard/settings' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

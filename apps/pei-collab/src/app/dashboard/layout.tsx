'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Library,
  Target,
  CheckCircle2,
  Menu,
} from 'lucide-react';

import { usePermissions } from '@/hooks/usePermissions';
import { useUserContext } from '@/hooks/useUserContext';
import { roleLabels } from '@/lib/rbac';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  visible: () => boolean;
};

function SidebarNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">
        {items
          .filter((item) => item.visible())
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            );
          })}
      </nav>
      <div className="mt-auto">
        <Badge variant="outline">Sessão ativa</Badge>
      </div>
    </>
  );
}

function RoleBadge() {
  const permissions = usePermissions();
  if (permissions.loading || !permissions.user) return null;
  const label = roleLabels[permissions.user.role] ?? permissions.user.role;
  return (
    <Badge variant="outline" className="hidden text-xs sm:inline-flex">
      {label}
    </Badge>
  );
}

function ContextBadge({
  networkName,
  schoolName,
}: {
  networkName: string | null;
  schoolName: string | null;
}) {
  if (!networkName && !schoolName) return null;
  const parts = [networkName, schoolName].filter(Boolean);
  return <div className="mt-1 text-xs text-muted-foreground">{parts.join(' · ')}</div>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const pageTitles: [string, string][] = [
    ['/dashboard/settings/users', 'Usuários'],
    ['/dashboard/settings/schools', 'Escolas'],
    ['/dashboard/settings', 'Configurações'],
    ['/dashboard/students', 'Alunos'],
    ['/dashboard/documents', 'Documentos'],
    ['/dashboard/metas', 'Metas'],
    ['/dashboard/confirmacao', 'Confirmação'],
    ['/dashboard/templates', 'Templates'],
    ['/dashboard/relatorios', 'Relatórios'],
    ['/dashboard', 'Dashboard'],
  ];
  const pageTitle =
    pageTitles.find(([path]) => pathname.startsWith(path))?.[1] ?? 'Dashboard';
  const permissions = usePermissions();
  const { networkName, schoolName, loading } = useUserContext();
  const [sheetOpen, setSheetOpen] = useState(false);

  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      visible: () => true,
    },
    {
      label: 'Alunos',
      href: '/dashboard/students',
      icon: <Users className="h-4 w-4" />,
      visible: () => true,
    },
    {
      label: 'Documentos',
      href: '/dashboard/documents',
      icon: <FileText className="h-4 w-4" />,
      visible: () => true,
    },
    {
      label: 'Metas',
      href: '/dashboard/metas',
      icon: <Target className="h-4 w-4" />,
      visible: () => true,
    },
    {
      label: 'Confirmação',
      href: '/dashboard/confirmacao',
      icon: <CheckCircle2 className="h-4 w-4" />,
      visible: () => true,
    },
    {
      label: 'Templates',
      href: '/dashboard/templates',
      icon: <Library className="h-4 w-4" />,
      visible: () => permissions.canEditTemplate(),
    },
    {
      label: 'Configurações',
      href: '/dashboard/settings',
      icon: <Settings className="h-4 w-4" />,
      visible: () => true,
    },
    {
      label: 'Usuários',
      href: '/dashboard/settings/users',
      icon: <FileText className="h-4 w-4" />,
      visible: () => permissions.canManageFamilyLinks() || permissions.canManageUsers(),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
          <div className="mb-8">
            <h1 className="text-xl font-semibold">PEI Collab</h1>
            <p className="text-sm text-muted-foreground">Gestão inclusiva</p>
            {!loading ? <ContextBadge networkName={networkName} schoolName={schoolName} /> : null}
          </div>
          <SidebarNav items={items} pathname={pathname} />
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b bg-background px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex md:hidden"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-64 flex-col p-4 sm:max-w-[16rem]">
                  <SheetHeader className="mb-4 p-0">
                    <SheetTitle>PEI Collab</SheetTitle>
                    <p className="text-sm text-muted-foreground">Gestão inclusiva</p>
                    {!loading ? (
                      <ContextBadge networkName={networkName} schoolName={schoolName} />
                    ) : null}
                  </SheetHeader>
                  <div className="flex flex-1 flex-col pt-4">
                    <SidebarNav
                      items={items}
                      pathname={pathname}
                      onNavigate={() => setSheetOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <h2 className="text-lg font-semibold">{pageTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {networkName || schoolName ? (
                    <>{[networkName, schoolName].filter(Boolean).join(' | ')}</>
                  ) : (
                    'Visão geral do sistema'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge />
              <NotificationBell />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

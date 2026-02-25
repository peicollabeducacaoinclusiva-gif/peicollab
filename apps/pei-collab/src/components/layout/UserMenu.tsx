'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { roleLabels } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const router = useRouter();
  const { user, loading } = usePermissions();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Carregando">
        <User className="h-5 w-5 animate-pulse" />
      </Button>
    );
  }

  const roleLabel = roleLabels[user.role] ?? user.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu do usuário">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <Badge variant="secondary" className="w-fit text-xs" title="Papel no sistema">
            {roleLabel}
          </Badge>
          <span className="text-xs font-normal text-muted-foreground">
            {user.email ?? user.id.slice(0, 8) + '…'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

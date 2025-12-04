import { createClient } from '@supabase/supabase-js';
import { LogOut, User } from 'lucide-react';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Avatar, AvatarFallback } from '../avatar';
import { useUserProfile } from '../../hooks/useUserProfile';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2OTY0NzIsImV4cCI6MjA3NzI3MjQ3Mn0.3FqQqUfVgD3hIh1daa3R1JjouGZ4D4ONR6SmcL9Qids';
const supabase = createClient(supabaseUrl, supabaseKey);

interface UserMenuProps {
  onLogout?: () => void;
  showProfileLink?: boolean;
  profilePath?: string;
}

export function UserMenu({ onLogout, showProfileLink = true, profilePath = '/profile' }: UserMenuProps) {
  const { profile } = useUserProfile();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      if (onLogout) {
        onLogout();
      } else {
        // Usar window.location para navegação sem react-router
        window.location.href = '/login';
      }
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleProfileClick = () => {
    // Usar window.location para navegação sem react-router
    window.location.href = profilePath;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    const roleLabels: Record<string, string> = {
      superadmin: 'Super Admin',
      education_secretary: 'Secretário de Educação',
      school_manager: 'Gestor Escolar',
      school_director: 'Diretor Escolar',
      coordinator: 'Coordenador',
      teacher: 'Professor',
      aee_teacher: 'Professor AEE',
      specialist: 'Especialista',
      support_professional: 'Profissional de Apoio',
      family: 'Família',
    };
    return roleLabels[role || ''] || role || 'Usuário';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'Usuário'}
            </p>
            {profile?.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {profile.email}
              </p>
            )}
            {profile?.school_name && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                🏫 {profile.school_name}
              </p>
            )}
            {profile?.network_name && !profile?.school_name && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                🌐 {profile.network_name}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showProfileLink && (
          <>
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, ExternalLink, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserSelectorProps {
  value?: string;
  onChange: (userId: string, userData?: any) => void;
  roleFilter?: string[]; // Filtrar por roles específicos
  schoolFilter?: string; // Filtrar por escola
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function UserSelector({
  value,
  onChange,
  roleFilter,
  schoolFilter,
  placeholder = 'Selecione um usuário',
  label = 'Usuário',
  required = false
}: UserSelectorProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, schoolFilter]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          school_id,
          is_active,
          school:schools!profiles_school_id_fkey(school_name),
          user_roles(role)
        `)
        .eq('is_active', true)
        .order('full_name');

      if (schoolFilter) {
        query = query.eq('school_id', schoolFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por roles se especificado
      let filteredData = data || [];
      if (roleFilter && roleFilter.length > 0) {
        filteredData = filteredData.filter(user =>
          user.user_roles?.some((r: any) => roleFilter.includes(r.role))
        );
      }

      setUsers(filteredData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === value);

  const handleSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    onChange(userId, user);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
      )}
      
      {/* Selected User Display */}
      {selectedUser && (
        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{selectedUser.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedUser.email || selectedUser.school?.school_name || 'Sem email'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('', undefined)}
          >
            Alterar
          </Button>
        </div>
      )}

      {/* Search and Select */}
      {!selectedUser && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de usuários */}
          <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando usuários...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Nenhum usuário encontrado
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('http://localhost:5174/users', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Cadastrar no Gestão Escolar
                </Button>
              </div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user.id)}
                  className="w-full p-3 text-left hover:bg-accent transition border-b border-border last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email || user.school?.school_name}
                      </p>
                    </div>
                    {user.user_roles && user.user_roles.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {user.user_roles[0].role}
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Link para cadastrar */}
          {!loading && (
            <div className="text-center pt-2">
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open('http://localhost:5174/users', '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Não encontrou? Cadastre no Gestão Escolar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


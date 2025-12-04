import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, History, UserPlus, Crown, Edit, Eye, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  usePEICollaborators,
  useAddCollaborator,
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
} from '@/hooks/usePEICollaboration';
import { useAuth } from '@/hooks/useAuth';
import { PEIComments } from './PEIComments';
import { UserSelector } from '@/components/shared/UserSelector';
import { toast } from 'sonner';

interface PEICollaborationPanelProps {
  peiId: string;
  section?: 'diagnosis' | 'planning' | 'evaluation' | 'general';
}

export function PEICollaborationPanel({ peiId, section = 'general' }: PEICollaborationPanelProps) {
  const { user } = useAuth();
  const { data: collaborators = [], isLoading: collaboratorsLoading } = usePEICollaborators(peiId);
  const addCollaborator = useAddCollaborator();
  const updateRole = useUpdateCollaboratorRole();
  const removeCollaborator = useRemoveCollaborator();

  const [showAddCollaborator, setShowAddCollaborator] = useState(false);

  const currentUserCollaborator = collaborators.find((c) => c.user_id === user?.id);
  const canManageCollaborators = currentUserCollaborator?.role === 'owner' || currentUserCollaborator?.role === 'editor';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'reviewer':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'editor':
        return 'Editor';
      case 'reviewer':
        return 'Revisor';
      default:
        return 'Visualizador';
    }
  };

  const handleAddCollaborator = async (userId: string) => {
    try {
      await addCollaborator.mutateAsync({
        peiId,
        userId,
        role: 'viewer',
      });
      setShowAddCollaborator(false);
      toast.success('Colaborador adicionado');
    } catch (error) {
      toast.error('Erro ao adicionar colaborador');
      console.error(error);
    }
  };

  const handleUpdateRole = async (collaboratorId: string, role: 'owner' | 'editor' | 'reviewer' | 'viewer') => {
    try {
      await updateRole.mutateAsync({
        collaboratorId,
        role,
        peiId,
      });
      toast.success('Papel atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar papel');
      console.error(error);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!confirm('Tem certeza que deseja remover este colaborador?')) return;

    try {
      await removeCollaborator.mutateAsync({
        collaboratorId,
        peiId,
      });
      toast.success('Colaborador removido');
    } catch (error) {
      toast.error('Erro ao remover colaborador');
      console.error(error);
    }
  };

  const activeCollaborators = collaborators.filter((c) => {
    if (!c.last_active_at) return false;
    const lastActive = new Date(c.last_active_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActive > fiveMinutesAgo;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Colaboração
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentários
            </TabsTrigger>
            <TabsTrigger value="collaborators">
              <Users className="h-4 w-4 mr-2" />
              Colaboradores
            </TabsTrigger>
            <TabsTrigger value="active">
              <History className="h-4 w-4 mr-2" />
              Online
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="mt-4">
            <PEIComments peiId={peiId} section={section} />
          </TabsContent>

          <TabsContent value="collaborators" className="mt-4">
            <div className="space-y-4">
              {canManageCollaborators && (
                <div>
                  {showAddCollaborator ? (
                    <div className="space-y-2">
                      <UserSelector
                        onSelect={(userId) => handleAddCollaborator(userId)}
                        excludeUserIds={collaborators.map((c) => c.user_id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddCollaborator(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddCollaborator(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Colaborador
                    </Button>
                  )}
                </div>
              )}

              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {collaboratorsLoading ? (
                    <p className="text-muted-foreground text-center py-4">Carregando...</p>
                  ) : collaborators.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum colaborador encontrado
                    </p>
                  ) : (
                    collaborators.map((collaborator) => {
                      const isOwner = collaborator.role === 'owner';
                      const isCurrentUser = collaborator.user_id === user?.id;

                      return (
                        <div
                          key={collaborator.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {collaborator.user
                                  ? getInitials(collaborator.user.full_name)
                                  : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {collaborator.user?.full_name || 'Usuário'}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Você
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {collaborator.user?.email || ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {getRoleIcon(collaborator.role)}
                              <span className="text-sm">{getRoleLabel(collaborator.role)}</span>
                            </div>
                            {canManageCollaborators && !isOwner && (
                              <div className="flex items-center gap-1">
                                <select
                                  value={collaborator.role}
                                  onChange={(e) =>
                                    handleUpdateRole(
                                      collaborator.id,
                                      e.target.value as 'owner' | 'editor' | 'reviewer' | 'viewer'
                                    )
                                  }
                                  className="text-xs border rounded px-2 py-1"
                                >
                                  <option value="viewer">Visualizador</option>
                                  <option value="reviewer">Revisor</option>
                                  <option value="editor">Editor</option>
                                  {isOwner && <option value="owner">Proprietário</option>}
                                </select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive"
                                  onClick={() => handleRemoveCollaborator(collaborator.id)}
                                >
                                  ×
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <div className="space-y-2">
              {activeCollaborators.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum colaborador online no momento
                </p>
              ) : (
                activeCollaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {collaborator.user
                            ? getInitials(collaborator.user.full_name)
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {collaborator.user?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {collaborator.last_active_at &&
                          format(new Date(collaborator.last_active_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


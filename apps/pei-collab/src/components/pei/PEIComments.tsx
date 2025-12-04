import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, CheckCircle, XCircle, Trash2, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  usePEIComments,
  useAddComment,
  useResolveComment,
  useUnresolveComment,
  useDeleteComment,
} from '@/hooks/usePEICollaboration';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PEICommentsProps {
  peiId: string;
  section?: 'diagnosis' | 'planning' | 'evaluation' | 'general';
}

export function PEIComments({ peiId, section = 'general' }: PEICommentsProps) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = usePEIComments(peiId);
  const addComment = useAddComment();
  const resolveComment = useResolveComment();
  const unresolveComment = useUnresolveComment();
  const deleteComment = useDeleteComment();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const filteredComments = comments.filter(
    (c) => !c.parent_id && (section === 'general' || c.section === section)
  );

  const getReplies = (commentId: string) => {
    return comments.filter((c) => c.parent_id === commentId);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        peiId,
        comment: newComment,
        parentId: replyingTo || undefined,
        section,
      });
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comentário adicionado');
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
      console.error(error);
    }
  };

  const handleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      if (isResolved) {
        await unresolveComment.mutateAsync({ commentId, peiId });
      } else {
        await resolveComment.mutateAsync({ commentId, peiId });
      }
      toast.success(isResolved ? 'Comentário reaberto' : 'Comentário resolvido');
    } catch (error) {
      toast.error('Erro ao atualizar comentário');
      console.error(error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    try {
      await deleteComment.mutateAsync({ commentId, peiId });
      toast.success('Comentário excluído');
    } catch (error) {
      toast.error('Erro ao excluir comentário');
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Carregando comentários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários ({filteredComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {filteredComments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum comentário ainda</p>
            ) : (
              filteredComments.map((comment) => {
                const replies = getReplies(comment.id);
                const isResolved = !!comment.resolved_at;
                const isOwner = comment.user_id === user?.id;

                return (
                  <div key={comment.id} className="space-y-2">
                    <div
                      className={`p-3 rounded-lg border ${
                        isResolved ? 'bg-muted/50 opacity-75' : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.user ? getInitials(comment.user.full_name) : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {comment.user?.full_name || 'Usuário'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isResolved && (
                                <Badge variant="outline" className="text-xs">
                                  Resolvido
                                </Badge>
                              )}
                              {isOwner && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleResolve(comment.id, isResolved)}
                                    title={isResolved ? 'Reabrir comentário' : 'Resolver comentário'}
                                  >
                                    {isResolved ? (
                                      <XCircle className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive"
                                    onClick={() => handleDelete(comment.id)}
                                    title="Excluir comentário"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                          {!replyingTo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setReplyingTo(comment.id)}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Responder
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Respostas */}
                    {replies.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-2 rounded-lg border ${
                              reply.resolved_at ? 'bg-muted/30 opacity-75' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {reply.user ? getInitials(reply.user.full_name) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium">
                                    {reply.user?.full_name || 'Usuário'}
                                  </p>
                                  {reply.user_id === user?.id && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 text-destructive"
                                      onClick={() => handleDelete(reply.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs whitespace-pre-wrap mt-1">{reply.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 space-y-2">
          {replyingTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Reply className="h-4 w-4" />
              <span>Respondendo a comentário</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
              >
                Cancelar
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder={replyingTo ? 'Digite sua resposta...' : 'Adicione um comentário...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleAddComment();
                }
              }}
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pressione Ctrl+Enter para enviar
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


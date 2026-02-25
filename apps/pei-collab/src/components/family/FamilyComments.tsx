'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PermissionGate } from '@/components/auth/PermissionGate';
import type { FamilyComment } from '@/hooks/useFamilyComments';

type FamilyCommentsProps = {
  documentId: string | undefined;
  comments: FamilyComment[];
  loading: boolean;
  error: string | null;
  onAddComment: (comentario: string) => Promise<void>;
};

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FamilyComments({
  documentId,
  comments,
  loading,
  error,
  onAddComment,
}: FamilyCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    await onAddComment(newComment);
    setNewComment('');
    setSending(false);
  };

  if (!documentId) return null;

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Carregando comentários da família...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Comentários da família ({comments.length})
        </h4>
        {error ? <p className="text-sm text-destructive mb-3">{error}</p> : null}
        {comments.length > 0 ? (
          <ul className="space-y-3 mb-4">
            {comments.map((c) => (
              <li key={c.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                <p className="font-medium">{c.user_name}</p>
                <p className="text-muted-foreground">{c.comentario}</p>
                <span className="text-xs text-muted-foreground">
                  {formatCommentDate(c.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <PermissionGate permission="canFamilyComment">
          <div className="space-y-2">
            <Textarea
              placeholder="Adicionar comentário como responsável..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || sending}>
              {sending ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </PermissionGate>
      </CardContent>
    </Card>
  );
}

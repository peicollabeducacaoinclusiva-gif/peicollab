'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import type { DocumentComment } from '@/hooks/useDocumentComments';

type SectionCommentsProps = {
  sectionId: string;
  sectionName: string;
  comments: DocumentComment[];
  onAddComment: (sectionId: string, content: string) => Promise<void>;
  onRemoveComment: (commentId: string) => Promise<void>;
  readOnly?: boolean;
};

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SectionComments({
  sectionId,
  sectionName,
  comments,
  onAddComment,
  onRemoveComment,
  readOnly,
}: SectionCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || sending) return;
    setSending(true);
    await onAddComment(sectionId, newComment);
    setNewComment('');
    setSending(false);
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Comentarios ({comments.length})
        </h4>
        {comments.length > 0 ? (
          <ul className="space-y-3 mb-4">
            {comments.map((c) => (
              <li key={c.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                <p className="font-medium">{c.user_name}</p>
                <p className="text-muted-foreground">{c.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatCommentDate(c.created_at)}
                  </span>
                  {!readOnly ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-destructive hover:text-destructive"
                      onClick={() => onRemoveComment(c.id)}
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {!readOnly ? (
          <div className="space-y-2">
            <Textarea
              placeholder={`Comentar em "${sectionName}"...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || sending}>
              {sending ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

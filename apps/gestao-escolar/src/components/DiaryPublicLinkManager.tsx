import { useState, useEffect } from 'react';
import { Link, Copy, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { diaryNotificationService, type PublicAccessLink } from '../services/diaryNotificationService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiaryPublicLinkManagerProps {
  enrollmentId: string;
  userId: string;
}

export function DiaryPublicLinkManager({
  enrollmentId,
  userId,
}: DiaryPublicLinkManagerProps) {
  const [links, setLinks] = useState<PublicAccessLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<string>('30');

  useEffect(() => {
    loadLinks();
  }, [enrollmentId]);

  async function loadLinks() {
    try {
      setLoading(true);
      const data = await diaryNotificationService.getPublicAccessLinks(enrollmentId);
      setLinks(data);
    } catch (error: any) {
      console.error('Erro ao carregar links:', error);
      toast.error('Erro ao carregar links públicos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLink() {
    try {
      setLoading(true);
      const expiresDays = expiresInDays === 'never' ? undefined : parseInt(expiresInDays);
      const link = await diaryNotificationService.createPublicAccessLink(
        enrollmentId,
        userId,
        expiresDays
      );

      const publicUrl = `${window.location.origin}/diary/public/${enrollmentId}?token=${link.access_token}`;
      
      toast.success('Link público criado com sucesso');
      setCreateDialogOpen(false);
      await loadLinks();

      // Copiar link para área de transferência
      await navigator.clipboard.writeText(publicUrl);
      toast.info('Link copiado para a área de transferência');
    } catch (error: any) {
      console.error('Erro ao criar link:', error);
      toast.error(error.message || 'Erro ao criar link público');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink(link: PublicAccessLink) {
    const publicUrl = `${window.location.origin}/diary/public/${enrollmentId}?token=${link.access_token}`;
    await navigator.clipboard.writeText(publicUrl);
    toast.success('Link copiado para a área de transferência');
  }

  async function handleRevokeLink(linkId: string) {
    if (!confirm('Deseja realmente revogar este link? Ele não poderá mais ser acessado.')) {
      return;
    }

    try {
      await diaryNotificationService.revokePublicAccessLink(linkId);
      toast.success('Link revogado com sucesso');
      await loadLinks();
    } catch (error: any) {
      console.error('Erro ao revogar link:', error);
      toast.error('Erro ao revogar link');
    }
  }

  function isLinkExpired(link: PublicAccessLink): boolean {
    if (!link.expires_at) return false;
    return new Date(link.expires_at) < new Date();
  }

  function getLinkStatus(link: PublicAccessLink): 'active' | 'expired' | 'inactive' {
    if (!link.is_active) return 'inactive';
    if (isLinkExpired(link)) return 'expired';
    return 'active';
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Links Públicos de Acesso
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compartilhe links seguros para responsáveis consultarem o diário
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Link className="h-4 w-4 mr-2" />
              Criar Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando links...
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Nenhum link público criado</p>
              <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                Criar Primeiro Link
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const status = getLinkStatus(link);
                const publicUrl = `${window.location.origin}/diary/public/${enrollmentId}?token=${link.access_token}`;

                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {link.access_token.substring(0, 20)}...
                        </code>
                        <Badge
                          variant={
                            status === 'active'
                              ? 'default'
                              : status === 'expired'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {status === 'active'
                            ? 'Ativo'
                            : status === 'expired'
                            ? 'Expirado'
                            : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Criado em {format(new Date(link.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {link.expires_at && (
                          <span>
                            Expira em {format(new Date(link.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                        <span>Acessos: {link.access_count}</span>
                        {link.last_accessed_at && (
                          <span>
                            Último acesso: {format(new Date(link.last_accessed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(link)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(publicUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeLink(link.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criar Link */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Link Público</DialogTitle>
            <DialogDescription>
              Crie um link seguro para compartilhar o acesso ao diário escolar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="expiresIn">Expira em</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="expiresIn">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="180">180 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                  <SelectItem value="never">Nunca expira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLink} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


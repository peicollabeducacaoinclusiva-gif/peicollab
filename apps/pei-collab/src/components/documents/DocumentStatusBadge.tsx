import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  em_validacao: { label: 'Em validação', variant: 'outline' },
  aprovado: { label: 'Aprovado', variant: 'default' },
  arquivado: { label: 'Arquivado', variant: 'secondary' },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const mapped = statusMap[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
}

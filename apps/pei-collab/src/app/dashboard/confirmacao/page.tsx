'use client';

import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFamilyConfirmations } from '@/hooks/useFamilyConfirmations';
import type { FamilyConfirmation } from '@/hooks/useFamilyConfirmations';
import { CheckCircle2, Clock } from 'lucide-react';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default function ConfirmacaoPage() {
  const { confirmations, summary, loading, error } = useFamilyConfirmations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Confirmação da Família</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe os documentos enviados para confirmação das famílias.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex gap-3 pt-6">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
            P
          </div>
          <div>
            <h3 className="font-medium text-amber-900">O que é confirmação da família?</h3>
            <p className="mt-1 text-sm text-amber-800">
              A confirmação de família é importante para garantir que os pais/responsáveis estão
              cientes e concordam com os planos educacionais de seus filhos. Quando você envia um
              documento, a família recebe uma mensagem clara pedindo para confirmar que leu e
              concorda com o conteúdo.
            </p>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <span className="text-2xl font-semibold text-orange-800">{summary.pendentes}</span>
              <p className="text-sm text-orange-700">Pendentes</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <span className="text-2xl font-semibold text-emerald-800">{summary.confirmadas}</span>
              <p className="text-sm text-emerald-700">Confirmadas</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <span className="text-2xl font-semibold text-red-800">{summary.rejeitadas}</span>
              <p className="text-sm text-red-700">Rejeitadas</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-4">
          {confirmations.map((item) => (
            <ConfirmationCard key={item.document_id} item={item} />
          ))}
          {confirmations.length === 0 && (
            <EmptyState
              icon={CheckCircle2}
              title="Nenhum documento aguardando confirmação"
              description="Documentos enviados para a família aparecerão aqui. Crie e envie documentos no perfil do aluno."
              action={{ label: 'Ver documentos', href: '/dashboard/documents' }}
            />
          )}
        </div>
      )}

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <h3 className="font-medium text-amber-900">Como usar a confirmação da família?</h3>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-amber-800">
            <li>
              <strong>Enviar:</strong> Quando você cria um documento, ele é automaticamente enviado
              para a família.
            </li>
            <li>
              <strong>Aguardar:</strong> A família recebe uma mensagem clara pedindo para confirmar
              que leu.
            </li>
            <li>
              <strong>Acompanhar:</strong> Aqui você vê o status de cada confirmação.
            </li>
            <li>
              <strong>Agir:</strong> Se rejeitado, revise o documento e envie novamente.
            </li>
          </ol>
        </CardContent>
      </Card>

      <details className="mt-6">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          Dicas de acessibilidade
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Clique em qualquer item para ver detalhes. Todos os botões têm rótulos descritivos. Use Tab
          para navegar e Enter para confirmar ações.
        </p>
      </details>
    </div>
  );
}

function ConfirmationCard({ item }: { item: FamilyConfirmation }) {
  const isPendente = item.status === 'pendente';
  const isConfirmado = item.status === 'confirmado';

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <div>
          <h3 className="font-semibold">{item.tipo_documento}</h3>
          <p className="text-sm text-muted-foreground">{item.student_nome}</p>
          <p className="text-xs text-muted-foreground">Enviado em {formatDate(item.enviado_em)}</p>
        </div>
        <Badge
          variant="outline"
          className={`flex items-center gap-1 ${
            isConfirmado
              ? 'border-emerald-600 bg-emerald-100 text-emerald-800'
              : isPendente
                ? 'border-orange-600 bg-orange-100 text-orange-800'
                : 'border-red-600 bg-red-100 text-red-800'
          }`}
        >
          {isConfirmado ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          {isConfirmado ? 'Confirmado' : isPendente ? 'Pendente' : 'Rejeitado'}
        </Badge>
        <Link
          href={`/dashboard/students/${item.student_id}/documents/${item.document_id}`}
          className="text-sm font-medium text-emerald-600 hover:underline"
        >
          Ver documento →
        </Link>
      </CardContent>
    </Card>
  );
}

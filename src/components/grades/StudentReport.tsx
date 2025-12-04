// ============================================================================
// COMPONENTE: StudentReport
// ============================================================================
// Boletim completo do aluno com todas as disciplinas
// Gestão Escolar - Fase 7
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { getStudentBoletim } from '@pei/database/queries';

interface StudentReportProps {
  enrollmentId: string;
  studentName: string;
  anoLetivo: string;
}

export function StudentReport({ 
  enrollmentId, 
  studentName,
  anoLetivo 
}: StudentReportProps) {
  const [boletim, setBoletim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBoletim();
  }, [enrollmentId]);

  const loadBoletim = async () => {
    try {
      const data = await getStudentBoletim(enrollmentId);
      setBoletim(data);
    } catch (error: any) {
      console.error('Erro ao carregar boletim:', error);
      toast({
        title: 'Erro ao carregar boletim',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    const variants: Record<string, any> = {
      'Aprovado': 'default',
      'Recuperação': 'secondary',
      'Reprovado': 'destructive',
    };
    return <Badge variant={variants[situacao] || 'outline'}>{situacao}</Badge>;
  };

  const getMediaColor = (media: number) => {
    if (media >= 7) return 'text-green-600 font-bold';
    if (media >= 6) return 'text-blue-600 font-bold';
    if (media >= 5) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const getMediaIcon = (media: number) => {
    if (media >= 7) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (media >= 6) return <Award className="h-4 w-4 text-blue-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const generatePDF = async () => {
    setGenerating(true);
    
    try {
      toast({
        title: '📄 Gerando PDF...',
        description: 'Por favor aguarde',
      });

      // TODO: Implementar geração de PDF real
      // Por enquanto, simular com window.print()
      window.print();

      toast({
        title: '✅ PDF gerado!',
        description: 'Boletim pronto para impressão',
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando boletim...</div>;
  }

  if (!boletim) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Nenhuma nota lançada ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="boletim-print">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{studentName}</h2>
          <p className="text-gray-600">Boletim Escolar - {anoLetivo}</p>
        </div>

        <Button onClick={generatePDF} disabled={generating}>
          <Download className="h-4 w-4 mr-2" />
          {generating ? 'Gerando...' : 'Baixar PDF'}
        </Button>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold">{boletim.media_geral.toFixed(1)}</p>
              {getMediaIcon(boletim.media_geral)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{boletim.taxa_presenca.toFixed(1)}%</p>
            <p className="text-xs text-gray-600 mt-1">
              {boletim.total_faltas} falta(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Situação</CardTitle>
          </CardHeader>
          <CardContent>
            {getSituacaoBadge(
              boletim.media_geral >= 6 ? 'Aprovado' :
              boletim.media_geral >= 5 ? 'Recuperação' : 'Reprovado'
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notas por Disciplina */}
      <Card>
        <CardHeader>
          <CardTitle>Notas por Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-center">1º Bim</TableHead>
                <TableHead className="text-center">2º Bim</TableHead>
                <TableHead className="text-center">3º Bim</TableHead>
                <TableHead className="text-center">4º Bim</TableHead>
                <TableHead className="text-center">Média</TableHead>
                <TableHead className="text-center">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boletim.disciplinas.map((disc: any) => (
                <TableRow key={disc.subject_id}>
                  <TableCell className="font-medium">
                    {disc.subject_nome}
                    {disc.subject_codigo && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({disc.subject_codigo})
                      </span>
                    )}
                  </TableCell>
                  
                  {/* Notas por bimestre */}
                  {[1, 2, 3, 4].map((bim) => {
                    const nota = disc.avaliacoes.find((a: any) => a.periodo === bim.toString());
                    return (
                      <TableCell key={bim} className="text-center">
                        {nota ? (
                          <span className={getMediaColor(nota.nota_valor || 0)}>
                            {nota.nota_conceito || nota.nota_valor?.toFixed(1) || '-'}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell className="text-center">
                    <span className={getMediaColor(disc.media_final)}>
                      {disc.media_final.toFixed(1)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getSituacaoBadge(disc.situacao)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Observações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700">
          <p>
            O aluno {studentName} apresentou média geral de {boletim.media_geral.toFixed(1)} no ano letivo de {anoLetivo}.
            {boletim.taxa_presenca >= 75 ? (
              ' Frequência adequada.'
            ) : (
              ' Atenção: Frequência abaixo do recomendado (75%).'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


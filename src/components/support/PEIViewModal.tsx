// src/components/support/PEIViewModal.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Target, MessageSquare, Send, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PEIViewModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user: {
    full_name: string;
  };
}

export function PEIViewModal({ studentId, studentName, isOpen, onClose }: PEIViewModalProps) {
  const [pei, setPei] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingPEI, setIsLoadingPEI] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && studentId) {
      loadPEI();
      loadComments();
    }
  }, [isOpen, studentId]);

  const loadPEI = async () => {
    setIsLoadingPEI(true);
    try {
      const { data, error } = await supabase
        .from('peis')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setPei(data);
    } catch (error: any) {
      console.error('Erro ao carregar PEI:', error);
      toast({
        title: "Erro ao carregar PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPEI(false);
    }
  };

  const loadComments = async () => {
    try {
      if (!pei) return;

      // Usar função RPC ao invés de query direta
      const { data, error } = await supabase.rpc('get_pei_comments', {
        p_pei_id: pei.id
      });

      if (error) {
        console.error('Erro ao carregar comentários:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        const commentsFormatted = data.map((comment: any) => ({
          id: comment.id,
          comment_text: comment.comment_text,
          created_at: comment.created_at,
          user: {
            full_name: comment.user_name || 'Desconhecido'
          }
        }));
        setComments(commentsFormatted);
      }
    } catch (error: any) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Digite um comentário antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    if (!pei) return;

    setIsSubmittingComment(true);

    try {
      // Usar função RPC ao invés de insert direto
      const { data, error } = await supabase.rpc('add_pei_comment', {
        p_pei_id: pei.id,
        p_comment_text: newComment,
      });

      if (error) throw error;

      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi registrado com sucesso.",
      });

      setNewComment("");
      loadComments();
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!pei && !isLoadingPEI) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>PEI - {studentName}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Este aluno ainda não possui um PEI criado.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const diagnosisData = pei?.diagnosis_data || {};
  const planningData = pei?.planning_data || {};
  const evaluationData = pei?.evaluation_data || {};
  const goals = planningData.goals || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PEI - {studentName}
          </DialogTitle>
          <DialogDescription>
            Visualização do Plano Educacional Individualizado (apenas leitura para PA)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant={pei?.status === 'approved' ? 'default' : 'secondary'}>
                Status: {pei?.status === 'approved' ? 'Aprovado' : pei?.status}
              </Badge>
              {pei?.created_at && (
                <span className="text-sm text-muted-foreground">
                  Criado em {format(new Date(pei.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </div>

            <Separator />

            {/* Diagnóstico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {diagnosisData.disability_type && (
                  <div>
                    <p className="text-sm font-medium">Tipo de Deficiência:</p>
                    <p className="text-sm text-muted-foreground">{diagnosisData.disability_type}</p>
                  </div>
                )}
                
                {diagnosisData.strengths && diagnosisData.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Pontos Fortes:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {diagnosisData.strengths.map((strength: string, idx: number) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosisData.challenges && diagnosisData.challenges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Desafios:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {diagnosisData.challenges.map((challenge: string, idx: number) => (
                        <li key={idx}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosisData.interests && diagnosisData.interests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Interesses:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {diagnosisData.interests.map((interest: string, idx: number) => (
                        <li key={idx}>{interest}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metas */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Metas Educacionais ({goals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goals.map((goal: any, idx: number) => (
                    <div key={goal.id || idx} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline">{goal.category || 'Geral'}</Badge>
                        <h4 className="font-semibold flex-1">{goal.title}</h4>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}
                      {goal.strategies && goal.strategies.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Estratégias:</p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {goal.strategies.map((strategy: string, sidx: number) => (
                              <li key={sidx}>{strategy}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Adaptações e Recursos */}
            {(planningData.accommodations || planningData.resources) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Adaptações e Recursos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {planningData.accommodations && planningData.accommodations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Adaptações:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {planningData.accommodations.map((acc: string, idx: number) => (
                          <li key={idx}>{acc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {planningData.resources && planningData.resources.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Recursos:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {planningData.resources.map((resource: string, idx: number) => (
                          <li key={idx}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {evaluationData.observations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{evaluationData.observations}</p>
                </CardContent>
              </Card>
            )}

            {/* Seção de Comentários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentários do Profissional de Apoio
                </CardTitle>
                <CardDescription>
                  Registre suas observações sobre o acompanhamento do aluno
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Novo Comentário */}
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Digite suas observações sobre o acompanhamento do aluno, progressos observados, dificuldades, etc..."
                    rows={4}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmittingComment ? 'Enviando...' : 'Adicionar Comentário'}
                  </Button>
                </div>

                {/* Lista de Comentários */}
                {comments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Comentários Anteriores ({comments.length})</h4>
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium">{comment.user.full_name}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.comment_text}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


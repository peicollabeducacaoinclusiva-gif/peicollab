import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface PEITeacher {
  teacher_id: string;
  teacher_name: string;
  is_primary: boolean;
  subject: string | null;
  can_edit_diagnosis: boolean;
  can_edit_planning: boolean;
  can_edit_evaluation: boolean;
}

interface Props {
  peiId: string;
  studentName: string;
  onTeachersUpdated?: () => void;
}

export default function ManagePEITeachersDialog({ peiId, studentName, onTeachersUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<PEITeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTeachers();
    }
  }, [open, peiId]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_pei_teachers', {
        p_pei_id: peiId
      });

      if (error) {
        console.error("Erro RPC:", error);
        throw error;
      }
      
      setTeachers(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar professores:", error);
      
      // Se a função RPC não existir, tentar busca direta
      if (error.message?.includes('does not exist')) {
        try {
          const { data: directData, error: directError } = await supabase
            .from('pei_teachers')
            .select(`
              teacher_id,
              is_primary,
              subject,
              can_edit_diagnosis,
              can_edit_planning,
              can_edit_evaluation,
              profiles:teacher_id (full_name)
            `)
            .eq('pei_id', peiId);

          if (directError) throw directError;

          const formattedData = directData?.map((pt: any) => ({
            teacher_id: pt.teacher_id,
            teacher_name: pt.profiles?.full_name || 'Desconhecido',
            is_primary: pt.is_primary,
            subject: pt.subject,
            can_edit_diagnosis: pt.can_edit_diagnosis,
            can_edit_planning: pt.can_edit_planning,
            can_edit_evaluation: pt.can_edit_evaluation,
          })) || [];

          setTeachers(formattedData);
          return;
        } catch (fallbackError) {
          console.error("Erro na busca direta:", fallbackError);
        }
      }
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar os professores. Verifique se a migração foi aplicada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const primaryTeacher = teachers.find(t => t.is_primary);
  const complementaryTeachers = teachers.filter(t => !t.is_primary);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Professores ({teachers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipe de Professores do PEI
          </DialogTitle>
          <DialogDescription>
            Aluno: <span className="font-semibold text-foreground">{studentName}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Professor Principal */}
              {primaryTeacher && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    Professor Principal (Responsável)
                  </h3>
                  <div className="p-4 border-2 border-primary/50 bg-primary/5 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{primaryTeacher.teacher_name}</p>
                        {primaryTeacher.subject && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Disciplina: {primaryTeacher.subject}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="default" className="text-xs">
                            Responsável pelo PEI
                          </Badge>
                          {primaryTeacher.can_edit_diagnosis && (
                            <Badge variant="outline" className="text-xs">
                              Edita diagnóstico
                            </Badge>
                          )}
                          {primaryTeacher.can_edit_planning && (
                            <Badge variant="outline" className="text-xs">
                              Edita planejamento
                            </Badge>
                          )}
                          {primaryTeacher.can_edit_evaluation && (
                            <Badge variant="outline" className="text-xs">
                              Edita avaliação
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professores Complementares */}
              {complementaryTeachers.length > 0 && (
                <>
                  {primaryTeacher && <Separator />}
                  <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Professores Complementares ({complementaryTeachers.length})
                    </h3>
                    <div className="space-y-3">
                      {complementaryTeachers.map((teacher) => (
                        <div
                          key={teacher.teacher_id}
                          className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{teacher.teacher_name}</p>
                            {teacher.subject && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Disciplina: {teacher.subject}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {teacher.can_edit_planning && (
                                <Badge variant="secondary" className="text-xs">
                                  Planejamento
                                </Badge>
                              )}
                              {teacher.can_edit_evaluation && (
                                <Badge variant="secondary" className="text-xs">
                                  Avaliação
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* TODO: Adicionar botão de remover para coordenadores */}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Estado vazio */}
              {teachers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">Nenhum professor atribuído ainda</p>
                  <p className="text-sm text-muted-foreground">
                    A migração pode não ter sido aplicada ou o PEI foi criado antes da atualização.
                  </p>
                </div>
              )}
            </div>

            {/* Informativo */}
            {teachers.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Dica:</strong> O professor principal é responsável pelo PEI completo. 
                  Professores complementares podem adicionar metas e estratégias específicas das suas disciplinas.
                </p>
              </div>
            )}
          </ScrollArea>
        )}

        {/* TODO: Adicionar botão "Adicionar Professor" para coordenadores */}
        {!loading && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            {/* <Button onClick={handleAddTeacher}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Professor
            </Button> */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}







































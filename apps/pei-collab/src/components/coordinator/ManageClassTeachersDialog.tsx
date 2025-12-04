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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Trash2, Star, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface ClassTeacher {
  id: string;
  teacher_id: string;
  teacher_name: string;
  subject: string;
  is_primary_subject: boolean;
  workload_hours: number;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Props {
  schoolId: string;
  academicYear: number;
  grade: string;
  className: string;
  shift?: string;
  onTeachersUpdated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const SUBJECTS = [
  "Português",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Inglês",
  "Educação Física",
  "Artes",
  "Música",
  "Ensino Religioso",
];

export default function ManageClassTeachersDialog({
  schoolId,
  academicYear,
  grade,
  className,
  shift,
  onTeachersUpdated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Usar controle externo se fornecido, senão usar interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [classTeachers, setClassTeachers] = useState<ClassTeacher[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  
  // Form state
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [workloadHours, setWorkloadHours] = useState("4");
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, schoolId, academicYear, grade, className]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClassTeachers(), loadAvailableTeachers()]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassTeachers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_class_teachers', {
        p_school_id: schoolId,
        p_academic_year: academicYear,
        p_grade: grade,
        p_class_name: className,
      });

      if (error) {
        console.error("Erro ao carregar professores da turma:", error);
        
        // Fallback: busca direta
        const { data: directData, error: directError } = await supabase
          .from('class_teachers')
          .select(`
            id,
            teacher_id,
            subject,
            is_primary_subject,
            workload_hours,
            profiles:teacher_id (full_name)
          `)
          .eq('school_id', schoolId)
          .eq('academic_year', academicYear)
          .eq('grade', grade)
          .eq('class_name', className);

        if (directError) throw directError;

        const formatted = directData?.map((ct: any) => ({
          id: ct.id,
          teacher_id: ct.teacher_id,
          teacher_name: ct.profiles?.full_name || 'Desconhecido',
          subject: ct.subject,
          is_primary_subject: ct.is_primary_subject,
          workload_hours: ct.workload_hours,
        })) || [];

        setClassTeachers(formatted);
      } else {
        setClassTeachers(data || []);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar professores da turma.",
        variant: "destructive",
      });
    }
  };

  const loadAvailableTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('school_id', schoolId)
        .order('full_name');

      if (error) throw error;
      setAvailableTeachers(data || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
    }
  };

  const handleAddTeacher = async () => {
    if (!selectedTeacherId || !selectedSubject) {
      toast({
        title: "Atenção",
        description: "Selecione um professor e uma disciplina.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdding(true);

      const { error } = await supabase.rpc('add_teacher_to_class', {
        p_school_id: schoolId,
        p_academic_year: academicYear,
        p_grade: grade,
        p_class_name: className,
        p_teacher_id: selectedTeacherId,
        p_subject: selectedSubject,
        p_is_primary: isPrimary,
        p_workload_hours: parseInt(workloadHours) || 4,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Professor adicionado à turma!",
      });

      // Resetar form
      setSelectedTeacherId("");
      setSelectedSubject("");
      setIsPrimary(false);
      setWorkloadHours("4");

      await loadClassTeachers();
      onTeachersUpdated?.();
    } catch (error: any) {
      console.error("Erro ao adicionar professor:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar professor.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTeacher = async (classTeacherId: string) => {
    try {
      const { error } = await supabase.rpc('remove_teacher_from_class', {
        p_class_teacher_id: classTeacherId,
      });

      if (error) throw error;

      toast({
        title: "Removido",
        description: "Professor removido da turma.",
      });

      await loadClassTeachers();
      onTeachersUpdated?.();
    } catch (error: any) {
      console.error("Erro ao remover professor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover professor.",
        variant: "destructive",
      });
    }
  };

  const primaryTeacher = classTeachers.find(t => t.is_primary_subject);
  const otherTeachers = classTeachers.filter(t => !t.is_primary_subject);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Professores da Turma ({classTeachers.length})
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Professores da Turma
          </DialogTitle>
          <DialogDescription>
            {grade} - Turma {className}{shift ? ` (${shift})` : ''} • Ano Letivo {academicYear}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Professor Principal */}
              {primaryTeacher && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    Professor Responsável (Disciplina Principal)
                  </h3>
                  <div className="p-4 border-2 border-primary/50 bg-primary/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{primaryTeacher.teacher_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {primaryTeacher.subject} • {primaryTeacher.workload_hours}h/semana
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTeacher(primaryTeacher.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Outros Professores */}
              {otherTeachers.length > 0 && (
                <>
                  {primaryTeacher && <Separator />}
                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Professores das Demais Disciplinas ({otherTeachers.length})
                    </h3>
                    <div className="space-y-2">
                      {otherTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                        >
                          <div>
                            <p className="font-medium">{teacher.teacher_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {teacher.subject} • {teacher.workload_hours}h/semana
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTeacher(teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Adicionar Professor */}
              <Separator />
              <div>
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Professor
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="teacher">Professor</Label>
                      <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger id="teacher">
                          <SelectValue placeholder="Selecione o professor" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTeachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Disciplina</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Selecione a disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="workload">Carga Horária (h/semana)</Label>
                      <Input
                        id="workload"
                        type="number"
                        min="1"
                        max="40"
                        value={workloadHours}
                        onChange={(e) => setWorkloadHours(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrimary}
                          onChange={(e) => setIsPrimary(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Responsável pelo PEI</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleAddTeacher}
                    disabled={adding || !selectedTeacherId || !selectedSubject}
                    className="w-full"
                  >
                    {adding ? (
                      <>Adicionando...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Professor
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Informativo */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  💡 <strong>Atribuição Automática:</strong> Quando um PEI for criado para um aluno desta turma,
                  todos esses professores serão automaticamente adicionados ao PEI!
                </p>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}


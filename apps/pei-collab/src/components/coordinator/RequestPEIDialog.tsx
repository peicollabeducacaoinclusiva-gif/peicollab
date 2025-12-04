import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface RequestPEIDialogProps {
  tenantId: string;
  schoolId?: string;
  coordinatorId: string;
  onPEICreated: () => void;
  disabled?: boolean;
}

interface Student {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

const RequestPEIDialog = ({
  tenantId,
  schoolId,
  coordinatorId,
  onPEICreated,
  disabled = false,
}: RequestPEIDialogProps) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [createDirectly, setCreateDirectly] = useState(false); // Novo: Coordenador preenche ele mesmo
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && (tenantId || schoolId)) {
      loadData();
    }
  }, [open, tenantId, schoolId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar alunos da escola ou tenant
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name")
        .eq(schoolId ? "school_id" : "tenant_id", schoolId || tenantId)
        .order("name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Carregar professores da escola ou tenant
      if (schoolId) {
        // Buscar professores diretamente por school_id
        const { data: teachersData, error: teachersError } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("school_id", schoolId)
          .in("role", ["teacher", "aee_teacher"])
          .order("full_name");

        if (teachersError) throw teachersError;
        setTeachers(teachersData || []);
      } else {
        // Buscar professores do tenant através de user_tenants + profiles
        const { data: userTenantsData, error: userTenantsError } = await supabase
          .from("user_tenants")
          .select("user_id")
          .eq("tenant_id", tenantId);

        if (userTenantsError) throw userTenantsError;

        const userIds = userTenantsData?.map((ut: any) => ut.user_id) || [];

        if (userIds.length > 0) {
          // Buscar professores - filtrar apenas teacher e aee_teacher
          const { data: rolesData, error: rolesError } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .in("id", userIds)
            .in("role", ["teacher", "aee_teacher"]);

          if (rolesError) throw rolesError;

          // Criar Set com IDs de professores
          const teacherUserIds = new Set(rolesData?.map((r: any) => r.id) || []);

          if (teacherUserIds.size > 0) {
            // Buscar profiles dos professores
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", Array.from(teacherUserIds));

            if (profilesError) throw profilesError;

            const teachersData: Teacher[] = profilesData?.map((p: any) => ({
              id: p.id,
              full_name: p.full_name,
            })) || [];

            setTeachers(teachersData);
          } else {
            setTeachers([]);
          }
        } else {
          setTeachers([]);
        }
      }

    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Se criar diretamente, apenas redirecionar para a página de criação
    if (createDirectly) {
      if (!selectedStudentId) {
        toast({
          title: "Campo obrigatório",
          description: "Selecione um aluno",
          variant: "destructive",
        });
        return;
      }
      
      // Redirecionar para página de criar PEI com o aluno selecionado
      navigate(`/pei/new?student=${selectedStudentId}`);
      setOpen(false);
      setSelectedStudentId("");
      setSelectedTeacherId("");
      setCreateDirectly(false);
      return;
    }
    
    if (!selectedStudentId || !selectedTeacherId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um aluno e um professor",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Buscar school_id do aluno selecionado
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("school_id, tenant_id")
        .eq("id", selectedStudentId)
        .single();

      if (studentError) throw studentError;

      // Verificar se aluno já tem PEI ativo
      const { data: existingPEI } = await supabase
        .from("peis")
        .select("id, status, assigned_teacher_id, version_number")
        .eq("student_id", selectedStudentId)
        .eq("is_active_version", true)
        .maybeSingle();

      if (existingPEI) {
        // Já existe PEI ativo - atualizar professor atribuído se necessário
        if (existingPEI.assigned_teacher_id !== selectedTeacherId) {
          const { error: updateError } = await supabase
            .from("peis")
            .update({ assigned_teacher_id: selectedTeacherId })
            .eq("id", existingPEI.id);
          
          if (updateError) throw updateError;
          
          console.log("✅ Professor reatribuído ao PEI existente");
        }
        
        // Criar student_access
        await supabase
          .from("student_access")
          .upsert({
            user_id: selectedTeacherId,
            student_id: selectedStudentId
          }, {
            onConflict: 'user_id,student_id',
            ignoreDuplicates: true
          });
        
        toast({
          title: "PEI já existe!",
          description: `Este aluno já possui um PEI ativo (${existingPEI.status}). O professor foi atribuído e pode continuar trabalhando nele.`,
        });
        
        setOpen(false);
        setSelectedStudentId("");
        setSelectedTeacherId("");
        onPEICreated();
        return;
      }

      // Se não existe, criar novo PEI
      // Buscar próximo número de versão
      const { data: versionData } = await supabase
        .from("peis")
        .select("version_number")
        .eq("student_id", selectedStudentId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextVersion = (versionData?.version_number || 0) + 1;
      
      const { data: peiData, error: peiError } = await supabase
        .from("peis")
        .insert({
          student_id: selectedStudentId,
          school_id: schoolId || studentData.school_id,
          tenant_id: tenantId || studentData.tenant_id,
          created_by: coordinatorId,
          assigned_teacher_id: selectedTeacherId,
          status: "draft",
          version_number: nextVersion,
          is_active_version: true,  // Marcar como versão ativa
          diagnosis_data: {},
          planning_data: {},
          evaluation_data: {},
        })
        .select()
        .single();

      if (peiError) throw peiError;

      // CRÍTICO: Criar entrada em student_access para que o professor possa ver o aluno
      const { error: accessError } = await supabase
        .from("student_access")
        .upsert({
          user_id: selectedTeacherId,
          student_id: selectedStudentId
        }, {
          onConflict: 'user_id,student_id',
          ignoreDuplicates: true
        });

      if (accessError) {
        console.error("⚠️ Erro ao criar student_access:", accessError);
        // Não falhar a operação por causa disso, apenas logar
      } else {
        console.log("✅ Acesso ao aluno criado para o professor");
      }

      console.log("✅ PEI criado com sucesso:", {
        peiId: peiData.id,
        studentId: selectedStudentId,
        schoolId: schoolId || studentData.school_id,
        tenantId: tenantId || studentData.tenant_id,
        teacherId: selectedTeacherId,
        status: "draft"
      });

      toast({
        title: "PEI solicitado com sucesso!",
        description: "O professor foi notificado e pode acessar o aluno e o PEI.",
      });

      setOpen(false);
      setSelectedStudentId("");
      setSelectedTeacherId("");
      onPEICreated();
    } catch (error: any) {
      console.error("Erro ao criar PEI:", error);
      toast({
        title: "Erro ao solicitar PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Solicitar PEI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo PEI</DialogTitle>
          <DialogDescription>
            {createDirectly 
              ? "Você irá criar e preencher o PEI diretamente"
              : "Selecione um aluno e atribua um professor para criar o PEI"
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Opção: Criar Diretamente */}
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-center gap-3 mt-1">
                <Checkbox
                  id="createDirectly"
                  checked={createDirectly}
                  onCheckedChange={(checked) => {
                    setCreateDirectly(!!checked);
                    if (checked) {
                      setSelectedTeacherId(""); // Limpar seleção de professor
                    }
                  }}
                />
                <Label 
                  htmlFor="createDirectly" 
                  className="text-sm font-medium cursor-pointer text-blue-900 dark:text-blue-200"
                >
                  Criar e preencher PEI diretamente (situação especial)
                </Label>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label htmlFor="student">Aluno *</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              disabled={loading}
            >
              <SelectTrigger id="student">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {loading ? "Carregando..." : "Nenhum aluno encontrado"}
                  </div>
                ) : (
                  students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {!createDirectly && (
            <div className="grid gap-2">
              <Label htmlFor="teacher">Professor Responsável *</Label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                disabled={loading}
              >
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {loading ? "Carregando..." : "Nenhum professor encontrado"}
                    </div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {!createDirectly && teachers.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded border border-yellow-200">
              Nenhum professor encontrado nesta escola. Verifique se há professores cadastrados e vinculados.
            </p>
          )}
          
          {createDirectly && (
            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Situação Especial:</strong> Você será redirecionado para preencher todo o PEI. 
                Esta opção deve ser usada apenas quando não houver professor disponível ou em casos urgentes.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setCreateDirectly(false);
              setSelectedStudentId("");
              setSelectedTeacherId("");
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : (createDirectly ? "Criar e Preencher" : "Solicitar PEI")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestPEIDialog;
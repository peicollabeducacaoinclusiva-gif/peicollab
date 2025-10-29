import { useState, useEffect } from "react";
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
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestPEIDialogProps {
  tenantId: string;
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
  const { toast } = useToast();

  useEffect(() => {
    if (open && tenantId) {
      loadData();
    }
  }, [open, tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar alunos do tenant
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .order("name");

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Carregar professores do tenant através de user_tenants + profiles
      // Primeiro, buscar todos os user_ids do tenant
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

      // Criar PEI
      const { data: peiData, error: peiError } = await supabase
        .from("peis")
        .insert({
          student_id: selectedStudentId,
          tenant_id: tenantId,
          created_by: coordinatorId,
          assigned_teacher_id: selectedTeacherId,
          status: "draft",
          diagnosis_data: {},
          planning_data: {},
          evaluation_data: {},
        })
        .select()
        .single();

      if (peiError) throw peiError;

      toast({
        title: "PEI solicitado com sucesso!",
        description: "O professor foi notificado e pode começar a trabalhar no PEI.",
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Novo PEI</DialogTitle>
          <DialogDescription>
            Selecione um aluno e atribua um professor para criar o PEI
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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

          {teachers.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded border border-yellow-200">
              Nenhum professor encontrado nesta escola. Verifique se há professores cadastrados e vinculados.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Criando..." : "Solicitar PEI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestPEIDialog;
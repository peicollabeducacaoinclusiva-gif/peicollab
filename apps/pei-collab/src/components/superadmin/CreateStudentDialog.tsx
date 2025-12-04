import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface CreateStudentDialogProps {
  tenants: any[];
  onStudentCreated: () => void;
  schoolId?: string;
}

const CreateStudentDialog = ({ tenants, onStudentCreated, schoolId }: CreateStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    fatherName: "",
    motherName: "",
    phone: "",
    email: "",
    tenantId: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schoolId && !formData.tenantId) {
      toast({
        title: "Erro",
        description: "Selecione uma escola para o aluno.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const studentData: any = {
        name: formData.name,
        date_of_birth: formData.dateOfBirth || null,
        father_name: formData.fatherName || null,
        mother_name: formData.motherName || null,
        phone: formData.phone || null,
        email: formData.email || null,
      };

      // Se schoolId está disponível, buscar tenant_id da escola
      if (schoolId) {
        studentData.school_id = schoolId;
        // Buscar tenant_id da escola
        const { data: schoolData } = await supabase
          .from('schools')
          .select('tenant_id')
          .eq('id', schoolId)
          .single();
        
        if (schoolData?.tenant_id) {
          studentData.tenant_id = schoolData.tenant_id;
        } else {
          throw new Error('Não foi possível determinar a rede da escola');
        }
      } else {
        studentData.tenant_id = formData.tenantId;
      }

      const { error } = await supabase.from("students").insert(studentData);

      if (error) {
        console.error('❌ Erro ao inserir aluno:', error);
        throw error;
      }

      toast({
        title: "Aluno cadastrado!",
        description: `${formData.name} foi cadastrado com sucesso.`,
      });

      setOpen(false);
      setFormData({ name: "", dateOfBirth: "", fatherName: "", motherName: "", phone: "", email: "", tenantId: "" });
      onStudentCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar aluno",
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
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
            <DialogDescription>
              Preencha os dados do aluno para cadastrá-lo no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!schoolId && (
              <div className="grid gap-2">
                <Label htmlFor="tenant">Escola *</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fatherName">Nome do Pai</Label>
              <Input
                id="fatherName"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="motherName">Nome da Mãe</Label>
              <Input
                id="motherName"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone de Contato</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudentDialog;

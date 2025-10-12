import { useState, useEffect } from "react";
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

interface EditStudentDialogProps {
  student: any;
  tenants: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void;
}

const EditStudentDialog = ({ 
  student, 
  tenants, 
  open, 
  onOpenChange,
  onStudentUpdated 
}: EditStudentDialogProps) => {
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

  useEffect(() => {
    if (student && open) {
      setFormData({
        name: student.name || "",
        dateOfBirth: student.date_of_birth || "",
        fatherName: student.father_name || "",
        motherName: student.mother_name || "",
        phone: student.phone || "",
        email: student.email || "",
        tenantId: student.tenant_id || "",
      });
    }
  }, [student, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId) {
      toast({
        title: "Erro",
        description: "Selecione uma escola para o aluno.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("students")
        .update({
          name: formData.name,
          date_of_birth: formData.dateOfBirth || null,
          father_name: formData.fatherName || null,
          mother_name: formData.motherName || null,
          phone: formData.phone || null,
          email: formData.email || null,
          tenant_id: formData.tenantId,
        })
        .eq("id", student.id);

      if (error) throw error;

      toast({
        title: "Aluno atualizado!",
        description: `${formData.name} foi atualizado com sucesso.`,
      });

      onOpenChange(false);
      onStudentUpdated();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Atualize os dados do aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;

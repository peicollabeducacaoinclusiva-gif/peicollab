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

interface EditUserDialogProps {
  user: {
    id: string;
    full_name: string;
    role: string;
    tenant_id: string | null;
  } | null;
  tenants: Array<{ id: string; name: string }>;
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserDialog = ({ user, tenants, open, onClose, onUserUpdated }: EditUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    role: "teacher" as "teacher" | "coordinator" | "family",
    tenantId: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name,
        role: user.role as any,
        tenantId: user.tenant_id || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          tenant_id: formData.tenantId || null,
        })
        .eq("id", user.id);

      // Atualizar role na tabela user_roles
      if (!error) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert({
            user_id: user.id,
            role: formData.role,
          }, { onConflict: 'user_id' });

        if (roleError) {
          console.error("Erro ao atualizar role:", roleError);
          throw roleError;
        }
      }

      if (error) throw error;

      toast({
        title: "Usuário atualizado!",
        description: "Os dados foram salvos com sucesso.",
      });

      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Papel</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Professor</SelectItem>
                <SelectItem value="coordinator">Coordenador</SelectItem>
                <SelectItem value="aee_teacher">Professor de AEE</SelectItem>
                <SelectItem value="school_manager">Gestor Escolar</SelectItem>
                <SelectItem value="family">Família</SelectItem>
              </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant">Escola</Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) =>
                  setFormData({ ...formData, tenantId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma escola" />
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

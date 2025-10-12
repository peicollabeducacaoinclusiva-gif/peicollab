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

interface CreateUserDialogProps {
  tenants: Array<{ id: string; name: string }>;
  onUserCreated: () => void;
}

const CreateUserDialog = ({ tenants, onUserCreated }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "teacher" as "teacher" | "coordinator" | "family",
    tenantId: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar autenticado para criar usuários');
      }

      // Call the edge function to create the user
      const { data, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          tenantId: formData.tenantId || null,
        },
      });

      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Usuário criado!",
        description: `${formData.fullName} foi cadastrado. Um email foi enviado para definição de senha.`,
      });

      setOpen(false);
      setFormData({
        email: "",
        fullName: "",
        role: "teacher",
        tenantId: "",
      });
      onUserCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
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
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo usuário no sistema.
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

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

interface EditTenantDialogProps {
  tenant: {
    id: string;
    name: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onTenantUpdated: () => void;
}

const EditTenantDialog = ({ tenant, open, onClose, onTenantUpdated }: EditTenantDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (tenant) {
      setName(tenant.name);
      setNetworkName((tenant as any).network_name || "");
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ name, network_name: networkName || null })
        .eq("id", tenant.id);

      if (error) throw error;

      toast({
        title: "Escola atualizada!",
        description: "Os dados foram salvos com sucesso.",
      });

      onTenantUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar escola",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Escola</DialogTitle>
            <DialogDescription>
              Atualize as informações da escola.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="networkName">Nome da Rede de Ensino</Label>
              <Input
                id="networkName"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                placeholder="Ex: Rede Municipal de Ensino"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Escola</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Escola Municipal João Silva"
                required
              />
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

export default EditTenantDialog;

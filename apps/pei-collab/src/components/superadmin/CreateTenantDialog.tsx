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
import { School } from "lucide-react";

interface CreateTenantDialogProps {
  onTenantCreated: () => void;
}

const CreateTenantDialog = ({ onTenantCreated }: CreateTenantDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("tenants").insert({ name, network_name: networkName || null });

      if (error) throw error;

      toast({
        title: "Escola criada!",
        description: `${name} foi cadastrada com sucesso.`,
      });

      setOpen(false);
      setName("");
      setNetworkName("");
      onTenantCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao criar escola",
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
          <School className="mr-2 h-4 w-4" />
          Nova Escola
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Escola</DialogTitle>
            <DialogDescription>
              Cadastre uma nova escola (tenant) no sistema.
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Escola"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTenantDialog;

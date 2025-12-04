import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, ExternalLink, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateUserDialogProps {
  tenants: Array<{ id: string; name: string }>;
  onUserCreated: () => void;
}

const CreateUserDialog = ({ tenants, onUserCreated }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);

  const openGestaoEscolar = () => {
    window.open('http://localhost:5174/users', '_blank');
    setOpen(false);
    // Dar um tempo para o usuário cadastrar e então recarregar
    setTimeout(() => {
      onUserCreated();
    }, 2000);
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
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            Cadastro Centralizado
          </DialogTitle>
          <DialogDescription>
            O cadastro de usuários foi centralizado no app Gestão Escolar para melhor organização e segurança.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="my-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Por que usar o Gestão Escolar?</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Hub único para todos os cadastros</li>
              <li>Importação em lote de sistemas externos</li>
              <li>Validações automáticas e completas</li>
              <li>Auditoria centralizada</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={openGestaoEscolar}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            Abrir Gestão Escolar - Cadastrar Usuário
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Uma nova aba será aberta. Após cadastrar, volte aqui e os dados serão atualizados automaticamente.
          </p>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

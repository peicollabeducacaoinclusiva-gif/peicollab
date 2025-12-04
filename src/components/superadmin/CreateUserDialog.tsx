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
import { UserPlus, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateUserDialogProps {
  tenants: Array<{ id: string; name: string }>;
  onUserCreated: () => void;
}

const CreateUserDialog = ({ tenants, onUserCreated }: CreateUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "teacher" as "teacher" | "coordinator" | "family" | "education_secretary" | "school_manager" | "aee_teacher",
    tenantId: "",
  });
  const { toast } = useToast();

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const startCooldown = () => {
    setCooldownSeconds(30); // 30 second cooldown
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldownSeconds > 0) {
      toast({
        title: "Aguarde o cooldown",
        description: `Por favor, aguarde ${cooldownSeconds} segundos antes de criar outro usuário.`,
        variant: "destructive",
      });
      return;
    }

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
      
      // Check for rate limit error
      if (data?.rateLimitError || data?.error?.includes('Rate limit') || data?.error?.includes('For security purposes')) {
        toast({
          title: "Limite de Criação Atingido",
          description: "Por favor, aguarde 30 segundos antes de criar outro usuário. Isso é uma medida de segurança do Supabase.",
          variant: "destructive",
        });
        startCooldown();
        return;
      }
      
      if (data?.error) throw new Error(data.error);

      // Show success message
      if (data?.warning) {
        toast({
          title: "Usuário criado com aviso",
          description: data.warning,
        });
      } else {
        toast({
          title: "Usuário criado!",
          description: `${formData.fullName} foi cadastrado. Um email foi enviado para definição de senha.`,
        });
      }

      // Start cooldown to prevent rapid successive creations
      startCooldown();

      setOpen(false);
      setFormData({
        email: "",
        fullName: "",
        role: "teacher",
        tenantId: "",
      });
      onUserCreated();
    } catch (error: any) {
      // Check if error message contains rate limit info
      if (error.message?.includes('For security purposes') || error.message?.includes('Rate limit')) {
        toast({
          title: "Limite de Criação Atingido",
          description: "Por favor, aguarde 30 segundos antes de criar outro usuário. Isso é uma medida de segurança do Supabase.",
          variant: "destructive",
        });
        startCooldown();
      } else {
        toast({
          title: "Erro ao criar usuário",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldownSeconds > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={cooldownSeconds > 0}>
          {cooldownSeconds > 0 ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Aguarde {cooldownSeconds}s
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </>
          )}
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
          
          {cooldownSeconds > 0 && (
            <Alert className="mt-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Aguarde <strong>{cooldownSeconds} segundos</strong> antes de criar outro usuário. 
                Isso é uma medida de segurança do Supabase para prevenir abuso.
              </AlertDescription>
            </Alert>
          )}

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
                <SelectItem value="education_secretary">Secretário de Educação</SelectItem>
                <SelectItem value="family">Família</SelectItem>
              </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant">
                {formData.role === 'education_secretary' ? 'Rede de Ensino' : 'Rede/Escola'}
              </Label>
              <Select
                value={formData.tenantId}
                onValueChange={(value) =>
                  setFormData({ ...formData, tenantId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    formData.role === 'education_secretary' 
                      ? "Selecione a rede de ensino" 
                      : "Selecione uma rede/escola (opcional)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma (opcional)</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.role === 'education_secretary' && (
                <p className="text-xs text-gray-500">
                  Secretários de educação têm acesso a todas as escolas da rede
                </p>
              )}
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
            <Button type="submit" disabled={isDisabled}>
              {loading ? (
                "Criando..."
              ) : cooldownSeconds > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Aguarde {cooldownSeconds}s
                </>
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

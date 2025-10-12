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
import { Copy, QrCode, Share2, RefreshCw, Trash2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GenerateFamilyTokenDialogProps {
  peiId: string;
}

const GenerateFamilyTokenDialog = ({ peiId }: GenerateFamilyTokenDialogProps) => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateToken = async (regenerate = false) => {
    setLoading(true);
    try {
      // Check if token already exists
      const { data: existingToken } = await supabase
        .from("pei_family_tokens")
        .select("token, id")
        .eq("pei_id", peiId)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (existingToken && !regenerate) {
        setToken(existingToken.token);
        toast({
          title: "Código já existe",
          description: "Um código válido já foi gerado. Clique em 'Gerar Novo' para substituir.",
        });
        return;
      }

      // Delete old token if regenerating
      if (existingToken && regenerate) {
        await supabase
          .from("pei_family_tokens")
          .delete()
          .eq("id", existingToken.id);
      }

      // Generate new token
      const { data: functionData, error: functionError } = await supabase
        .rpc("generate_pei_access_token");

      if (functionError) throw functionError;

      const newToken = functionData;

      // Save token
      const { error: insertError } = await supabase
        .from("pei_family_tokens")
        .insert({
          pei_id: peiId,
          token: newToken,
        });

      if (insertError) throw insertError;

      setToken(newToken);
      toast({
        title: regenerate ? "Novo código gerado!" : "Código gerado!",
        description: "Compartilhe este código com a família do aluno.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar token:", error);
      toast({
        title: "Erro ao gerar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast({ title: "Código copiado!" });
    }
  };

  const copyFullLink = () => {
    if (token) {
      const link = `${window.location.origin}/family?code=${token}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Link copiado!" });
    }
  };

  const handleOpen = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Sempre verificar se existe token ao abrir
      checkExistingToken();
    }
  };

  const checkExistingToken = async () => {
    setLoading(true);
    try {
      const { data: existingToken } = await supabase
        .from("pei_family_tokens")
        .select("token")
        .eq("pei_id", peiId)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (existingToken) {
        setToken(existingToken.token);
      } else {
        setToken(null);
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async () => {
    setLoading(true);
    try {
      await supabase
        .from("pei_family_tokens")
        .delete()
        .eq("pei_id", peiId);

      setToken(null);
      toast({
        title: "Código apagado",
        description: "O código anterior foi removido com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao apagar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Link PEI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Código de Acesso para a Família</DialogTitle>
          <DialogDescription>
            Gere um código seguro para a família acessar e aprovar o PEI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : token ? (
            <>
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  Código válido por 24 horas • Acesso exclusivo a este PEI
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Código de Acesso</Label>
                <div className="flex gap-2">
                  <Input
                    value={token}
                    readOnly
                    className="text-center text-2xl font-mono tracking-widest font-bold"
                  />
                  <Button size="icon" variant="outline" onClick={copyToken} title="Copiar código">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link Direto</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/family?code=${token}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button size="icon" variant="outline" onClick={copyFullLink} title="Copiar link">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <p className="font-semibold">Como compartilhar:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Copie o código ou link acima</li>
                  <li>Envie para a família por WhatsApp, email ou SMS</li>
                  <li>Oriente a família a acessar: {window.location.origin}/family</li>
                  <li>A família insere o código e o primeiro nome do aluno</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => generateToken(true)}
                  disabled={loading}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renovar Código
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteToken}
                  disabled={loading}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Apagar Código
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <QrCode className="h-16 w-16 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium mb-1">Nenhum código ativo</p>
                <p className="text-sm text-muted-foreground">
                  Gere um código de acesso para compartilhar com a família
                </p>
              </div>
              <Button onClick={() => generateToken(false)} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Gerar Código
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateFamilyTokenDialog;

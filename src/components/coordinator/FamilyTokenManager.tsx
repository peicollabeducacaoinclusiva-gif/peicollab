import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Link as LinkIcon, Trash2, Share2, QrCode, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FamilyTokenManagerProps {
  peiId: string;
  studentName: string;
}

interface Token {
  id: string;
  expires_at: string;
  access_count: number;
  last_accessed_at: string | null;
  created_at: string;
}

export function FamilyTokenManager({ peiId, studentName }: FamilyTokenManagerProps) {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, [peiId]);

  const loadTokens = async () => {
    try {
      // SECURITY: Never select token or token_hash - only metadata
      const { data, error } = await supabase
        .from("family_access_tokens")
        .select("id, pei_id, student_id, created_at, expires_at, access_count, last_accessed_at, created_by")
        .eq("pei_id", peiId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar tokens:", error);
    }
  };

  const generateToken = async () => {
    setLoading(true);
    try {
      // Gerar novo token
      const { data: newToken, error: tokenError } = await supabase
        .rpc("generate_secure_token");

      if (tokenError) throw tokenError;

      // Hash do token
      const { data: tokenHash, error: hashError } = await supabase
        .rpc("hash_token", { token_value: newToken });

      if (hashError) throw hashError;

      // Buscar student_id do PEI
      const { data: peiData, error: peiError } = await supabase
        .from("peis")
        .select("student_id")
        .eq("id", peiId)
        .single();

      if (peiError) throw peiError;

      // Inserir token no banco (SOMENTE O HASH)
      const { error: insertError } = await supabase
        .from("family_access_tokens")
        .insert([{
          pei_id: peiId,
          student_id: peiData.student_id,
          token_hash: tokenHash,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
        }]);

      if (insertError) throw insertError;

      // Store plaintext token ONLY in memory for one-time display
      setGeneratedToken(newToken);
      setDialogOpen(true);
      await loadTokens();

      toast({
        title: "Token gerado com sucesso",
        description: "⚠️ ATENÇÃO: Copie o token agora! Ele não será exibido novamente.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Erro ao gerar token:", error);
      toast({
        title: "Erro ao gerar token",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from("family_access_tokens")
        .delete()
        .eq("id", tokenId);

      if (error) throw error;

      await loadTokens();
      toast({
        title: "Token removido",
        description: "O link de acesso foi desativado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover token",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/secure-family?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link de acesso foi copiado para a área de transferência.",
    });
  };

  const shareWhatsApp = (token: string) => {
    const link = `${window.location.origin}/secure-family?token=${token}`;
    const message = encodeURIComponent(
      `Olá! Segue o link seguro para acessar o PEI de ${studentName}:\n\n${link}\n\nEste link expira em 7 dias.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Gerenciar Acesso da Família
        </CardTitle>
        <CardDescription>
          Tokens seguros e temporários para acesso da família ao PEI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" onClick={() => {
              setGeneratedToken(null);
              setDialogOpen(true);
            }}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Gerar Novo Link de Acesso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Link Seguro para Família</DialogTitle>
              <DialogDescription className="space-y-2">
                <p className="text-destructive font-semibold">⚠️ ATENÇÃO: Este token será exibido apenas UMA VEZ!</p>
                <p>Compartilhe este link com a família do estudante. O acesso é válido por 7 dias.</p>
                <p className="text-sm text-muted-foreground">Por segurança, o token não pode ser recuperado depois.</p>
              </DialogDescription>
            </DialogHeader>

            {!generatedToken ? (
              <Button onClick={generateToken} disabled={loading}>
                {loading ? "Gerando..." : "Gerar Link"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Link de Acesso (COPIE AGORA!)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/secure-family?token=${generatedToken}`}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyLink(generatedToken)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => shareWhatsApp(generatedToken)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Enviar via WhatsApp
                </Button>

                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded text-sm space-y-1">
                  <p className="font-semibold text-destructive">⚠️ Importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Este token não será exibido novamente</li>
                    <li>Link expira em 7 dias</li>
                    <li>Acesso exclusivo ao PEI de {studentName}</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Acessos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum token ativo
                  </TableCell>
                </TableRow>
              ) : (
                tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      {isExpired(token.expires_at) ? (
                        <Badge variant="destructive">Expirado</Badge>
                      ) : (
                        <Badge variant="default">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(token.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(token.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>{token.access_count}x</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <span className="text-xs text-muted-foreground italic mr-2">
                          Token gerado (não recuperável)
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteToken(token.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
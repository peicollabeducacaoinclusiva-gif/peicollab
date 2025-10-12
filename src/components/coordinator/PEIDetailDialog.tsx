import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  LinkIcon,
  MessageSquare,
  Send,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PEIDetailDialogProps {
  peiId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: () => void;
  currentUserId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface PEIData {
  id: string;
  status: string;
  created_at: string;
  student_id: string;
  students?: {
    name: string;
  } | null;
  assigned_teacher?: {
    full_name: string;
  } | null;
}

const PEIDetailDialog = ({
  peiId,
  open,
  onClose,
  onStatusChange,
  currentUserId,
}: PEIDetailDialogProps) => {
  const [peiData, setPeiData] = useState<PEIData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [familyToken, setFamilyToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && peiId) {
      loadPEIData();
      loadComments();
      checkExistingToken();
    } else {
      // Reset state when dialog closes
      setPeiData(null);
      setComments([]);
      setNewComment("");
      setFamilyToken(null);
      setTokenCopied(false);
    }
  }, [open, peiId]);

  const loadPEIData = async () => {
    if (!peiId) return;

    try {
      setLoadingData(true);
      
      const { data, error } = await supabase
        .from("peis")
        .select(`
          id,
          status,
          created_at,
          student_id,
          assigned_teacher_id,
          students (
            name
          )
        `)
        .eq("id", peiId)
        .single();

      if (error) {
        console.error("Error loading PEI:", error);
        throw error;
      }

      if (!data) {
        throw new Error("PEI não encontrado");
      }

      // Buscar dados do professor separadamente se assigned_teacher_id existir
      let teacherData = null;
      if (data.assigned_teacher_id) {
        const { data: teacher, error: teacherError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.assigned_teacher_id)
          .single();

        if (!teacherError && teacher) {
          teacherData = teacher;
        }
      }

      setPeiData({
        ...data,
        assigned_teacher: teacherData,
      });

    } catch (error: any) {
      console.error("Erro ao carregar PEI:", error);
      toast({
        title: "Erro ao carregar PEI",
        description: error.message || "Não foi possível carregar os dados do PEI",
        variant: "destructive",
      });
      onClose();
    } finally {
      setLoadingData(false);
    }
  };

  const loadComments = async () => {
    if (!peiId) return;

    try {
      const { data, error } = await supabase
        .from("pei_comments")
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("pei_id", peiId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading comments:", error);
        throw error;
      }

      // Buscar perfis dos usuários separadamente
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error loading profiles:", profilesError);
        }

        // Mapear profiles aos comentários
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || null,
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }

    } catch (error: any) {
      console.error("Erro ao carregar comentários:", error);
      // Não mostrar toast aqui, comentários são opcionais
      setComments([]);
    }
  };

  const checkExistingToken = async () => {
    if (!peiId) return;

    try {
      const { data, error } = await supabase
        .from("family_access_tokens")
        .select("id, created_at")
        .eq("pei_id", peiId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setFamilyToken("Token já gerado");
      } else {
        setFamilyToken(null);
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error);
      setFamilyToken(null);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !peiId || !peiData) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from("pei_comments")
        .insert({
          pei_id: peiId,
          user_id: currentUserId,
          student_id: peiData.student_id,
          content: newComment.trim(),
        });

      if (error) {
        console.error("Error adding comment:", error);
        throw error;
      }

      toast({
        title: "Comentário adicionado!",
        description: "O comentário foi enviado com sucesso.",
      });

      setNewComment("");
      await loadComments();
    } catch (error: any) {
      console.error("Erro ao adicionar comentário:", error);
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message || "Não foi possível adicionar o comentário",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!peiId || !peiData) return;

    try {
      setLoading(true);

      // Gerar token usando função RPC
      const { data: tokenValue, error: tokenError } = await supabase
        .rpc("generate_secure_token");

      if (tokenError) {
        console.error("Error generating token:", tokenError);
        throw new Error("Erro ao gerar token: " + tokenError.message);
      }

      if (!tokenValue) {
        throw new Error("Token não foi gerado");
      }

      // Hash do token usando função RPC
      const { data: tokenHash, error: hashError } = await supabase
        .rpc("hash_token", { token_value: tokenValue });

      if (hashError) {
        console.error("Error hashing token:", hashError);
        throw new Error("Erro ao processar token: " + hashError.message);
      }

      if (!tokenHash) {
        throw new Error("Hash do token não foi gerado");
      }

      // Criar registro
      const { error: insertError } = await supabase
        .from("family_access_tokens")
        .insert({
          student_id: peiData.student_id,
          pei_id: peiId,
          token_hash: tokenHash,
          created_by: currentUserId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (insertError) {
        console.error("Error inserting token:", insertError);
        throw new Error("Erro ao salvar token: " + insertError.message);
      }

      setFamilyToken(tokenValue);

      toast({
        title: "Link gerado com sucesso!",
        description: "⚠️ Copie este link agora! Ele não será exibido novamente.",
      });
    } catch (error: any) {
      console.error("Erro ao gerar token:", error);
      toast({
        title: "Erro ao gerar link",
        description: error.message || "Não foi possível gerar o link de acesso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (!familyToken || familyToken === "Token já gerado") return;

    const url = `${window.location.origin}/secure-family?token=${familyToken}`;
    navigator.clipboard.writeText(url);
    setTokenCopied(true);
    
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });

    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!peiId) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("peis")
        .update({ status: "approved" })
        .eq("id", peiId);

      if (error) throw error;

      toast({
        title: "PEI aprovado!",
        description: "O PEI foi aprovado com sucesso.",
      });

      onStatusChange();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!peiId) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("peis")
        .update({ status: "returned" })
        .eq("id", peiId);

      if (error) throw error;

      toast({
        title: "PEI devolvido!",
        description: "O PEI foi devolvido ao professor para revisão.",
      });

      onStatusChange();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao devolver PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      draft: { label: "Rascunho", color: "bg-gray-500/10 text-gray-700 border-gray-200" },
      pending_validation: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
      returned: { label: "Devolvido", color: "bg-orange-500/10 text-orange-700 border-orange-200" },
      validated: { label: "Validado", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
      pending_family: { label: "Aguardando Família", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
      approved: { label: "Aprovado", color: "bg-green-500/10 text-green-700 border-green-200" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (!open) return null;

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!peiData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-muted-foreground">PEI não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>Detalhes do PEI</span>
            {getStatusBadge(peiData.status)}
          </DialogTitle>
          <DialogDescription>
            Aluno: {peiData.students?.name || "N/A"} • Professor: {peiData.assigned_teacher?.full_name || "Não atribuído"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ações */}
          {peiData.status === "pending_validation" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar PEI
              </Button>
              <Button
                variant="destructive"
                onClick={handleReturn}
                disabled={loading}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Devolver para Revisão
              </Button>
            </div>
          )}

          {/* Acesso Familiar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Acesso para Família
              </CardTitle>
              <CardDescription>
                Gere um link seguro para que a família visualize o PEI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!familyToken ? (
                <Button
                  onClick={handleGenerateToken}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Gerar Link de Acesso
                    </>
                  )}
                </Button>
              ) : familyToken === "Token já gerado" ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  ✅ Um link de acesso já foi gerado anteriormente para este PEI.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-green-900">
                      ✅ Link gerado com sucesso!
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border rounded text-xs font-mono break-all">
                        {window.location.origin}/secure-family?token={familyToken}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyToken}
                        className="flex-shrink-0"
                      >
                        {tokenCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-green-700 font-medium">
                        ⚠️ IMPORTANTE: Este link só é exibido uma vez!
                      </p>
                      <p className="text-xs text-green-600">
                        • Válido por 7 dias<br />
                        • Copie agora antes de fechar
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Comentários */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentários
              </h3>
              <Badge variant="secondary">{comments.length}</Badge>
            </div>

            {/* Adicionar Comentário */}
            <div className="space-y-2">
              <Textarea
                placeholder="Adicione um comentário para colaborar..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                disabled={sending}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || sending}
                  size="sm"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Comentário
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Lista de Comentários */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-bold">
                        {comment.profiles?.full_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm">
                          {comment.profiles?.full_name || "Usuário"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.user_id === currentUserId && (
                          <Badge variant="secondary" className="text-xs">
                            Você
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PEIDetailDialog;
// src/pages/FamilyPEIView.tsx
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { CheckCircle, MessageSquare, Home, BookOpen, Target, Users, Calendar, LogOut } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FamilyPEIView = () => {
  const { peiId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [pei, setPei] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !peiId) {
      navigate("/family");
      return;
    }
    validateAndLoadPEI();
  }, [token, peiId]);

  const validateAndLoadPEI = async () => {
    try {
      // Validate token and load PEI data using secure function
      const { data, error } = await supabase.rpc('get_pei_for_family', {
        pei_uuid: peiId,
        access_token: token
      });

      if (error) throw error;
      
      if (!data) {
        throw new Error("PEI não encontrado");
      }

      // Parse the JSON response
      const peiData = typeof data === 'string' ? JSON.parse(data) : data;
      
      setPei({
        ...peiData,
        students: peiData.student,
        tenants: peiData.tenant
      });

      // Update last accessed
      await supabase
        .from("pei_family_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("token", token)
        .eq("pei_id", peiId);

      // Load comments
      loadComments();
    } catch (error: any) {
      toast({
        title: "Erro ao carregar PEI",
        description: error.message,
        variant: "destructive",
      });
      navigate("/family");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("pei_comments")
      .select("id, content, created_at, user_id")
      .eq("pei_id", peiId)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !pei) return;

    setSubmitting(true);
    try {
      // Get student_id from the pei object
      const studentId = pei.student?.id;
      if (!studentId) throw new Error("Student ID not found");

      const { error } = await supabase.from("pei_comments").insert({
        pei_id: peiId,
        student_id: studentId,
        user_id: null, // Family comments don't have user_id
        content: `[Família] ${newComment}`,
      });

      if (error) throw error;

      toast({ title: "Comentário enviado com sucesso!" });
      setNewComment("");
      loadComments();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar comentário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePEI = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('approve_pei_family', {
        pei_uuid: peiId,
        access_token: token
      });

      if (error) throw error;

      toast({
        title: "PEI Aprovado!",
        description: "Obrigado! Seu consentimento foi registrado com sucesso.",
      });

      validateAndLoadPEI();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar PEI",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="PEI Collab" className="h-20 w-auto mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pei) return null;

  const diagnosisData = pei.diagnosis_data || {};
  const planningData = pei.planning_data || {};
  const goals = planningData.goals || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PEI Collab" className="h-10 w-auto" />
            <div>
              <h1 className="font-bold text-lg">Portal da Família</h1>
              <p className="text-xs text-muted-foreground">
                {pei.students?.name}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/family")}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Header Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{pei.students?.name}</CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {pei.tenants?.name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    PEI criado em {format(new Date(pei.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              {pei.family_approved_at && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Aprovado pela família
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas Principais
            </CardTitle>
            <CardDescription>
              O que seu filho(a) vai desenvolver este período
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.length > 0 ? (
              goals.slice(0, 5).map((goal: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{goal.title}</h4>
                  {goal.strategies && (
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Como faremos:</strong> {goal.strategies}
                    </p>
                  )}
                  {goal.criteria && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Como avaliaremos:</strong> {goal.criteria}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não há metas definidas para este PEI.
              </p>
            )}
          </CardContent>
        </Card>

        {/* School Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              O que a escola vai fazer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnosisData.needs && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Necessidades identificadas:</strong> {diagnosisData.needs}
                  </p>
                </div>
              )}
              {planningData.resources && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Recursos e apoios:</strong> {planningData.resources}
                  </p>
                </div>
              )}
              {!diagnosisData.needs && !planningData.resources && (
                <p className="text-sm text-muted-foreground">
                  As estratégias da escola estão sendo definidas.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Family Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Como você pode ajudar em casa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Mantenha uma rotina diária consistente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Converse com seu filho(a) sobre as atividades escolares</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Incentive momentos de leitura e brincadeiras educativas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Comunique-se regularmente com a escola sobre o progresso</span>
                  </li>
                </ul>
              </div>
              {diagnosisData.interests && (
                <p className="text-sm text-muted-foreground">
                  <strong>Interesses do aluno:</strong> {diagnosisData.interests}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Seus Comentários e Observações
            </CardTitle>
            <CardDescription>
              Compartilhe o que você observa em casa ou dúvidas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Ex: Em casa, percebemos que ele já consegue ler pequenas palavras..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar Comentário
              </Button>
            </div>

            {comments.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm">Histórico</h4>
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm mb-1">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Section */}
        {!pei.family_approved_at && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Aprovação do PEI
              </CardTitle>
              <CardDescription>
                Ao aprovar, você confirma que está de acordo com o plano educacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleApprovePEI}
                disabled={submitting}
                size="lg"
                className="w-full"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Aprovar PEI
              </Button>
            </CardContent>
          </Card>
        )}

        {pei.family_approved_at && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">PEI Aprovado!</h3>
              <p className="text-sm text-muted-foreground">
                Aprovado em {format(new Date(pei.family_approved_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Obrigado por participar do desenvolvimento educacional do seu filho(a)!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default FamilyPEIView;

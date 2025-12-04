// src/components/support/DailyFeedbackForm.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Smile, Meh, Frown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DailyFeedbackFormProps {
  studentId: string;
  onSubmit?: () => void;
}

export function DailyFeedbackForm({ studentId, onSubmit }: DailyFeedbackFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [socializationScore, setSocializationScore] = useState<number>(3);
  const [autonomyScore, setAutonomyScore] = useState<number>(3);
  const [behaviorScore, setBehaviorScore] = useState<number>(3);
  const [comments, setComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkExistingFeedback();
  }, [date, studentId]);

  const checkExistingFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_professional_feedbacks')
        .select('*')
        .eq('student_id', studentId)
        .eq('support_professional_id', user.id)
        .eq('feedback_date', format(date, 'yyyy-MM-dd'))
        .single();

      if (data && !error) {
        setExistingFeedback(data);
        setSocializationScore(data.socialization_score || 3);
        setAutonomyScore(data.autonomy_score || 3);
        setBehaviorScore(data.behavior_score || 3);
        setComments(data.comments || "");
      } else {
        setExistingFeedback(null);
        setSocializationScore(3);
        setAutonomyScore(3);
        setBehaviorScore(3);
        setComments("");
      }
    } catch (error) {
      console.error('Erro ao verificar feedback existente:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const feedbackData = {
        student_id: studentId,
        support_professional_id: user.id,
        feedback_date: format(date, 'yyyy-MM-dd'),
        socialization_score: socializationScore,
        autonomy_score: autonomyScore,
        behavior_score: behaviorScore,
        comments: comments || null,
      };

      if (existingFeedback) {
        // Atualizar feedback existente
        const { error } = await supabase
          .from('support_professional_feedbacks')
          .update(feedbackData)
          .eq('id', existingFeedback.id);

        if (error) throw error;

        toast({
          title: "Feedback atualizado",
          description: "O feedback foi atualizado com sucesso!",
        });
      } else {
        // Criar novo feedback
        const { error } = await supabase
          .from('support_professional_feedbacks')
          .insert([feedbackData]);

        if (error) throw error;

        toast({
          title: "Feedback registrado",
          description: "O feedback foi salvo com sucesso!",
        });
      }

      onSubmit?.();
      checkExistingFeedback(); // Recarregar para mostrar como existente
    } catch (error: any) {
      toast({
        title: "Erro ao salvar feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 4) return <Smile className="h-5 w-5 text-green-600" />;
    if (score === 3) return <Meh className="h-5 w-5 text-yellow-600" />;
    return <Frown className="h-5 w-5 text-red-600" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score === 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    const labels = ['Muito Ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    return labels[score - 1] || 'Regular';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Feedback Diário</CardTitle>
        <CardDescription>
          {existingFeedback 
            ? 'Atualize o feedback já registrado para esta data' 
            : 'Registre o acompanhamento do aluno no dia selecionado'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor de Data */}
          <div className="space-y-2">
            <Label>Data do Acompanhamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Socialização */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Socialização</Label>
              <div className="flex items-center gap-2">
                {getScoreIcon(socializationScore)}
                <span className="text-sm font-medium">{getScoreLabel(socializationScore)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Slider
                value={[socializationScore]}
                onValueChange={(value) => setSocializationScore(value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Muito Ruim</span>
                <span>3 - Regular</span>
                <span>5 - Excelente</span>
              </div>
            </div>
          </div>

          {/* Autonomia */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Autonomia</Label>
              <div className="flex items-center gap-2">
                {getScoreIcon(autonomyScore)}
                <span className="text-sm font-medium">{getScoreLabel(autonomyScore)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Slider
                value={[autonomyScore]}
                onValueChange={(value) => setAutonomyScore(value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Muito Ruim</span>
                <span>3 - Regular</span>
                <span>5 - Excelente</span>
              </div>
            </div>
          </div>

          {/* Comportamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Comportamento</Label>
              <div className="flex items-center gap-2">
                {getScoreIcon(behaviorScore)}
                <span className="text-sm font-medium">{getScoreLabel(behaviorScore)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Slider
                value={[behaviorScore]}
                onValueChange={(value) => setBehaviorScore(value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Muito Ruim</span>
                <span>3 - Regular</span>
                <span>5 - Excelente</span>
              </div>
            </div>
          </div>

          {/* Comentários */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comentários (opcional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Descreva observações relevantes sobre o acompanhamento do aluno..."
              rows={4}
            />
          </div>

          {/* Botão de Envio */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting 
              ? 'Salvando...' 
              : existingFeedback 
                ? 'Atualizar Feedback' 
                : 'Registrar Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
































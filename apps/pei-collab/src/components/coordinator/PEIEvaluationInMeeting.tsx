import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, User } from "lucide-react";

interface PEI {
  id: string;
  student_name: string;
  notes?: string;
  progress?: string;
}

interface PEIEvaluationInMeetingProps {
  peis: PEI[];
  onChange: (peis: PEI[]) => void;
  disabled?: boolean;
}

export default function PEIEvaluationInMeeting({ peis, onChange, disabled = false }: PEIEvaluationInMeetingProps) {
  const updatePEIProgress = (peiId: string, progress: string) => {
    const updated = peis.map((pei) =>
      pei.id === peiId ? { ...pei, progress } : pei
    );
    onChange(updated);
  };

  const updatePEINotes = (peiId: string, notes: string) => {
    const updated = peis.map((pei) =>
      pei.id === peiId ? { ...pei, notes } : pei
    );
    onChange(updated);
  };

  const getProgressBadge = (progress?: string) => {
    const config: Record<string, { label: string; color: string }> = {
      excellent: { label: "Excelente", color: "bg-green-500 text-white" },
      good: { label: "Bom", color: "bg-blue-500 text-white" },
      average: { label: "Regular", color: "bg-yellow-500 text-white" },
      needs_improvement: { label: "Precisa Melhorar", color: "bg-orange-500 text-white" },
      critical: { label: "Crítico", color: "bg-red-500 text-white" },
    };

    if (!progress) return null;
    const cfg = config[progress] || config.good;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  if (peis.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground text-sm">
            Nenhum PEI vinculado a esta reunião
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <div>
            <CardTitle>Avaliação dos PEIs</CardTitle>
            <CardDescription>
              Registre o parecer e progresso de cada PEI discutido nesta reunião
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {peis.map((pei) => (
          <Card key={pei.id} className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{pei.student_name}</CardTitle>
                </div>
                {getProgressBadge(pei.progress)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Progresso Geral</label>
                <Select
                  value={pei.progress || ""}
                  onValueChange={(value) => updatePEIProgress(pei.id, value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o progresso..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">⭐ Excelente</SelectItem>
                    <SelectItem value="good">👍 Bom</SelectItem>
                    <SelectItem value="average">😐 Regular</SelectItem>
                    <SelectItem value="needs_improvement">⚠️ Precisa Melhorar</SelectItem>
                    <SelectItem value="critical">🚨 Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Parecer do Coordenador / Observações
                </label>
                <Textarea
                  placeholder="Registre aqui as observações, decisões tomadas, recomendações, pontos discutidos sobre este PEI..."
                  value={pei.notes || ""}
                  onChange={(e) => updatePEINotes(pei.id, e.target.value)}
                  rows={4}
                  disabled={disabled}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}


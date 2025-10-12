import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProgressIndicatorProps {
  studentSelected: boolean;
  diagnosisFilled: boolean;
  planningFilled: boolean;
  referralsFilled: boolean;
}

const ProgressIndicator = ({
  studentSelected,
  diagnosisFilled,
  planningFilled,
  referralsFilled,
}: ProgressIndicatorProps) => {
  const steps = [
    { label: "Aluno", completed: studentSelected, emoji: "👤" },
    { label: "Diagnóstico", completed: diagnosisFilled, emoji: "📋" },
    { label: "Planejamento", completed: planningFilled, emoji: "🎯" },
    { label: "Encaminhamentos", completed: referralsFilled, emoji: "🏥" },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Progresso do PEI</h4>
        <Badge variant="secondary">
          {completedSteps} de {steps.length} seções
        </Badge>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 p-2 rounded-md text-xs ${
              step.completed 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span className="text-base">{step.emoji}</span>
            <span className="font-medium">{step.label}</span>
            {step.completed && <Check className="h-3 w-3 ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
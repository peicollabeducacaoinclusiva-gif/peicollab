import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface TutorialCardsProps {
  userRole: string;
}

const tutorialSteps = {
  superadmin: [
    {
      title: "Bem-vindo ao PEI Collab!",
      description: "Como superadmin, você tem acesso completo ao sistema. Gerencie escolas, usuários e estudantes.",
    },
    {
      title: "Gerenciar Escolas",
      description: "Na aba 'Escolas', você pode criar, editar e visualizar todas as escolas cadastradas no sistema.",
    },
    {
      title: "Gerenciar Usuários",
      description: "Ative ou desative usuários e defina suas permissões de acesso ao sistema.",
    },
  ],
  coordinator: [
    {
      title: "Bem-vindo ao PEI Collab!",
      description: "Como coordenador, você pode gerenciar PEIs, estudantes e acompanhar o progresso da sua escola.",
    },
    {
      title: "Fila de PEIs",
      description: "Acompanhe todos os PEIs em desenvolvimento e aprove documentos quando necessário.",
    },
    {
      title: "Gerar Códigos de Acesso",
      description: "Gere códigos para que as famílias possam acessar os PEIs de seus estudantes.",
    },
  ],
  teacher: [
    {
      title: "Bem-vindo ao PEI Collab!",
      description: "Como professor, você pode criar e editar PEIs dos estudantes sob sua responsabilidade.",
    },
    {
      title: "Criar Novo PEI",
      description: "Clique em 'Novo PEI' para começar a criar um plano educacional individualizado para um estudante.",
    },
    {
      title: "Acompanhar PEIs",
      description: "Visualize e edite os PEIs atribuídos a você na lista de PEIs.",
    },
  ],
  family: [
    {
      title: "Bem-vindo ao PEI Collab!",
      description: "Como familiar, você pode acompanhar o desenvolvimento educacional dos seus estudantes.",
    },
    {
      title: "Visualizar PEIs",
      description: "Acesse os PEIs dos seus estudantes e acompanhe o planejamento educacional.",
    },
    {
      title: "Aprovar Documentos",
      description: "Quando solicitado, você pode aprovar os PEIs dos seus estudantes.",
    },
  ],
};

export default function TutorialCards({ userRole }: TutorialCardsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const steps = tutorialSteps[userRole as keyof typeof tutorialSteps] || tutorialSteps.teacher;

  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      checkTutorialStatus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const checkTutorialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_tutorial_status")
        .select("tutorial_completed")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking tutorial status:", error);
        return;
      }

      // Se não existe registro ou não completou, mostrar tutorial
      if (!data || !data.tutorial_completed) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_tutorial_status")
        .upsert({
          user_id: user.id,
          tutorial_completed: true,
          completed_at: new Date().toISOString(),
        });

      setIsVisible(false);
    } catch (error) {
      console.error("Error completing tutorial:", error);
    }
  };

  if (loading || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleComplete}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-base">
            Passo {currentStep + 1} de {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            {steps[currentStep].description}
          </p>
          
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleComplete}>
                Finalizar Tutorial
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

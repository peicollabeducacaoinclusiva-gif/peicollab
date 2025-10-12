import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

const inclusionQuotes = [
  "A inclusão é sobre dar a todos a oportunidade de participar plenamente da vida.",
  "Cada criança é única e especial, com talentos que merecem ser descobertos e celebrados.",
  "Educação inclusiva não é um luxo, é um direito humano fundamental.",
  "Juntos somos mais fortes. A diversidade enriquece nossa comunidade escolar.",
  "Incluir é mais do que colocar na sala. É acolher, respeitar e valorizar cada diferença.",
  "Toda criança pode aprender, só precisamos descobrir a melhor forma de ensinar.",
  "A verdadeira educação celebra as diferenças e constrói pontes, não muros.",
  "Inclusão é criar um espaço onde todos se sintam bem-vindos e valorizados.",
  "Não há crianças especiais, há crianças com necessidades especiais de amor e atenção.",
  "A empatia é o primeiro passo para uma educação verdadeiramente inclusiva.",
];

export default function InclusionQuote() {
  // Seleciona uma frase baseada no dia do ano
  const quote = useMemo(() => {
    const dayOfYear = Math.floor(
      (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return inclusionQuotes[dayOfYear % inclusionQuotes.length];
  }, []);

  return (
    <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            "{quote}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

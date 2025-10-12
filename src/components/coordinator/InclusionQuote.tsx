import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

const quotes = [
  {
    text: "A educação inclusiva não é apenas sobre colocar crianças com deficiência em escolas regulares, mas sobre mudar as atitudes e crenças das pessoas.",
    author: "UNESCO"
  },
  {
    text: "Inclusão é sair das escolas dos diferentes e promover a escola das diferenças.",
    author: "Maria Teresa Eglér Mantoan"
  },
  {
    text: "Não existem duas pessoas iguais. Logo, não existe uma forma de aprender igual para todo mundo.",
    author: "Howard Gardner"
  },
  {
    text: "A inclusão acontece quando se aprende com as diferenças e não com as igualdades.",
    author: "Paulo Freire"
  },
  {
    text: "Toda criança tem o direito de ser diferente e de aprender de forma diferente.",
    author: "Lev Vygotsky"
  }
];

const InclusionQuote = () => {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Heart className="h-8 w-8 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm italic text-gray-700 mb-2">
              "{randomQuote.text}"
            </p>
            <p className="text-xs font-semibold text-gray-600">
              — {randomQuote.author}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InclusionQuote;
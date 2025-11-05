import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paintbrush } from "lucide-react";

interface EmojiOption {
  emoji: string;
  label: string;
  category: string;
}

interface ColorOption {
  value: string;
  label: string;
  className: string;
}

interface Props {
  currentEmoji?: string;
  currentColor?: string;
  onSelect: (emoji: string, color: string) => void;
}

const EMOJI_OPTIONS: EmojiOption[] = [
  // Professores
  { emoji: "👨‍🏫", label: "Professor", category: "Educadores" },
  { emoji: "👩‍🏫", label: "Professora", category: "Educadores" },
  { emoji: "🧑‍🏫", label: "Professor(a)", category: "Educadores" },
  { emoji: "👨‍🎓", label: "Estudante", category: "Educadores" },
  { emoji: "👩‍🎓", label: "Estudante", category: "Educadores" },
  
  // Gestão
  { emoji: "👑", label: "Administrador", category: "Gestão" },
  { emoji: "🎓", label: "Secretário", category: "Gestão" },
  { emoji: "🏫", label: "Diretor", category: "Gestão" },
  { emoji: "📋", label: "Coordenador", category: "Gestão" },
  { emoji: "📊", label: "Gestor", category: "Gestão" },
  
  // Especialistas
  { emoji: "♿", label: "AEE", category: "Especialistas" },
  { emoji: "🩺", label: "Especialista", category: "Especialistas" },
  { emoji: "👨‍⚕️", label: "Médico", category: "Especialistas" },
  { emoji: "👩‍⚕️", label: "Médica", category: "Especialistas" },
  { emoji: "🧠", label: "Psicólogo", category: "Especialistas" },
  
  // Família
  { emoji: "👨‍👩‍👧", label: "Família", category: "Família" },
  { emoji: "👨‍👩‍👧‍👦", label: "Família Grande", category: "Família" },
  { emoji: "👪", label: "Família", category: "Família" },
  { emoji: "💑", label: "Pais", category: "Família" },
  
  // Disciplinas
  { emoji: "📚", label: "Livros", category: "Disciplinas" },
  { emoji: "📖", label: "Leitura", category: "Disciplinas" },
  { emoji: "✏️", label: "Escrita", category: "Disciplinas" },
  { emoji: "🔢", label: "Matemática", category: "Disciplinas" },
  { emoji: "🔬", label: "Ciências", category: "Disciplinas" },
  { emoji: "🌍", label: "Geografia", category: "Disciplinas" },
  { emoji: "🗺️", label: "História", category: "Disciplinas" },
  { emoji: "🎨", label: "Artes", category: "Disciplinas" },
  { emoji: "🎵", label: "Música", category: "Disciplinas" },
  { emoji: "⚽", label: "Ed. Física", category: "Disciplinas" },
  { emoji: "🏃", label: "Esportes", category: "Disciplinas" },
  { emoji: "💻", label: "Informática", category: "Disciplinas" },
  { emoji: "🌐", label: "Inglês", category: "Disciplinas" },
  
  // Outros
  { emoji: "🌟", label: "Estrela", category: "Outros" },
  { emoji: "💙", label: "Coração", category: "Outros" },
  { emoji: "🎯", label: "Alvo", category: "Outros" },
  { emoji: "🚀", label: "Foguete", category: "Outros" },
  { emoji: "✨", label: "Brilho", category: "Outros" },
];

const COLOR_OPTIONS: ColorOption[] = [
  { value: "blue", label: "Azul", className: "bg-blue-500" },
  { value: "green", label: "Verde", className: "bg-green-500" },
  { value: "purple", label: "Roxo", className: "bg-purple-500" },
  { value: "orange", label: "Laranja", className: "bg-orange-500" },
  { value: "pink", label: "Rosa", className: "bg-pink-500" },
  { value: "teal", label: "Azul-esverdeado", className: "bg-teal-500" },
  { value: "indigo", label: "Índigo", className: "bg-indigo-500" },
  { value: "red", label: "Vermelho", className: "bg-red-500" },
  { value: "yellow", label: "Amarelo", className: "bg-yellow-500" },
  { value: "cyan", label: "Ciano", className: "bg-cyan-500" },
  { value: "gray", label: "Cinza", className: "bg-gray-500" },
];

export default function EmojiAvatarPicker({ currentEmoji = "👤", currentColor = "blue", onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji);
  const [selectedColor, setSelectedColor] = useState(currentColor);

  const handleSave = () => {
    onSelect(selectedEmoji, selectedColor);
    setOpen(false);
  };

  // Agrupar emojis por categoria
  const categories = Array.from(new Set(EMOJI_OPTIONS.map(e => e.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Paintbrush className="h-4 w-4 mr-2" />
          Personalizar Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Escolher Avatar</DialogTitle>
          <DialogDescription>
            Selecione um emoji e uma cor para personalizar seu avatar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex flex-col items-center gap-3 p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Preview:</p>
            <div 
              className={`h-24 w-24 rounded-full flex items-center justify-center text-5xl bg-${selectedColor}-500 shadow-lg transition-all`}
            >
              {selectedEmoji}
            </div>
          </div>

          {/* Cores */}
          <div>
            <p className="text-sm font-medium mb-3">Cor de Fundo:</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-10 w-10 rounded-full ${color.className} transition-transform hover:scale-110 ${
                    selectedColor === color.value ? 'ring-4 ring-primary ring-offset-2 scale-110' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Emojis por Categoria */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-4 pr-4">
              {categories.map((category) => (
                <div key={category}>
                  <p className="text-sm font-medium mb-2">{category}</p>
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_OPTIONS
                      .filter(e => e.category === category)
                      .map((emoji) => (
                        <button
                          key={emoji.emoji}
                          onClick={() => setSelectedEmoji(emoji.emoji)}
                          className={`h-12 w-12 rounded-lg flex items-center justify-center text-2xl transition-all hover:bg-accent hover:scale-110 ${
                            selectedEmoji === emoji.emoji ? 'bg-primary/20 ring-2 ring-primary scale-110' : ''
                          }`}
                          title={emoji.label}
                        >
                          {emoji.emoji}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


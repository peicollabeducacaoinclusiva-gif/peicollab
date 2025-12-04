import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Switch será implementado ou importado do pacote compartilhado
import { Label } from '@/components/ui/label';
// Slider será implementado ou importado do pacote compartilhado
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, Volume2, Contrast, Hand } from 'lucide-react';

export function AccessibilityControls() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [textToSpeech, setTextToSpeech] = useState(false);
  const [librasEnabled, setLibrasEnabled] = useState(false);

  useEffect(() => {
    // Aplicar tamanho da fonte
    document.documentElement.style.fontSize = `${fontSize}px`;

    // Aplicar alto contraste
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Carregar VLibras se habilitado
    if (librasEnabled) {
      const script = document.createElement('script');
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (window.VLibras) {
          new window.VLibras.Widget('https://vlibras.gov.br/app');
        }
      };

      return () => {
        const widget = document.getElementById('vlibras-widget');
        if (widget) {
          widget.remove();
        }
      };
    }
  }, [fontSize, highContrast, librasEnabled]);

  const handleTextToSpeech = () => {
    if (textToSpeech && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = document.body.innerText;
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="h-5 w-5" />
          Acessibilidade
        </CardTitle>
        <CardDescription>
          Personalize a experiência de acordo com suas necessidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tamanho da Fonte */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <Label>Tamanho da Fonte</Label>
          </div>
          <div className="px-2">
            <input
              type="range"
              min="12"
              max="24"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Pequeno</span>
              <span className="font-medium">{fontSize}px</span>
              <span>Grande</span>
            </div>
          </div>
        </div>

        {/* Alto Contraste */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Contrast className="h-4 w-4" />
            <Label htmlFor="high-contrast">Alto Contraste</Label>
          </div>
          <input
            type="checkbox"
            id="high-contrast"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
            className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
          />
        </div>

        {/* Leitura em Voz */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <Label htmlFor="text-to-speech">Leitura em Voz</Label>
            </div>
            <input
              type="checkbox"
              id="text-to-speech"
              checked={textToSpeech}
              onChange={(e) => setTextToSpeech(e.target.checked)}
              className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
            />
          </div>
          {textToSpeech && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTextToSpeech}
              className="w-full"
            >
              Ler Conteúdo da Página
            </Button>
          )}
        </div>

        {/* Libras (VLibras) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hand className="h-4 w-4" />
            <Label htmlFor="libras">Libras (VLibras)</Label>
          </div>
          <input
            type="checkbox"
            id="libras"
            checked={librasEnabled}
            onChange={(e) => setLibrasEnabled(e.target.checked)}
            className="w-11 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer relative transition-colors checked:bg-primary"
          />
        </div>

        {librasEnabled && (
          <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            O widget de Libras será carregado. Use o ícone flutuante para traduzir o conteúdo.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Declaração de tipo para VLibras
declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => any;
    };
  }
}


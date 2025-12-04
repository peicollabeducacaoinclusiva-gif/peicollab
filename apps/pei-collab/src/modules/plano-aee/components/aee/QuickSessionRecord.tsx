import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Mic, Video, Tag, Send } from 'lucide-react';
import { quickSessionService, QuickSession, PedagogicalTag } from '@/services/quickSessionService';
import { toast } from 'sonner';

interface QuickSessionRecordProps {
  studentId: string;
  aeeId: string;
  objectiveId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function QuickSessionRecord({ studentId, aeeId, objectiveId, onSessionCreated }: QuickSessionRecordProps) {
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<PedagogicalTag[]>([]);
  const [participationLevel, setParticipationLevel] = useState<string>('media');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await quickSessionService.getPedagogicalTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sessionId = await quickSessionService.createQuickSession(
        studentId,
        aeeId,
        notes || undefined,
        selectedTags.length > 0 ? selectedTags : undefined,
        objectiveId
      );

      // Adicionar participação
      await quickSessionService.addParticipation(
        sessionId,
        studentId,
        participationLevel as 'alta' | 'media' | 'baixa' | 'ausente'
      );

      toast.success('Sessão registrada com sucesso');
      setNotes('');
      setSelectedTags([]);
      setParticipationLevel('media');
      onSessionCreated?.(sessionId);
    } catch (error) {
      toast.error('Erro ao registrar sessão');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const groupedTags = availableTags.reduce((acc, tag) => {
    const category = tag.tag_category || 'outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, PedagogicalTag[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Registro Rápido de Sessão
        </CardTitle>
        <CardDescription>
          Modelo "WhatsApp Status" - registro rápido com transcrição
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nível de Participação do Aluno</Label>
            <Select value={participationLevel} onValueChange={setParticipationLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="ausente">Ausente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas da Sessão</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva brevemente o que aconteceu na sessão..."
              rows={4}
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4" />
              Tags Pedagógicas
            </Label>
            <div className="space-y-2">
              {Object.entries(groupedTags).map(([category, tags]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.tag_name) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.tag_name)}
                        style={{
                          backgroundColor: selectedTags.includes(tag.tag_name) ? tag.color : undefined,
                        }}
                      >
                        {tag.tag_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Foto
            </Button>
            <Button type="button" variant="outline" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Vídeo
            </Button>
            <Button type="button" variant="outline" size="sm">
              <Mic className="h-4 w-4 mr-2" />
              Áudio
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Registrando...' : 'Registrar Sessão'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}



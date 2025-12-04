import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileText, Eye, Edit, CheckCircle, XCircle } from 'lucide-react';
import { PEIComments } from './PEIComments';

interface PEIReviewModeProps {
  peiId: string;
  currentSection: 'diagnosis' | 'planning' | 'evaluation' | 'general';
  onSectionChange?: (section: 'diagnosis' | 'planning' | 'evaluation' | 'general') => void;
}

export function PEIReviewMode({ peiId, currentSection, onSectionChange }: PEIReviewModeProps) {
  const [reviewMode, setReviewMode] = useState(false);
  const [showResolved, setShowResolved] = useState(true);

  const sections = [
    { id: 'general' as const, label: 'Geral', icon: FileText },
    { id: 'diagnosis' as const, label: 'Diagnóstico', icon: Eye },
    { id: 'planning' as const, label: 'Planejamento', icon: Edit },
    { id: 'evaluation' as const, label: 'Avaliação', icon: CheckCircle },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modo de Revisão
            </CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                id="review-mode"
                checked={reviewMode}
                onCheckedChange={setReviewMode}
              />
              <Label htmlFor="review-mode" className="cursor-pointer">
                Modo Revisão
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reviewMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-resolved"
                  checked={showResolved}
                  onCheckedChange={setShowResolved}
                />
                <Label htmlFor="show-resolved" className="cursor-pointer">
                  Mostrar comentários resolvidos
                </Label>
              </div>

              <div className="flex gap-2 flex-wrap">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = currentSection === section.id;

                  return (
                    <Button
                      key={section.id}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSectionChange?.(section.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {section.label}
                    </Button>
                  );
                })}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Modo de Revisão Ativo
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Todas as alterações serão rastreadas. Use comentários para sugerir mudanças
                      e revisar o conteúdo do PEI.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!reviewMode && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Ative o modo de revisão para rastrear alterações e colaborar no PEI
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {reviewMode && (
        <PEIComments peiId={peiId} section={currentSection} />
      )}
    </div>
  );
}


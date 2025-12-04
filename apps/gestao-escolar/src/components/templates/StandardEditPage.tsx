import { ReactNode, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Separator } from '@/components/ui';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';

interface StandardEditPageProps {
  title: string;
  subtitle?: string;
  description?: string;
  onBack?: () => void;
  backUrl?: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  children: ReactNode;
  loading?: boolean;
  saving?: boolean;
  sections?: Array<{
    title: string;
    description?: string;
    content: ReactNode;
  }>;
  showCancel?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  formId?: string;
}

/**
 * Template padrão para páginas de edição/criação
 * 
 * Inclui:
 * - Header com breadcrumb
 * - Formulário organizado em seções
 * - Botões de ação (salvar, cancelar)
 * - Loading states
 * - Validação visual
 */
export function StandardEditPage({
  title,
  subtitle,
  description,
  onBack,
  backUrl,
  onSubmit,
  onCancel,
  children,
  loading = false,
  saving = false,
  sections,
  showCancel = true,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  formId,
}: StandardEditPageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleBack();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} disabled={saving}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
        }
        description={description}
        actions={
          <div className="flex items-center gap-2">
            {showCancel && (
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                {cancelLabel}
              </Button>
            )}
            <Button type="submit" form={formId || 'standard-edit-form'} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        <form
          id={formId || 'standard-edit-form'}
          onSubmit={onSubmit}
          className="space-y-6"
        >
          {sections && sections.length > 0 ? (
            sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && <CardDescription>{section.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">{section.content}</CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">{children}</CardContent>
            </Card>
          )}

          {/* Ações do formulário */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {showCancel && (
              <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                {cancelLabel}
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

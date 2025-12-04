import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Separator } from '@/components/ui';
import { ArrowLeft, Edit, Trash2, Download, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

interface StandardDetailPageProps {
  title: string;
  subtitle?: string;
  description?: string;
  onBack?: () => void;
  backUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  additionalActions?: ReactNode;
  tabs?: Array<{
    value: string;
    label: string;
    content: ReactNode;
    badge?: number;
  }>;
  sections?: Array<{
    title: string;
    description?: string;
    content: ReactNode;
  }>;
  loading?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showExport?: boolean;
}

/**
 * Template padrão para páginas de detalhe
 * 
 * Inclui:
 * - Header com breadcrumb
 * - Ações (editar, excluir, exportar)
 * - Tabs (opcional)
 * - Seções de conteúdo
 * - Loading state
 */
export function StandardDetailPage({
  title,
  subtitle,
  description,
  onBack,
  backUrl,
  onEdit,
  onDelete,
  onExport,
  additionalActions,
  tabs,
  sections,
  loading = false,
  showEdit = true,
  showDelete = false,
  showExport = false,
}: StandardDetailPageProps) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
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
            <Button variant="ghost" size="icon" onClick={handleBack}>
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
            {additionalActions}
            {(showEdit || showDelete || showExport) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {showEdit && onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {showExport && onExport && (
                    <DropdownMenuItem onClick={onExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                  )}
                  {showDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {showEdit && onEdit && (
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {tabs && tabs.length > 0 ? (
          <Tabs defaultValue={tabs[0].value} className="space-y-4">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        ) : sections && sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && <CardDescription>{section.description}</CardDescription>}
                </CardHeader>
                <CardContent>{section.content}</CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Save, FileText, Eye, Code, History, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { diaryTemplateService, type DiaryTemplate } from '../services/diaryTemplateService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DiaryTemplateEditorProps {
  tenantId: string;
  schoolId?: string;
  userId: string;
  onSave?: () => void;
}

const TEMPLATE_TYPES = {
  diary_entry: 'Registro de Aula',
  descriptive_report: 'Parecer Descritivo',
  report_card: 'Boletim Escolar',
};

const TEMPLATE_VARIABLES = {
  diary_entry: [
    { key: 'date', description: 'Data da aula' },
    { key: 'lesson_topic', description: 'Tema da aula' },
    { key: 'content_taught', description: 'Conteúdo ministrado' },
    { key: 'activities', description: 'Atividades realizadas' },
    { key: 'homework_assigned', description: 'Tarefas de casa' },
    { key: 'observations', description: 'Observações' },
    { key: 'class_name', description: 'Nome da turma' },
    { key: 'subject_name', description: 'Nome da disciplina' },
  ],
  descriptive_report: [
    { key: 'student_name', description: 'Nome do aluno' },
    { key: 'period', description: 'Período (bimestre)' },
    { key: 'academic_year', description: 'Ano letivo' },
    { key: 'report_text', description: 'Texto do parecer' },
    { key: 'date', description: 'Data' },
  ],
  report_card: [
    { key: 'student_name', description: 'Nome do aluno' },
    { key: 'class_name', description: 'Nome da turma' },
    { key: 'academic_year', description: 'Ano letivo' },
    { key: 'period', description: 'Período (bimestre)' },
    { key: 'grades_table', description: 'Tabela de notas' },
    { key: 'attendance_summary', description: 'Resumo de frequência' },
    { key: 'reports', description: 'Pareceres' },
  ],
};

export function DiaryTemplateEditor({
  tenantId,
  schoolId,
  userId,
  onSave,
}: DiaryTemplateEditorProps) {
  const [templates, setTemplates] = useState<DiaryTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DiaryTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<DiaryTemplate>>({
    template_type: 'diary_entry',
    template_name: '',
    template_content: '',
    is_default: false,
    is_active: true,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [templateVersions, setTemplateVersions] = useState<any[]>([]);
  const [_showVersions, _setShowVersions] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [tenantId, schoolId]);

  async function loadTemplates() {
    try {
      const data = await diaryTemplateService.getTemplates({
        tenantId,
        schoolId,
      });
      setTemplates(data);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    }
  }

  async function handleEditTemplate(template: DiaryTemplate) {
    setSelectedTemplate(template);
    setEditingTemplate({
      template_type: template.template_type,
      template_name: template.template_name,
      template_content: template.template_content,
      template_fields: template.template_fields,
      is_default: template.is_default,
      is_active: template.is_active,
    });
    setPreviewMode(false);
    
    // Carregar versões do template
    try {
      const versions = await diaryTemplateService.getTemplateVersions(template.id);
      setTemplateVersions(versions);
    } catch (error) {
      console.error('Erro ao carregar versões:', error);
    }
  }

  async function handleRestoreVersion(versionId: string) {
    if (!selectedTemplate) return;
    
    if (!confirm('Deseja restaurar esta versão? A versão atual será salva automaticamente.')) {
      return;
    }

    try {
      const restored = await diaryTemplateService.restoreTemplateVersion(
      selectedTemplate.id,
      versionId
    );
      
      setEditingTemplate({
        ...editingTemplate,
        template_content: restored.template_content,
        template_fields: restored.template_fields,
      });
      
      toast.success('Versão restaurada com sucesso');
      await loadTemplates();
    } catch (error: any) {
      console.error('Erro ao restaurar versão:', error);
      toast.error('Erro ao restaurar versão');
    }
  }

  function handleNewTemplate() {
    setSelectedTemplate(null);
    setEditingTemplate({
      template_type: 'diary_entry',
      template_name: '',
      template_content: '',
      template_fields: {},
      is_default: false,
      is_active: true,
    });
    setPreviewMode(false);
  }

  async function handleSave() {
    if (!editingTemplate.template_name || !editingTemplate.template_content) {
      toast.error('Preencha nome e conteúdo do template');
      return;
    }

    try {
      setSaving(true);

      if (selectedTemplate) {
        await diaryTemplateService.updateTemplate(selectedTemplate.id, {
          ...editingTemplate,
          tenant_id: tenantId,
          school_id: schoolId,
        } as DiaryTemplate);
        toast.success('Template atualizado com sucesso');
      } else {
        await diaryTemplateService.createTemplate({
          ...editingTemplate,
          tenant_id: tenantId,
          school_id: schoolId,
          created_by: userId,
        } as DiaryTemplate);
        toast.success('Template criado com sucesso');
      }

      await loadTemplates();
      setSelectedTemplate(null);
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error(error.message || 'Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    if (!editingTemplate.template_content) {
      toast.error('Adicione conteúdo ao template para visualizar');
      return;
    }

    try {
      const template: DiaryTemplate = {
        id: selectedTemplate?.id || '',
        tenant_id: tenantId,
        school_id: schoolId,
        template_type: editingTemplate.template_type || 'diary_entry',
        template_name: editingTemplate.template_name || '',
        template_content: editingTemplate.template_content,
        template_fields: editingTemplate.template_fields || {},
        is_default: editingTemplate.is_default || false,
        is_active: editingTemplate.is_active !== undefined ? editingTemplate.is_active : true,
        created_at: selectedTemplate?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
      };

      // Dados de exemplo para preview
      const exampleData: Record<string, any> = {
        date: new Date().toLocaleDateString('pt-BR'),
        lesson_topic: 'Exemplo de Tema da Aula',
        content_taught: 'Conteúdo ministrado em exemplo',
        activities: 'Atividade 1, Atividade 2',
        homework_assigned: 'Exercícios da página X',
        observations: 'Observações do exemplo',
        class_name: 'Turma A',
        subject_name: 'Matemática',
        student_name: 'João Silva',
        period: '1',
        academic_year: new Date().getFullYear(),
        report_text: 'Parecer descritivo de exemplo...',
        grades_table: 'Tabela de notas (exemplo)',
        attendance_summary: 'Resumo de frequência (exemplo)',
        reports: 'Pareceres (exemplo)',
      };

      const rendered = await diaryTemplateService.renderTemplate(template, exampleData);
      setPreviewData({ rendered });
      setPreviewMode(true);
    } catch (error: any) {
      console.error('Erro ao gerar preview:', error);
      toast.error('Erro ao gerar preview');
    }
  }

  const currentVariables = editingTemplate.template_type
    ? TEMPLATE_VARIABLES[editingTemplate.template_type as keyof typeof TEMPLATE_VARIABLES] || []
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Templates Personalizados</CardTitle>
            <Button onClick={handleNewTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handleEditTemplate(template)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.template_name}</span>
                    <Badge variant="outline">
                      {TEMPLATE_TYPES[template.template_type]}
                    </Badge>
                    {template.is_default && (
                      <Badge variant="default">Padrão</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.template_content.substring(0, 100)}...
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTemplate(template);
                  }}
                >
                  Editar
                </Button>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum template criado. Clique em "Novo Template" para criar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      {(selectedTemplate || editingTemplate.template_name) && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedTemplate(null);
          setEditingTemplate({
            template_type: 'diary_entry',
            template_name: '',
            template_content: '',
            is_default: false,
            is_active: true,
          });
          setPreviewMode(false);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Personalize o template usando variáveis entre chaves duplas: {'{{variável}}'}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="edit" className="mt-4">
              <TabsList>
                <TabsTrigger value="edit">
                  <Code className="h-4 w-4 mr-2" />
                  Editar
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </TabsTrigger>
                <TabsTrigger value="variables">
                  <FileText className="h-4 w-4 mr-2" />
                  Variáveis
                </TabsTrigger>
                {selectedTemplate && (
                  <TabsTrigger value="versions">
                    <History className="h-4 w-4 mr-2" />
                    Histórico
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="edit" className="space-y-4">
                <div>
                  <Label htmlFor="templateType">Tipo de Template</Label>
                  <Select
                    value={editingTemplate.template_type}
                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, template_type: value as any })}
                  >
                    <SelectTrigger id="templateType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diary_entry">Registro de Aula</SelectItem>
                      <SelectItem value="descriptive_report">Parecer Descritivo</SelectItem>
                      <SelectItem value="report_card">Boletim Escolar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="templateName">Nome do Template *</Label>
                  <Input
                    id="templateName"
                    value={editingTemplate.template_name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })}
                    placeholder="Ex: Template Personalizado - Registro de Aula"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="templateContent">Conteúdo do Template *</Label>
                  <Textarea
                    id="templateContent"
                    value={editingTemplate.template_content}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, template_content: e.target.value })}
                    placeholder="Use {{variável}} para inserir dados dinâmicos"
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Markdown ou HTML para formatação
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isDefault"
                      checked={editingTemplate.is_default}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, is_default: checked === true })}
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">
                      Template padrão
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isActive"
                      checked={editingTemplate.is_active !== false}
                      onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, is_active: checked === true })}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Ativo
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Template'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="preview">
                {previewMode && previewData.rendered ? (
                  <div className="border rounded-lg p-4 bg-background">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewData.rendered.replace(/\n/g, '<br>') }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Clique em "Visualizar" na aba de edição para ver o preview</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="variables">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Variáveis disponíveis para este tipo de template:
                  </p>
                  {currentVariables.map((variable) => (
                    <div key={variable.key} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {'{{' + variable.key + '}}'}
                        </code>
                        <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const content = editingTemplate.template_content || '';
                          setEditingTemplate({
                            ...editingTemplate,
                            template_content: content + `{{${variable.key}}}`,
                          });
                        }}
                      >
                        Inserir
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {selectedTemplate && (
                <TabsContent value="versions">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Histórico de Versões</h3>
                      <Badge variant="outline">
                        {templateVersions.length} versões
                      </Badge>
                    </div>
                    {templateVersions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma versão anterior encontrada
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {templateVersions.map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">
                                  Versão {version.version_number}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(version.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                                {version.created_by_profile && (
                                  <span className="text-xs text-muted-foreground">
                                    por {version.created_by_profile.full_name}
                                  </span>
                                )}
                              </div>
                              {version.change_description && (
                                <p className="text-sm text-muted-foreground">
                                  {version.change_description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {version.template_content.substring(0, 100)}...
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVersion(version.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restaurar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


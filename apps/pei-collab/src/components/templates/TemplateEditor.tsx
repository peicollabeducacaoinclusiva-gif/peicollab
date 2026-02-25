import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type { TemplateDetail, TemplateField, TemplateSection } from '@/hooks/useTemplateEditor';

type TemplateEditorProps = {
  template: TemplateDetail;
  saving: boolean;
  onSave: (payload: TemplateDetail) => void;
};

const fieldTypes = ['text', 'textarea', 'select', 'multiselect', 'boolean', 'date', 'number'];

export function TemplateEditor({ template, saving, onSave }: TemplateEditorProps) {
  const [draft, setDraft] = useState<TemplateDetail>(template);

  const updateSection = (
    sectionId: string,
    updater: (section: TemplateSection) => TemplateSection
  ) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? updater(section) : section
      ),
    }));
  };

  const addSection = () => {
    setDraft((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `tmp-${Date.now()}`,
          nome_secao: 'Nova secao',
          ordem: prev.sections.length + 1,
          fields: [],
        },
      ],
    }));
  };

  const addField = (sectionId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      fields: [
        ...section.fields,
        {
          id: `tmp-${Date.now()}`,
          label: 'Novo campo',
          tipo_campo: 'text',
          required: false,
          ordem: section.fields.length + 1,
        },
      ],
    }));
  };

  const payload = useMemo(() => ({ ...draft }), [draft]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do template</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome do template</Label>
            <Input
              value={draft.nome_template}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, nome_template: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={draft.tipo}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, tipo: value as TemplateDetail['tipo'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estudo_caso">Estudo de caso</SelectItem>
                <SelectItem value="paee">PAEE</SelectItem>
                <SelectItem value="pei">PEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Secoes</h2>
        <Button variant="outline" onClick={addSection}>
          Adicionar secao
        </Button>
      </div>

      <div className="space-y-6">
        {draft.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">
                <Input
                  value={section.nome_secao}
                  onChange={(event) =>
                    updateSection(section.id, (prev) => ({
                      ...prev,
                      nome_secao: event.target.value,
                    }))
                  }
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.id} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                  <Input
                    value={field.label}
                    onChange={(event) =>
                      updateSection(section.id, (prev) => ({
                        ...prev,
                        fields: prev.fields.map((item) =>
                          item.id === field.id ? { ...item, label: event.target.value } : item
                        ),
                      }))
                    }
                  />
                  <Select
                    value={field.tipo_campo}
                    onValueChange={(value) =>
                      updateSection(section.id, (prev) => ({
                        ...prev,
                        fields: prev.fields.map((item) =>
                          item.id === field.id ? { ...item, tipo_campo: value } : item
                        ),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={field.required ? 'sim' : 'nao'}
                    onValueChange={(value) =>
                      updateSection(section.id, (prev) => ({
                        ...prev,
                        fields: prev.fields.map((item) =>
                          item.id === field.id ? { ...item, required: value === 'sim' } : item
                        ),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Obrigatorio</SelectItem>
                      <SelectItem value="nao">Opcional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <Separator />
              <Button variant="outline" onClick={() => addField(section.id)}>
                Adicionar campo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onSave(payload)} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

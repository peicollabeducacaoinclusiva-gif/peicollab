import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TemplateListItem = {
  id: string;
  nome_template: string;
  tipo: string;
  versao: number;
  ativo: boolean;
};

type TemplateListProps = {
  templates: TemplateListItem[];
};

export function TemplateList({ templates }: TemplateListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle className="text-base">{template.nome_template}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{template.tipo}</Badge>
              <Badge variant="outline">Versão {template.versao}</Badge>
              <Badge variant={template.ativo ? 'default' : 'secondary'}>
                {template.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/dashboard/templates/${template.id}/edit`}>Editar</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

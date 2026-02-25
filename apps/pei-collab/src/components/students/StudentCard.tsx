import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StudentCardProps = {
  id: string;
  nome: string;
  serie?: string | null;
  categoria?: string | null;
  escola?: string | null;
};

export function StudentCard({ id, nome, serie, categoria, escola }: StudentCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-base">
          <Link href={`/dashboard/students/${id}`} className="hover:underline">
            {nome}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          {serie ? <Badge variant="secondary">Série {serie}</Badge> : null}
          {categoria ? <Badge variant="outline">{categoria}</Badge> : null}
        </div>
        {escola ? <p>Escola: {escola}</p> : null}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StudentDocument } from '../../services/unifiedStudentService';

interface StudentDocumentsProps {
  documents: StudentDocument[];
}

export function StudentDocuments({ documents }: StudentDocumentsProps) {
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Nenhum documento encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = (document: StudentDocument) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {doc.type}
                  </div>
                </TableCell>
                <TableCell>{doc.title}</TableCell>
                <TableCell>
                  {doc.created_at
                    ? format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })
                    : '-'}
                </TableCell>
                <TableCell>
                  {doc.file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


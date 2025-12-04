import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CSVUploadDialogProps {
  schoolId?: string;
  onStudentsCreated: () => void;
}

interface CSVRow {
  name: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
}

const CSVUploadDialog = ({ schoolId, onStudentsCreated }: CSVUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: string[];
  }>({ success: 0, errors: [] });
  const { toast } = useToast();

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const row: CSVRow = {
        name: values[0] || '',
        dateOfBirth: values[1] || undefined,
        fatherName: values[2] || undefined,
        motherName: values[3] || undefined,
        phone: values[4] || undefined,
        email: values[5] || undefined,
      };

      if (row.name) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setCsvData(parsed);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!csvData.length) {
      toast({
        title: "Erro",
        description: "Nenhum dado válido encontrado no CSV.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadResults({ success: 0, errors: [] });

    try {
      // Buscar tenant_id da escola se necessário
      let tenantId: string | undefined;
      if (schoolId) {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('tenant_id')
          .eq('id', schoolId)
          .single();
        
        if (!schoolData?.tenant_id) {
          throw new Error('Não foi possível determinar a rede da escola');
        }
        tenantId = schoolData.tenant_id;
      }

      const results = { success: 0, errors: [] as string[] };
      const total = csvData.length;

      for (let i = 0; i < csvData.length; i++) {
        try {
          const studentData: any = {
            name: csvData[i].name,
            date_of_birth: csvData[i].dateOfBirth || null,
            father_name: csvData[i].fatherName || null,
            mother_name: csvData[i].motherName || null,
            phone: csvData[i].phone || null,
            email: csvData[i].email || null,
          };

          if (schoolId) {
            studentData.school_id = schoolId;
            studentData.tenant_id = tenantId;
          }

          const { error } = await supabase.from("students").insert(studentData);
          
          if (error) throw error;
          
          results.success++;
        } catch (error: any) {
          results.errors.push(`Linha ${i + 2}: ${error.message}`);
        }

        setUploadProgress(((i + 1) / total) * 100);
        setUploadResults({ ...results });
      }

      setUploadResults(results);

      if (results.success > 0) {
        toast({
          title: "Upload concluído!",
          description: `${results.success} alunos cadastrados com sucesso.`,
        });
        onStudentsCreated();
      }

      if (results.errors.length > 0) {
        toast({
          title: "Alguns erros ocorreram",
          description: `${results.errors.length} alunos não puderam ser cadastrados.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = "Nome,Data de Nascimento,Nome do Pai,Nome da Mãe,Telefone,Email\nJoão Silva,2010-05-15,José Silva,Maria Silva,(11) 99999-9999,joao@email.com\nMaria Santos,2011-03-20,Pedro Santos,Ana Santos,(11) 88888-8888,maria@email.com";
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_alunos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload de Alunos em Lote</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV para cadastrar múltiplos alunos de uma vez.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Template CSV</CardTitle>
              <CardDescription>
                Baixe o template para ver o formato correto dos dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <FileText className="mr-2 h-4 w-4" />
                Baixar Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {file.name} ({csvData.length} alunos encontrados)
              </p>
            )}
          </div>

          {/* Preview */}
          {csvData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pré-visualização</CardTitle>
                <CardDescription>
                  {csvData.length} alunos serão cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {csvData.slice(0, 5).map((row, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <strong>{row.name}</strong>
                        {row.dateOfBirth && ` • ${row.dateOfBirth}`}
                        {row.fatherName && ` • Pai: ${row.fatherName}`}
                      </div>
                    ))}
                    {csvData.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... e mais {csvData.length - 5} alunos
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {loading && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Processando Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={uploadProgress} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {uploadResults.success} alunos cadastrados
                </p>
                {uploadResults.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {uploadResults.errors.length} erros
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {!loading && uploadResults.success > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {uploadResults.success} alunos cadastrados com sucesso!
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {uploadResults.errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  Erros encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto">
                  {uploadResults.errors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-xs text-red-600 mb-1">
                      {error}
                    </p>
                  ))}
                  {uploadResults.errors.length > 10 && (
                    <p className="text-xs text-red-600">
                      ... e mais {uploadResults.errors.length - 10} erros
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!csvData.length || loading}
          >
            {loading ? "Processando..." : `Cadastrar ${csvData.length} Alunos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CSVUploadDialog;



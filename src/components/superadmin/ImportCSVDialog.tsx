import { useState } from "react";
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
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImportCSVDialogProps {
  type: "users" | "tenants" | "students" | "peis";
  onImportComplete: () => void;
}

const ImportCSVDialog = ({ type, onImportComplete }: ImportCSVDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getTypeLabel = () => {
    const labels = {
      users: "Usuários",
      tenants: "Escolas",
      students: "Alunos",
      peis: "PEIs",
    };
    return labels[type];
  };

  const getCSVTemplate = () => {
    const templates = {
      users: "full_name,email,role,tenant_id\nJoão Silva,joao@email.com,teacher,uuid-da-escola",
      tenants: "name\nEscola Municipal ABC",
      students: "name,date_of_birth,father_name,mother_name,tenant_id\nMaria Silva,2010-05-15,José Silva,Ana Silva,uuid-da-escola",
      peis: "student_id,assigned_teacher_id,tenant_id,status\nuuid-do-aluno,uuid-do-professor,uuid-da-escola,draft",
    };
    return templates[type];
  };

  const downloadTemplate = () => {
    const template = getCSVTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1);

    return rows.map((row) => {
      const values = row.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || null;
      });
      return obj;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error("Arquivo CSV vazio ou inválido");
      }

      let successCount = 0;
      let errorCount = 0;

      for (const item of data) {
        try {
          if (type === "users") {
            // Create user in auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: item.email,
              email_confirm: true,
              user_metadata: {
                full_name: item.full_name,
                role: item.role,
                tenant_id: item.tenant_id,
              },
            });
            if (authError) throw authError;
            successCount++;
          } else {
            const table = type === "tenants" ? "tenants" : type === "students" ? "students" : "peis";
            const { error } = await supabase.from(table).insert(item);
            if (error) throw error;
            successCount++;
          }
        } catch (error: any) {
          console.error(`Erro ao importar item:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Importação concluída",
        description: `${successCount} registros importados com sucesso. ${errorCount} erros.`,
      });

      onImportComplete();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar {getTypeLabel()} em Lote</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV para importar múltiplos registros de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              Baixar Template CSV
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Baixe o template para ver o formato correto do arquivo
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVDialog;

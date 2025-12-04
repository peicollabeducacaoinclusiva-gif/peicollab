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
  type: "users" | "tenants" | "students" | "peis" | "schools";
  onImportComplete: () => void;
}

const ImportCSVDialog = ({ type, onImportComplete }: ImportCSVDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getTypeLabel = () => {
    const labels = {
      users: "Usuários",
      tenants: "Redes",
      students: "Alunos",
      peis: "PEIs",
      schools: "Escolas",
    };
    return labels[type];
  };

  const getCSVTemplate = () => {
    const templates = {
      users: "full_name,email,role,tenant_id\nJoão Silva,joao@email.com,teacher,uuid-da-escola",
      tenants: "network_name,network_email,network_phone,network_address,network_responsible\n\"Rede Municipal de Ensino\",\"contato@escola.com\",\"(11) 99999-9999\",\"Rua das Flores 123\",\"João Silva\"",
      schools: "school_name,school_address,school_phone,school_email,tenant_id\n\"Escola Municipal João Silva\",\"Rua das Flores, 123 - Centro\",\"(11) 3456-7890\",\"escola@municipio.gov.br\",\"uuid-da-rede\"",
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

    // Função para fazer parse correto de CSV com vírgulas dentro dos campos
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1);

    return rows.map((row) => {
      const values = parseCSVLine(row);
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
      console.log("Conteúdo do arquivo:", text);
      
      const data = parseCSV(text);
      console.log("Dados parseados:", data);

      if (data.length === 0) {
        throw new Error("Arquivo CSV vazio ou inválido");
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const item of data) {
        try {
          console.log("Processando item:", item);
          
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
            const table = type === "tenants" ? "tenants" : type === "schools" ? "schools" : type === "students" ? "students" : "peis";
            
            let itemToInsert = item;
            
            // Para tenants, garantir que o campo 'network_name' existe e não está vazio
            if (type === "tenants") {
              if (!item.network_name || item.network_name.trim() === "") {
                throw new Error("Nome da rede de ensino é obrigatório");
              }
              
              // Limpar campos vazios e definir valores padrão
              itemToInsert = {
                network_name: item.network_name.trim(),
                network_email: item.network_email?.trim() || null,
                network_phone: item.network_phone?.trim() || null,
                network_address: item.network_address?.trim() || null,
                network_responsible: item.network_responsible?.trim() || null,
                is_active: true
              };
              
              console.log("Dados limpos para inserção:", itemToInsert);
            }
            
            // Para schools, garantir que os campos obrigatórios existem
            if (type === "schools") {
              if (!item.school_name || item.school_name.trim() === "") {
                throw new Error("Nome da escola é obrigatório");
              }
              
              if (!item.tenant_id || item.tenant_id.trim() === "") {
                throw new Error("ID da rede municipal (tenant_id) é obrigatório");
              }
              
              // Limpar campos vazios e definir valores padrão
              itemToInsert = {
                school_name: item.school_name.trim(),
                school_address: item.school_address?.trim() || null,
                school_phone: item.school_phone?.trim() || null,
                school_email: item.school_email?.trim() || null,
                tenant_id: item.tenant_id.trim(),
                is_active: item.is_active !== undefined ? item.is_active : true
              };
              
              console.log("Dados limpos para inserção:", itemToInsert);
            }
            
            console.log(`Inserindo no banco - tabela: ${table}, dados:`, itemToInsert);
            const { error } = await supabase.from(table).insert(itemToInsert);
            if (error) {
              console.error("Erro do Supabase:", error);
              throw error;
            }
            successCount++;
          }
        } catch (error: any) {
          console.error(`Erro ao importar item:`, error);
          errors.push(`${item.name || 'Item'}: ${error.message}`);
          errorCount++;
        }
      }

      if (errorCount > 0) {
        toast({
          title: "Importação com erros",
          description: `${successCount} registros importados com sucesso. ${errorCount} erros. Verifique o console para detalhes.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Importação concluída",
          description: `${successCount} registros importados com sucesso.`,
        });
      }

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

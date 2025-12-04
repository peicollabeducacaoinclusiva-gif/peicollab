import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const ImportTest = () => {
  const [result, setResult] = useState<string>("");

  const testDirectInsert = async () => {
    try {
      const testData = {
        network_name: "Rede Municipal de Ensino - Teste",
        network_email: "teste@escola.com",
        network_phone: "(11) 99999-9999",
        network_address: "Rua Teste, 123",
        network_responsible: "João Silva",
        is_active: true
      };

      console.log("Testando inserção direta:", testData);
      console.log("Supabase client:", supabase);
      
      // Testar conexão primeiro
      const { data: testConnection, error: connectionError } = await supabase
        .from("tenants")
        .select("count")
        .limit(1);
      
      if (connectionError) {
        console.error("Erro de conexão:", connectionError);
        setResult(`ERRO DE CONEXÃO: ${connectionError.message}`);
        return;
      }
      
      console.log("Conexão OK, testando inserção...");
      
      const { data, error } = await supabase
        .from("tenants")
        .insert(testData)
        .select();

      if (error) {
        console.error("Erro do Supabase:", error);
        setResult(`ERRO: ${error.message}\nCódigo: ${error.code}\nDetalhes: ${JSON.stringify(error.details)}`);
      } else {
        console.log("Sucesso:", data);
        setResult(`SUCESSO: Escola inserida com ID ${data[0]?.id}`);
      }
    } catch (error: any) {
      console.error("Erro geral:", error);
      setResult(`ERRO GERAL: ${error.message}\nStack: ${error.stack}`);
    }
  };

  const testCSVParsing = () => {
    const csvContent = `network_name,network_email,network_phone,network_address,network_responsible
"Rede Municipal de Ensino","","","(São Gonçalo dos Campos - BA)",""`;

    console.log("CSV de teste:", csvContent);
    
    // Simular o parsing
    const lines = csvContent.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1);

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

    const parsedData = rows.map((row) => {
      const values = parseCSVLine(row);
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || null;
      });
      return obj;
    });

    console.log("Dados parseados:", parsedData);
    
    // Limpar dados
    const cleanData = parsedData.map(item => ({
      network_name: item.network_name?.trim() || "",
      network_email: item.network_email?.trim() || null,
      network_phone: item.network_phone?.trim() || null,
      network_address: item.network_address?.trim() || null,
      network_responsible: item.network_responsible?.trim() || null,
      is_active: true
    }));

    console.log("Dados limpos:", cleanData);
    setResult(`CSV Parseado: ${JSON.stringify(cleanData, null, 2)}`);
  };

  const testCSVInsert = async () => {
    try {
      const csvContent = `network_name,network_email,network_phone,network_address,network_responsible
"Rede Municipal de Ensino","","","(São Gonçalo dos Campos - BA)",""`;

      console.log("Testando inserção CSV completa...");
      
      // Parse CSV
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1);

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

      const parsedData = rows.map((row) => {
        const values = parseCSVLine(row);
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || null;
        });
        return obj;
      });

      console.log("Dados parseados:", parsedData);

      // Processar cada item
      for (const item of parsedData) {
        console.log("Processando item:", item);
        
        // Limpar dados
        const cleanItem = {
          network_name: item.network_name?.trim() || "",
          network_email: item.network_email?.trim() || null,
          network_phone: item.network_phone?.trim() || null,
          network_address: item.network_address?.trim() || null,
          network_responsible: item.network_responsible?.trim() || null,
          is_active: true
        };

        console.log("Dados limpos:", cleanItem);

        // Validar
        if (!cleanItem.network_name || cleanItem.network_name.trim() === "") {
          throw new Error("Nome da rede de ensino é obrigatório");
        }

        // Inserir
        const { data, error } = await supabase
          .from("tenants")
          .insert(cleanItem)
          .select();

        if (error) {
          console.error("Erro na inserção:", error);
          setResult(`ERRO NA INSERÇÃO: ${error.message}\nCódigo: ${error.code}\nDetalhes: ${JSON.stringify(error.details)}`);
          return;
        }

        console.log("Sucesso na inserção:", data);
      }

      setResult("SUCESSO: Todos os itens foram inseridos!");
    } catch (error: any) {
      console.error("Erro geral:", error);
      setResult(`ERRO GERAL: ${error.message}\nStack: ${error.stack}`);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Teste de Importação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testDirectInsert}>
            Testar Inserção Direta
          </Button>
          <Button onClick={testCSVParsing} variant="outline">
            Testar Parsing CSV
          </Button>
          <Button onClick={testCSVInsert} variant="secondary">
            Testar Inserção CSV Completa
          </Button>
        </div>
        
        {result && (
          <div>
            <h3 className="font-semibold mb-2">Resultado:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportTest;

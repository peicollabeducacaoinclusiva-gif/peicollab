import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PEIPrintTemplate from "./PEIPrintTemplate";

interface BulkPrintPEIDialogProps {
  peiIds: string[];
  open: boolean;
  onClose: () => void;
}

const BulkPrintPEIDialog = ({ peiIds, open, onClose }: BulkPrintPEIDialogProps) => {
  const [peis, setPeis] = useState<any[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && peiIds.length > 0) {
      loadAllPEIs();
    }
  }, [open, peiIds]);

  const loadAllPEIs = async () => {
    try {
      setLoading(true);
      
      // Carregar todos os PEIs selecionados
      const { data: peisData, error: peisError } = await supabase
        .from("peis")
        .select(`
          *,
          students(name, date_of_birth),
          tenants(network_name),
          schools(school_name)
        `)
        .in("id", peiIds)
        .order("students(name)");

      if (peisError) throw peisError;

      // Buscar nomes dos professores para cada PEI
      const peisWithTeachers = await Promise.all(
        (peisData || []).map(async (pei) => {
          let teacherData = null;
          if (pei.assigned_teacher_id) {
            const { data: teacherProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", pei.assigned_teacher_id)
              .single();
            
            if (teacherProfile) {
              teacherData = { full_name: teacherProfile.full_name };
            }
          }
          
          return {
            ...pei,
            profiles: teacherData,
          };
        })
      );

      setPeis(peisWithTeachers);

      // Carregar logo da rede (usar o primeiro PEI como referência)
      if (peisData && peisData.length > 0 && peisData[0].tenant_id) {
        const { data: files } = await supabase.storage
          .from("school-logos")
          .list(peisData[0].tenant_id);

        if (files && files.length > 0) {
          const { data: urlData } = supabase.storage
            .from("school-logos")
            .getPublicUrl(`${peisData[0].tenant_id}/${files[0].name}`);
          
          setLogoUrl(urlData.publicUrl);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar PEIs:", error);
      toast({
        title: "Erro ao carregar PEIs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de exportar PDF estará disponível em breve.",
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregando PEIs...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Impressão em Lote - {peis.length} PEI{peis.length !== 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Serão impressos <strong>{peis.length} PEI{peis.length !== 1 ? 's' : ''}</strong>. 
                Cada PEI será impresso em páginas separadas.
                {peis.length > 10 && (
                  <span className="block mt-2 text-orange-600 font-semibold">
                    ⚠️ Atenção: Este é um documento grande ({peis.length} PEIs). 
                    A impressão pode levar alguns minutos.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Lista dos PEIs que serão impressos */}
            <div className="border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
              <h3 className="font-semibold mb-2 text-sm">PEIs Selecionados:</h3>
              <div className="space-y-1 text-sm">
                {peis.map((pei, index) => (
                  <div key={pei.id} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{index + 1}.</span>
                    <span className="font-medium">{pei.students?.name}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-600">{pei.schools?.school_name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Todos ({peis.length})
              </Button>
              
              <Button variant="outline" onClick={handleExportPDF} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF Único
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conteúdo para impressão - oculto na tela, visível na impressão */}
      {open && peis.length > 0 && (
        <>
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 1cm 1.5cm;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              body * {
                visibility: hidden !important;
              }
              
              .bulk-print-content,
              .bulk-print-content * {
                visibility: visible !important;
              }
              
              .bulk-print-content {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 15px !important;
                font-size: 9pt !important;
                line-height: 1.3 !important;
              }
              
              .page-break {
                page-break-after: always !important;
                page-break-inside: avoid !important;
              }
              
              /* Evitar quebra de página dentro de seções importantes */
              .print-content h2,
              .print-content h3 {
                page-break-after: avoid !important;
              }
              
              .print-content h1 {
                font-size: 16pt !important;
                margin: 8px 0 !important;
              }
              
              .print-content h2 {
                font-size: 11pt !important;
                margin: 6px 0 3px 0 !important;
                padding-bottom: 2px !important;
              }
              
              .print-content h3 {
                font-size: 10pt !important;
                margin: 4px 0 2px 0 !important;
              }
              
              .print-content p {
                margin: 2px 0 !important;
              }
              
              .print-content img {
                max-width: 100px !important;
                max-height: 100px !important;
              }
            }
            
            @media screen {
              .bulk-print-content {
                display: none !important;
              }
            }
          `}</style>

          <div className="bulk-print-content">
            {peis.map((pei, index) => (
              <div key={pei.id}>
                <PEIPrintTemplate pei={pei} logoUrl={logoUrl} />
                {/* Não adicionar page-break no último PEI */}
                {index < peis.length - 1 && <div className="page-break" />}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default BulkPrintPEIDialog;


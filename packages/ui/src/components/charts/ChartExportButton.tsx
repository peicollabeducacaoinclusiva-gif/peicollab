import React, { useState } from 'react';
import { Button } from '../button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu';
import { Download, FileImage, FileText, Loader2 } from 'lucide-react';
import { exportChartAsPNG, exportChartAsPDF } from '../../utils/chartExport';

interface ChartExportButtonProps {
  chartElementRef: React.RefObject<HTMLElement>;
  filename?: string;
  title?: string;
  className?: string;
}

export function ChartExportButton({
  chartElementRef,
  filename = 'grafico',
  title,
  className,
}: ChartExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    if (!chartElementRef.current) return;

    setIsExporting(true);
    try {
      await exportChartAsPNG(chartElementRef.current, filename);
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!chartElementRef.current) return;

    setIsExporting(true);
    try {
      await exportChartAsPDF(chartElementRef.current, filename, title);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPNG} disabled={isExporting}>
          <FileImage className="h-4 w-4 mr-2" />
          PNG
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


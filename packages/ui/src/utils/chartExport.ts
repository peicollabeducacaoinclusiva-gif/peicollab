import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exporta um gráfico como imagem PNG
 */
export async function exportChartAsPNG(
  chartElement: HTMLElement,
  filename: string = 'grafico'
): Promise<void> {
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = url;
    link.click();
  } catch (error) {
    console.error('Erro ao exportar gráfico como PNG:', error);
    throw error;
  }
}

/**
 * Exporta um gráfico como PDF
 */
export async function exportChartAsPDF(
  chartElement: HTMLElement,
  filename: string = 'grafico',
  title?: string
): Promise<void> {
  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 280; // A4 landscape width - margins
    const pageHeight = 210; // A4 landscape height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Adicionar título se fornecido
    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, 10, 15);
      position = 25; // Espaço para o título
    }

    // Adicionar imagem
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Adicionar páginas adicionais se necessário
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Erro ao exportar gráfico como PDF:', error);
    throw error;
  }
}

/**
 * Exporta múltiplos gráficos como um único PDF
 */
export async function exportMultipleChartsAsPDF(
  charts: Array<{ element: HTMLElement; title: string }>,
  filename: string = 'dashboard'
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    for (let i = 0; i < charts.length; i++) {
      const chart = charts[i];
      if (!chart) continue;
      const { element, title } = chart;
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Adicionar nova página se não for o primeiro gráfico
      if (i > 0) {
        pdf.addPage();
      }

      // Adicionar título
      pdf.setFontSize(16);
      pdf.text(title, 10, 15);

      // Adicionar imagem
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Erro ao exportar múltiplos gráficos como PDF:', error);
    throw error;
  }
}


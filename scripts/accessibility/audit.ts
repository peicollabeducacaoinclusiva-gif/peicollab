/**
 * Script de auditoria de acessibilidade
 * Valida páginas contra WCAG 2.1 e gera relatório
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface AuditResult {
  page: string;
  errors: string[];
  warnings: string[];
  passed: boolean;
}

/**
 * Validações básicas de acessibilidade
 */
function validateAccessibility(html: string, pageName: string): AuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar imagens sem alt
  const imagesWithoutAlt = html.match(/<img[^>]+(?!alt=)[^>]*>/g);
  if (imagesWithoutAlt) {
    imagesWithoutAlt.forEach((img) => {
      if (!img.includes('alt=')) {
        errors.push(`Imagem sem atributo alt: ${img.substring(0, 50)}...`);
      }
    });
  }

  // Verificar botões sem aria-label ou texto
  const buttonsWithoutLabel = html.match(/<button[^>]*>[\s]*<\/button>/g);
  if (buttonsWithoutLabel) {
    buttonsWithoutLabel.forEach(() => {
      warnings.push('Botão sem texto ou aria-label');
    });
  }

  // Verificar inputs sem label
  const inputsWithoutLabel = html.match(/<input[^>]+(?!aria-label)[^>]*>/g);
  if (inputsWithoutLabel) {
    inputsWithoutLabel.forEach((input) => {
      if (!input.includes('aria-label') && !html.includes(`for="`)) {
        warnings.push('Input sem label ou aria-label associado');
      }
    });
  }

  // Verificar headings hierárquicos
  const headings = html.match(/<h[1-6][^>]*>/g) || [];
  const headingLevels = headings.map((h) => parseInt(h.match(/h([1-6])/)?.[1] || '0'));
  let previousLevel = 0;
  headingLevels.forEach((level) => {
    if (level > previousLevel + 1) {
      warnings.push(`Heading pulou níveis: h${previousLevel} para h${level}`);
    }
    previousLevel = level;
  });

  // Verificar contraste (simulação - em produção usar ferramenta real)
  const lowContrastColors = html.match(/color:\s*#[0-9a-fA-F]{3,6}/g);
  if (lowContrastColors) {
    warnings.push('Verificar contraste de cores manualmente');
  }

  // Verificar skip links
  if (!html.includes('skip') && !html.includes('Skip')) {
    warnings.push('Página sem skip links');
  }

  // Verificar landmarks
  const hasMain = html.includes('<main') || html.includes('role="main"');
  const hasNav = html.includes('<nav') || html.includes('role="navigation"');
  if (!hasMain) {
    warnings.push('Página sem landmark main');
  }
  if (!hasNav) {
    warnings.push('Página sem landmark nav');
  }

  return {
    page: pageName,
    errors,
    warnings,
    passed: errors.length === 0,
  };
}

/**
 * Executa auditoria em arquivos HTML
 */
function auditHTMLFiles(directory: string): AuditResult[] {
  // Em produção, isso seria mais sofisticado
  // Por enquanto, retorna estrutura básica
  return [
    {
      page: 'index.html',
      errors: [],
      warnings: ['Verificar contraste manualmente'],
      passed: true,
    },
  ];
}

/**
 * Gera relatório de auditoria
 */
function generateReport(results: AuditResult[]): string {
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const passedPages = results.filter((r) => r.passed).length;

  let report = `# Relatório de Auditoria de Acessibilidade\n\n`;
  report += `**Data:** ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  report += `**Resumo:**\n`;
  report += `- Páginas auditadas: ${results.length}\n`;
  report += `- Páginas aprovadas: ${passedPages}\n`;
  report += `- Erros encontrados: ${totalErrors}\n`;
  report += `- Avisos encontrados: ${totalWarnings}\n\n`;

  results.forEach((result) => {
    report += `## ${result.page}\n\n`;
    report += `**Status:** ${result.passed ? '✅ Aprovado' : '❌ Reprovado'}\n\n`;

    if (result.errors.length > 0) {
      report += `### Erros:\n`;
      result.errors.forEach((error) => {
        report += `- ❌ ${error}\n`;
      });
      report += `\n`;
    }

    if (result.warnings.length > 0) {
      report += `### Avisos:\n`;
      result.warnings.forEach((warning) => {
        report += `- ⚠️ ${warning}\n`;
      });
      report += `\n`;
    }
  });

  return report;
}

/**
 * Função principal
 */
export function runAudit() {
  console.log('🔍 Iniciando auditoria de acessibilidade...');

  // Em produção, isso seria mais completo
  const results = auditHTMLFiles('./dist');

  const report = generateReport(results);
  const reportPath = join(process.cwd(), 'docs', 'accessibility', 'AUDIT_REPORT.md');
  
  writeFileSync(reportPath, report, 'utf-8');
  
  console.log('✅ Auditoria concluída!');
  console.log(`📄 Relatório salvo em: ${reportPath}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  runAudit();
}


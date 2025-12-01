#!/usr/bin/env node

/**
 * Script para analisar o tamanho do bundle
 * Uso: node scripts/analyze-bundle.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBuildStats() {
  console.log(`${colors.cyan}📦 Analisando Bundle Size...${colors.reset}\n`);

  try {
    // Build do projeto
    console.log(`${colors.blue}🔨 Executando build...${colors.reset}`);
    execSync('pnpm build', { stdio: 'inherit' });

    // Analisar dist do app principal
    const distPath = join(process.cwd(), 'apps', 'pei-collab', 'dist');
    
    if (!existsSync(distPath)) {
      console.error(`${colors.red}❌ Diretório dist não encontrado!${colors.reset}`);
      return;
    }

    console.log(`\n${colors.cyan}📊 Análise de Bundle:${colors.reset}\n`);

    // Listar arquivos JS
    const { readdirSync, statSync } = require('fs');
    const files = readdirSync(distPath)
      .filter(file => file.endsWith('.js') || file.endsWith('.css'))
      .map(file => {
        const filePath = join(distPath, file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size,
          path: filePath,
        };
      })
      .sort((a, b) => b.size - a.size);

    let totalSize = 0;
    const chunkSizes = {};

    files.forEach(file => {
      totalSize += file.size;
      const chunkName = file.name.split('.')[0];
      if (!chunkSizes[chunkName]) {
        chunkSizes[chunkName] = { js: 0, css: 0 };
      }
      if (file.name.endsWith('.js')) {
        chunkSizes[chunkName].js = file.size;
      } else if (file.name.endsWith('.css')) {
        chunkSizes[chunkName].css = file.size;
      }
    });

    // Exibir resultados
    console.log(`${colors.green}✅ Top 10 maiores chunks:${colors.reset}\n`);
    files.slice(0, 10).forEach((file, index) => {
      const size = formatBytes(file.size);
      const color = file.size > 500000 ? colors.red : file.size > 200000 ? colors.yellow : colors.green;
      console.log(`${index + 1}. ${color}${file.name}${colors.reset} - ${size}`);
    });

    console.log(`\n${colors.cyan}📈 Resumo por chunk:${colors.reset}\n`);
    Object.entries(chunkSizes)
      .sort((a, b) => (b[1].js + b[1].css) - (a[1].js + a[1].css))
      .forEach(([chunk, sizes]) => {
        const total = sizes.js + sizes.css;
        const color = total > 500000 ? colors.red : total > 200000 ? colors.yellow : colors.green;
        console.log(`${color}${chunk}${colors.reset}:`);
        if (sizes.js > 0) console.log(`  JS:  ${formatBytes(sizes.js)}`);
        if (sizes.css > 0) console.log(`  CSS: ${formatBytes(sizes.css)}`);
        console.log(`  Total: ${formatBytes(total)}\n`);
      });

    console.log(`${colors.cyan}📊 Total do bundle: ${formatBytes(totalSize)}${colors.reset}\n`);

    // Recomendações
    console.log(`${colors.blue}💡 Recomendações:${colors.reset}\n`);
    
    const largeChunks = files.filter(f => f.size > 500000);
    if (largeChunks.length > 0) {
      console.log(`${colors.yellow}⚠️  Chunks grandes (>500KB) encontrados:${colors.reset}`);
      largeChunks.forEach(chunk => {
        console.log(`  - ${chunk.name} (${formatBytes(chunk.size)})`);
      });
      console.log(`\n  Considere code splitting adicional para estes chunks.\n`);
    }

    const vendorChunks = files.filter(f => f.name.includes('vendor'));
    const vendorSize = vendorChunks.reduce((sum, f) => sum + f.size, 0);
    if (vendorSize > 1000000) {
      console.log(`${colors.yellow}⚠️  Vendor chunks muito grandes (${formatBytes(vendorSize)})${colors.reset}`);
      console.log(`  Considere lazy loading de bibliotecas pesadas.\n`);
    }

    // Verificar se há duplicação
    console.log(`${colors.green}✅ Análise concluída!${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Erro ao analisar bundle:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Executar análise
analyzeBuildStats();


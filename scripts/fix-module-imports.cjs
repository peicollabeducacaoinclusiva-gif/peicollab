/**
 * Script para ajustar imports dos módulos após migração
 * Substitui aliases @/ por caminhos corretos do app pai
 */

const fs = require('fs');
const path = require('path');

// Configuração de mapeamentos por app
const APP_CONFIGS = {
  'gestao-escolar': {
    modulesPath: 'apps/gestao-escolar/src/modules',
    replacements: [
      // Trocar @/ por caminho relativo ao gestão-escolar
      { from: /@\/components\//g, to: '../../../components/' },
      { from: /@\/hooks\//g, to: '../../../hooks/' },
      { from: /@\/lib\//g, to: '../../../lib/' },
      { from: /@\/services\//g, to: '../../../services/' },
      { from: /@\/pages\//g, to: '../../../pages/' },
      { from: /@\/types\//g, to: '../../../types/' },
      { from: /@\/utils\//g, to: '../../../lib/utils' },
      { from: /@\/config\//g, to: '../../../config/' },
      
      // Imports de UI do shadcn
      { from: /from ['"]@\/components\/ui\//g, to: 'from \'@pei/ui\'' },
    ],
  },
  'pei-collab': {
    modulesPath: 'apps/pei-collab/src/modules',
    portalPath: 'apps/pei-collab/src/portal-responsavel',
    replacements: [
      // Manter imports @/ já que apontam para o pei-collab
      // Apenas garantir que estão corretos
    ],
    moduleSpecificReplacements: {
      'plano-aee': [
        // ThemeToggle local do módulo
        { from: /from ['"]..\/components\/shared\/ThemeToggle['"]/g, to: 'from \'../components/ThemeToggle\'' },
        { from: /from ['"]@\/components\/ThemeToggle['"]/g, to: 'from \'../components/ThemeToggle\'' },
      ],
    },
    portalReplacements: [
      // Portal: services locais
      { from: /from ['"]@\/services\//g, to: 'from \'../services/' },
      { from: /from ['"]..\/services\//g, to: 'from \'../services/' },
      
      // Componentes UI individuais (expandir barrel imports)
      { from: /\{ Card, CardHeader, CardTitle, CardContent, Button \} from ['"]@\/components\/ui['"]/g, to: '{ Card, CardHeader, CardTitle, CardContent } from \'@/components/ui/card\';\nimport { Button } from \'@/components/ui/button\'' },
      { from: /\{ Card, CardHeader, CardTitle, CardContent, Button, useToast \} from ['"]@\/components\/ui['"]/g, to: '{ Card, CardHeader, CardTitle, CardContent } from \'@/components/ui/card\';\nimport { Button } from \'@/components/ui/button\';\nimport { useToast } from \'@/hooks/use-toast\'' },
      { from: /\{ Card, CardHeader, CardTitle, CardContent \} from ['"]@\/components\/ui['"]/g, to: '{ Card, CardHeader, CardTitle, CardContent } from \'@/components/ui/card\'' },
      { from: /\{ Button \} from ['"]@\/components\/ui['"]/g, to: '{ Button } from \'@/components/ui/button\'' },
      { from: /\{ Badge \} from ['"]@\/components\/ui['"]/g, to: '{ Badge } from \'@/components/ui/badge\'' },
      { from: /\{ useToast \} from ['"]@\/components\/ui['"]/g, to: '{ useToast } from \'@/hooks/use-toast\'' },
      
      // Portal usa componentes do pei-collab (app pai)
      { from: /from ['"]..\/components\/ui\//g, to: 'from \'@/components/ui/' },
      { from: /from ['"]..\/components\//g, to: 'from \'@/components/' },
      { from: /from ['"]..\/lib\//g, to: 'from \'@/lib/' },
      { from: /from ['"]..\/hooks\//g, to: 'from \'@/hooks/' },
    ],
  },
};

function processFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const { from, to } of replacements) {
      if (content.match(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath, replacements) {
  let filesModified = 0;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursivo
      filesModified += processDirectory(fullPath, replacements);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      // Processar apenas arquivos TS/TSX
      if (processFile(fullPath, replacements)) {
        filesModified++;
      }
    }
  }
  
  return filesModified;
}

function removeUnnecessaryFiles(modulePath) {
  const filesToRemove = ['App.tsx', 'main.tsx', 'index.css'];
  let removed = 0;
  
  for (const file of filesToRemove) {
    const filePath = path.join(modulePath, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      removed++;
      console.log(`  Removido: ${file}`);
    }
  }
  
  return removed;
}

function main() {
  console.log('🔧 Ajustando imports dos módulos...\n');
  
  // Processar gestão-escolar
  console.log('📦 Gestão Escolar:');
  const gestaoConfig = APP_CONFIGS['gestao-escolar'];
  const modulosGestao = fs.readdirSync(gestaoConfig.modulesPath);
  
  for (const modulo of modulosGestao) {
    const moduloPath = path.join(gestaoConfig.modulesPath, modulo);
    if (!fs.statSync(moduloPath).isDirectory()) continue;
    
    console.log(`\n  Módulo: ${modulo}`);
    const modified = processDirectory(moduloPath, gestaoConfig.replacements);
    console.log(`  Arquivos modificados: ${modified}`);
    
    const removed = removeUnnecessaryFiles(moduloPath);
    console.log(`  Arquivos removidos: ${removed}`);
  }
  
  // Processar pei-collab
  console.log('\n\n📦 PEI Collab:');
  const peiConfig = APP_CONFIGS['pei-collab'];
  
  // Processar módulo plano-aee com replacements específicos
  const planoAeePath = path.join(peiConfig.modulesPath, 'plano-aee');
  if (fs.existsSync(planoAeePath)) {
    console.log(`\n  Módulo: plano-aee`);
    const specificReplacements = peiConfig.moduleSpecificReplacements?.['plano-aee'] || [];
    const allReplacements = [...peiConfig.replacements, ...specificReplacements];
    const modified = processDirectory(planoAeePath, allReplacements);
    console.log(`  Arquivos modificados: ${modified}`);
    
    const removed = removeUnnecessaryFiles(planoAeePath);
    console.log(`  Arquivos removidos: ${removed}`);
  }
  
  // Processar portal-responsavel com replacements específicos
  if (fs.existsSync(peiConfig.portalPath)) {
    console.log(`\n  Portal: portal-responsavel`);
    const portalReplacements = peiConfig.portalReplacements || peiConfig.replacements;
    const modified = processDirectory(peiConfig.portalPath, portalReplacements);
    console.log(`  Arquivos modificados: ${modified}`);
    
    const removed = removeUnnecessaryFiles(peiConfig.portalPath);
    console.log(`  Arquivos removidos: ${removed}`);
  }
  
  console.log('\n\n✅ Processamento concluído!');
}

main();


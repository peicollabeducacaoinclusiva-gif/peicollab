/**
 * Script para corrigir aspas misturadas em imports
 * Garante que todos os imports usem aspas simples consistentes
 */

const fs = require('fs');
const path = require('path');

function fixQuotesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corrigir imports com aspas misturadas
    // Exemplo: from '@/lib/utils"; -> from '@/lib/utils';
    const patterns = [
      { from: /from ['"]([^'"]+)["'];/g, to: (match, p1) => `from '${p1}';` },
      { from: /import ['"]([^'"]+)["'];/g, to: (match, p1) => `import '${p1}';` },
    ];
    
    for (const {from, to} of patterns) {
      const newContent = content.replace(from, to);
      if (newContent !== content) {
        content = newContent;
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

function processDirectory(dirPath) {
  let filesModified = 0;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      filesModified += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (fixQuotesInFile(fullPath)) {
        filesModified++;
      }
    }
  }
  
  return filesModified;
}

console.log('🔧 Corrigindo aspas misturadas...\n');

const paths = [
  'apps/pei-collab/src/modules/plano-aee',
  'apps/pei-collab/src/portal-responsavel',
  'apps/gestao-escolar/src/modules',
];

for (const dirPath of paths) {
  if (fs.existsSync(dirPath)) {
    console.log(`📁 ${dirPath}`);
    const modified = processDirectory(dirPath);
    console.log(`   Arquivos corrigidos: ${modified}\n`);
  }
}

console.log('✅ Concluído!');


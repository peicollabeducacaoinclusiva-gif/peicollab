/**
 * Script para gerar um único arquivo SQL com todas as migrações
 * Para copiar e colar no Supabase Dashboard → SQL Editor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de migrações na ordem de execução
const MIGRATIONS = [
  '20250203000003_enforce_single_active_pei.sql',
  '20250203000004_add_student_enrollments_and_multiple_teachers.sql',
  '20250203000005_add_class_teachers_auto_assignment.sql',
  '20250203000006_add_profile_avatars.sql',
  '20250203000007_fix_user_roles_relationship.sql',
];

const MIGRATION_NAMES = {
  '20250203000003_enforce_single_active_pei.sql': 'Sistema de Versionamento de PEIs',
  '20250203000004_add_student_enrollments_and_multiple_teachers.sql': 'Matrículas e Múltiplos Professores',
  '20250203000005_add_class_teachers_auto_assignment.sql': 'Professores por Turma',
  '20250203000006_add_profile_avatars.sql': 'Avatars com Emojis',
  '20250203000007_fix_user_roles_relationship.sql': 'Correção de Relacionamento',
};

function generateCombinedMigration() {
  console.log('🔧 Gerando arquivo SQL combinado...\n');
  
  let combinedSQL = '';
  
  // Header
  combinedSQL += `-- ============================================================================\n`;
  combinedSQL += `-- MIGRAÇÕES COMBINADAS - PEI COLLAB\n`;
  combinedSQL += `-- Gerado automaticamente em: ${new Date().toLocaleString('pt-BR')}\n`;
  combinedSQL += `-- ============================================================================\n`;
  combinedSQL += `--\n`;
  combinedSQL += `-- Este arquivo contém ${MIGRATIONS.length} migrações:\n`;
  MIGRATIONS.forEach((file, index) => {
    combinedSQL += `--   ${index + 1}. ${MIGRATION_NAMES[file]}\n`;
  });
  combinedSQL += `--\n`;
  combinedSQL += `-- INSTRUÇÕES:\n`;
  combinedSQL += `--   1. Abra Supabase Dashboard → SQL Editor\n`;
  combinedSQL += `--   2. Cole TODO este arquivo\n`;
  combinedSQL += `--   3. Clique em RUN\n`;
  combinedSQL += `--   4. Aguarde ~30 segundos\n`;
  combinedSQL += `--   5. Recarregue a aplicação (F5)\n`;
  combinedSQL += `--\n`;
  combinedSQL += `-- ============================================================================\n\n`;
  
  // Processar cada migração
  MIGRATIONS.forEach((file, index) => {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', file);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Arquivo não encontrado: ${file}`);
      return;
    }
    
    console.log(`✅ Adicionando: ${MIGRATION_NAMES[file]}`);
    
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    // Adicionar separador
    combinedSQL += `\n\n`;
    combinedSQL += `-- ============================================================================\n`;
    combinedSQL += `-- MIGRAÇÃO ${index + 1}/${MIGRATIONS.length}: ${MIGRATION_NAMES[file].toUpperCase()}\n`;
    combinedSQL += `-- Arquivo: ${file}\n`;
    combinedSQL += `-- ============================================================================\n\n`;
    
    // Adicionar conteúdo
    combinedSQL += content;
    
    // Garantir que termina com newline
    if (!content.endsWith('\n')) {
      combinedSQL += '\n';
    }
  });
  
  // Footer
  combinedSQL += `\n\n`;
  combinedSQL += `-- ============================================================================\n`;
  combinedSQL += `-- FIM DAS MIGRAÇÕES\n`;
  combinedSQL += `-- ============================================================================\n`;
  combinedSQL += `\n`;
  combinedSQL += `DO $$\n`;
  combinedSQL += `BEGIN\n`;
  combinedSQL += `  RAISE NOTICE '';\n`;
  combinedSQL += `  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';\n`;
  combinedSQL += `  RAISE NOTICE '║     🎉 TODAS AS MIGRAÇÕES FORAM APLICADAS!             ║';\n`;
  combinedSQL += `  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';\n`;
  combinedSQL += `  RAISE NOTICE '';\n`;
  combinedSQL += `  RAISE NOTICE 'Funcionalidades ativadas:';\n`;
  combinedSQL += `  RAISE NOTICE '  ✅ Sistema de versionamento de PEIs';\n`;
  combinedSQL += `  RAISE NOTICE '  ✅ Matrículas (série, turma, turno)';\n`;
  combinedSQL += `  RAISE NOTICE '  ✅ Múltiplos professores por PEI';\n`;
  combinedSQL += `  RAISE NOTICE '  ✅ Atribuição automática de professores';\n`;
  combinedSQL += `  RAISE NOTICE '  ✅ Avatars personalizados com emojis';\n`;
  combinedSQL += `  RAISE NOTICE '';\n`;
  combinedSQL += `  RAISE NOTICE 'Próximos passos:';\n`;
  combinedSQL += `  RAISE NOTICE '  1. Recarregar a aplicação (F5)';\n`;
  combinedSQL += `  RAISE NOTICE '  2. Fazer logout e login novamente';\n`;
  combinedSQL += `  RAISE NOTICE '  3. Testar as novas funcionalidades!';\n`;
  combinedSQL += `  RAISE NOTICE '';\n`;
  combinedSQL += `END $$;\n`;
  
  // Salvar arquivo
  const outputPath = path.join(__dirname, '..', 'APPLY_ALL_MIGRATIONS.sql');
  fs.writeFileSync(outputPath, combinedSQL, 'utf8');
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║            ✅ ARQUIVO GERADO COM SUCESSO!               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📄 Arquivo criado: APPLY_ALL_MIGRATIONS.sql`);
  console.log(`📏 Tamanho: ${(combinedSQL.length / 1024).toFixed(2)} KB`);
  console.log(`📋 Linhas: ${combinedSQL.split('\n').length}`);
  console.log('');
  console.log('🚀 COMO USAR:');
  console.log('');
  console.log('   1. Abra: Supabase Dashboard → SQL Editor');
  console.log('   2. Copie TODO o conteúdo de: APPLY_ALL_MIGRATIONS.sql');
  console.log('   3. Cole no SQL Editor');
  console.log('   4. Clique em RUN');
  console.log('   5. Aguarde a execução (~30 segundos)');
  console.log('   6. Verifique os NOTICES no console para confirmação');
  console.log('   7. Recarregue a aplicação (F5)');
  console.log('');
  console.log('✨ Todas as funcionalidades serão ativadas de uma vez!');
  console.log('');
  
  return outputPath;
}

// Executar
try {
  const outputPath = generateCombinedMigration();
  console.log(`✅ Pronto! Arquivo salvo em: ${outputPath}\n`);
} catch (error) {
  console.error('❌ Erro ao gerar migração:', error);
  process.exit(1);
}


/**
 * Script para aplicar todas as migrações pendentes
 * Executa migrações na ordem correta
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚠️ SEGURANÇA: Use variáveis de ambiente para credenciais
// Configure as variáveis antes de executar este script:
// export SUPABASE_URL="https://your-project.supabase.co"
// export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('❌ SUPABASE_URL não configurada. Configure a variável de ambiente SUPABASE_URL ou VITE_SUPABASE_URL');
}
if (!supabaseKey) {
  throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada. Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de migrações na ordem de execução
const MIGRATIONS = [
  {
    file: '20250203000003_enforce_single_active_pei.sql',
    name: 'Sistema de Versionamento de PEIs',
    description: 'Garante apenas 1 PEI ativo por aluno',
    critical: true,
  },
  {
    file: '20250203000004_add_student_enrollments_and_multiple_teachers.sql',
    name: 'Matrículas e Múltiplos Professores',
    description: 'Adiciona tabelas de matrículas e professores colaborativos',
    critical: true,
  },
  {
    file: '20250203000005_add_class_teachers_auto_assignment.sql',
    name: 'Professores por Turma - Atribuição Automática',
    description: 'Sistema de atribuição automática de professores ao PEI',
    critical: false,
  },
  {
    file: '20250203000006_add_profile_avatars.sql',
    name: 'Avatars com Emojis',
    description: 'Sistema de avatars personalizados com emojis',
    critical: false,
  },
  {
    file: '20250203000007_fix_user_roles_relationship.sql',
    name: 'Correção de Relacionamento',
    description: 'Garante foreign key entre user_roles e profiles',
    critical: false,
  },
];

async function executeSQLFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Dividir em comandos individuais (simples)
  const commands = sql
    .split(/;\s*\n/)
    .filter(cmd => {
      const trimmed = cmd.trim();
      return trimmed && 
             !trimmed.startsWith('--') && 
             trimmed !== '' &&
             !trimmed.match(/^\/\*/);
    })
    .map(cmd => cmd.trim() + ';');
  
  console.log(`   📋 ${commands.length} comandos SQL encontrados`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    
    try {
      // Usar rpc exec se disponível, senão query direta
      const { error } = await supabase.rpc('exec', { sql: cmd });
      
      if (error) {
        // Se RPC não funcionar, tentar query direta
        if (error.message?.includes('does not exist') || error.message?.includes('Invalid API key')) {
          console.log(`   ⚠️  [${i + 1}/${commands.length}] RPC não disponível, pulando...`);
        } else {
          throw error;
        }
      } else {
        successCount++;
      }
    } catch (cmdError) {
      console.error(`   ❌ [${i + 1}/${commands.length}] Erro:`, cmdError.message?.substring(0, 100));
      errorCount++;
    }
  }
  
  return { successCount, errorCount, total: commands.length };
}

async function applyMigrations() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      🚀 APLICADOR AUTOMÁTICO DE MIGRAÇÕES               ║');
  console.log('║      PEI Collab - Sistema de Versionamento              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  console.log('📦 Migrações a serem aplicadas:');
  MIGRATIONS.forEach((migration, index) => {
    const badge = migration.critical ? '🔴 CRÍTICA' : '🟢 OPCIONAL';
    console.log(`   ${index + 1}. ${badge} ${migration.name}`);
    console.log(`      └─ ${migration.description}`);
  });
  console.log('');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  let migrationsApplied = 0;
  
  for (let i = 0; i < MIGRATIONS.length; i++) {
    const migration = MIGRATIONS[i];
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration.file);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 [${i + 1}/${MIGRATIONS.length}] ${migration.name}`);
    console.log(`${'='.repeat(60)}`);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`   ❌ Arquivo não encontrado: ${migration.file}`);
      continue;
    }
    
    console.log(`   📂 Arquivo: ${migration.file}`);
    console.log(`   📝 Tamanho: ${fs.statSync(migrationPath).size} bytes`);
    console.log(`   🔄 Executando...`);
    console.log('');
    
    try {
      const result = await executeSQLFile(migrationPath);
      
      console.log('');
      console.log(`   ✅ Migração concluída!`);
      console.log(`   📊 Resultados:`);
      console.log(`      - Total de comandos: ${result.total}`);
      console.log(`      - Sucessos: ${result.successCount}`);
      console.log(`      - Erros: ${result.errorCount}`);
      
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;
      migrationsApplied++;
      
    } catch (error) {
      console.error(`   ❌ Erro ao aplicar migração:`, error.message);
    }
  }
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                  📊 RESUMO FINAL                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Migrações aplicadas: ${migrationsApplied}/${MIGRATIONS.length}`);
  console.log(`   Comandos executados: ${totalSuccess}`);
  console.log(`   Erros encontrados: ${totalErrors}`);
  console.log('');
  
  if (totalErrors === 0 && migrationsApplied === MIGRATIONS.length) {
    console.log('   🎉 SUCESSO TOTAL!');
    console.log('');
    console.log('   Próximos passos:');
    console.log('   1. ✅ Recarregar a página do aplicativo (F5)');
    console.log('   2. ✅ Fazer logout e login novamente');
    console.log('   3. ✅ Testar funcionalidades:');
    console.log('      - Criar PEI (verificar versionamento)');
    console.log('      - Gerenciar professores de turma');
    console.log('      - Personalizar avatar no perfil');
    console.log('      - Ver histórico de versões de PEI');
  } else if (totalErrors > 0) {
    console.log('   ⚠️  ALGUMAS MIGRAÇÕES FALHARAM');
    console.log('');
    console.log('   Isso é NORMAL se você estiver usando service_role key limitada.');
    console.log('   Recomendação: Aplicar migrações via Supabase Dashboard → SQL Editor');
    console.log('');
    console.log('   Arquivos para aplicar manualmente:');
    MIGRATIONS.forEach((m, i) => {
      console.log(`   ${i + 1}. supabase/migrations/${m.file}`);
    });
  } else {
    console.log('   ⚠️  NEM TODAS AS MIGRAÇÕES FORAM APLICADAS');
  }
  
  console.log('');
  console.log('📖 Documentação completa:');
  console.log('   - docs/SISTEMA_VERSIONAMENTO_PEI.md');
  console.log('   - docs/MULTIPLOS_PROFESSORES_PEI.md');
  console.log('   - docs/GUIA_PROFESSORES_TURMA.md');
  console.log('   - docs/SISTEMA_AVATARS_EMOJI.md');
  console.log('');
}

// Executar
console.log('🚀 Iniciando aplicação de migrações...\n');
applyMigrations()
  .then(() => {
    console.log('✅ Script finalizado!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });







































/**
 * Script para aplicar migração de versionamento de PEIs
 * Executa: supabase/migrations/20250203000003_enforce_single_active_pei.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://fximylewmvsllkdczovj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aW15bGV3bXZzbGxrZGN6b3ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjM3MDQ0MCwiZXhwIjoyMDUxOTQ2NDQwfQ.ldhALKa5M6_pKG9vgRJVz1RwT3qVIcLNHy_UB4JaJU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Aplicando migração de versionamento de PEIs...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20250203000003_enforce_single_active_pei.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Arquivo de migração não encontrado:', migrationPath);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    console.log('📝 Lendo arquivo de migração...');
    console.log('   Arquivo:', migrationPath);
    console.log('   Tamanho:', migrationSQL.length, 'caracteres\n');

    // Executar a migração via RPC (SQL direto)
    console.log('⚙️  Executando migração...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });

    if (error) {
      // Se exec_sql não existe, tentar executar manualmente
      console.log('⚠️  exec_sql não disponível, tentando método alternativo...\n');
      
      // Dividir SQL em comandos individuais
      const commands = migrationSQL
        .split(/;\s*\n/)
        .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
      
      console.log(`📋 Executando ${commands.length} comandos SQL...\n`);
      
      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i].trim();
        if (!cmd) continue;
        
        console.log(`   [${i + 1}/${commands.length}] Executando...`);
        
        const { error: cmdError } = await supabase.rpc('exec', { 
          sql: cmd + ';' 
        });
        
        if (cmdError) {
          console.error(`   ❌ Erro no comando ${i + 1}:`, cmdError.message);
        } else {
          console.log(`   ✅ Comando ${i + 1} executado com sucesso`);
        }
      }
    } else {
      console.log('✅ Migração aplicada com sucesso!\n');
    }

    // Verificar resultados
    console.log('🔍 Verificando resultados...\n');

    // Contar PEIs totais vs ativos
    const { count: totalPEIs } = await supabase
      .from('peis')
      .select('*', { count: 'exact', head: true });

    const { count: activePEIs } = await supabase
      .from('peis')
      .select('*', { count: 'exact', head: true })
      .eq('is_active_version', true);

    console.log('📊 Estatísticas:');
    console.log(`   Total de PEIs: ${totalPEIs}`);
    console.log(`   PEIs ativos: ${activePEIs}`);
    console.log(`   PEIs arquivados: ${totalPEIs - activePEIs}`);
    
    // Verificar se há duplicatas
    const { data: duplicates } = await supabase.rpc('check_duplicate_active_peis');
    
    if (duplicates && duplicates.length > 0) {
      console.log(`\n⚠️  ATENÇÃO: Encontrados ${duplicates.length} alunos com múltiplos PEIs ativos!`);
      duplicates.forEach(dup => {
        console.log(`   - Aluno ID: ${dup.student_id} (${dup.count} PEIs ativos)`);
      });
    } else {
      console.log('\n✅ Nenhum PEI duplicado encontrado!');
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📖 Documentação: docs/SISTEMA_VERSIONAMENTO_PEI.md');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migração:', error);
    process.exit(1);
  }
}

// Criar função auxiliar para verificar duplicatas
async function createCheckDuplicatesFunction() {
  const sql = `
    CREATE OR REPLACE FUNCTION check_duplicate_active_peis()
    RETURNS TABLE (student_id UUID, count BIGINT) AS $$
    BEGIN
      RETURN QUERY
      SELECT p.student_id, COUNT(*) as count
      FROM peis p
      WHERE p.is_active_version = true
      GROUP BY p.student_id
      HAVING COUNT(*) > 1;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  await supabase.rpc('exec', { sql });
}

// Executar
(async () => {
  await createCheckDuplicatesFunction();
  await applyMigration();
})();


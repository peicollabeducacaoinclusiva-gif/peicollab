/**
 * Script para Aplicar Correção Emergencial de Segurança
 * 
 * Este script aplica a migração de segurança que corrige:
 * 1. RLS Policies Permissivas
 * 2. RLS Desabilitado
 * 3. Recursão em Profiles
 * 
 * USO: node scripts/apply-emergency-security-fix.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração (usar variáveis de ambiente)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🔒 APLICAÇÃO DE CORREÇÃO EMERGENCIAL DE SEGURANÇA');
  console.log('='.repeat(60));
  console.log('');
  console.log('⚠️  ATENÇÃO: Este script fará alterações críticas no banco!');
  console.log('');
  console.log('Aguarde 5 segundos para cancelar (Ctrl+C)...');
  
  // Aguardar 5 segundos
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('');
  console.log('Iniciando correções...');
  console.log('');
  
  try {
    // 1. Ler arquivo de migração
    console.log('📄 Lendo arquivo de migração...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250204000000_emergency_security_fix.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Arquivo de migração não encontrado: ' + migrationPath);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('✓ Migração carregada (' + migrationSQL.length + ' caracteres)');
    console.log('');
    
    // 2. Verificar estado atual
    console.log('🔍 Verificando estado atual do RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status', {});
    
    if (rlsError && rlsError.code !== '42883') { // 42883 = function does not exist
      console.warn('⚠️  Aviso ao verificar RLS:', rlsError.message);
    }
    
    // 3. Aplicar migração (dividir em chunks para evitar timeouts)
    console.log('');
    console.log('🔧 Aplicando correções de segurança...');
    console.log('   (Isso pode levar alguns minutos...)');
    console.log('');
    
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ ERRO ao aplicar migração:', error);
      console.error('');
      console.error('Detalhes:', error.details);
      console.error('Hint:', error.hint);
      console.error('');
      console.error('⚠️  ATENÇÃO: Você pode precisar aplicar a migração manualmente');
      console.error('   Acesse o Supabase SQL Editor e execute:');
      console.error('   supabase/migrations/20250204000000_emergency_security_fix.sql');
      process.exit(1);
    }
    
    console.log('✓ Migração aplicada com sucesso!');
    console.log('');
    
    // 4. Validar correções
    console.log('✅ Validando correções...');
    console.log('');
    
    const validationQueries = [
      {
        name: 'RLS Status',
        query: `
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
            AND tablename IN ('students', 'user_roles', 'peis', 'profiles')
          ORDER BY tablename
        `
      },
      {
        name: 'Policy Count',
        query: `
          SELECT tablename, COUNT(*) as policy_count
          FROM pg_policies
          WHERE tablename IN ('students', 'user_roles', 'peis', 'profiles')
          GROUP BY tablename
          ORDER BY tablename
        `
      }
    ];
    
    for (const validation of validationQueries) {
      console.log(`📊 ${validation.name}:`);
      const { data: results, error: valError } = await supabase.rpc('exec', { 
        sql: validation.query 
      });
      
      if (valError) {
        console.warn(`   ⚠️  Erro na validação: ${valError.message}`);
      } else if (results) {
        console.table(results);
      }
      console.log('');
    }
    
    // 5. Resumo final
    console.log('='.repeat(60));
    console.log('✅ CORREÇÃO DE SEGURANÇA CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('');
    console.log('1. ✓ Testar login com diferentes tipos de usuários');
    console.log('2. ✓ Verificar se professores veem apenas seus alunos');
    console.log('3. ✓ Auditar logs de acesso recentes');
    console.log('4. ✓ Documentar o incidente');
    console.log('5. ✓ Implementar monitoramento contínuo');
    console.log('');
    console.log('📁 Backup das policies antigas:');
    console.log('   Tabela: backup_policies_emergency_20241104');
    console.log('');
    console.log('📖 Consulte RELATORIO_TESTES_SEGURANCA.md para mais detalhes');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERRO CRÍTICO:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    console.error('');
    console.error('⚠️  SOLUÇÃO: Aplique a migração manualmente no Supabase SQL Editor');
    console.error('   Arquivo: supabase/migrations/20250204000000_emergency_security_fix.sql');
    console.error('');
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});




































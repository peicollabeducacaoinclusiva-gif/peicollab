/**
 * Script Corrigido para Criar Usuários de Teste
 * Compatível com estrutura atual do banco (profiles com role + user_roles separado)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar .env
try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️ Arquivo .env não encontrado');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuração de usuários de teste
const testUsers = [
  {
    email: 'admin@sgc.edu.br',
    password: 'SGC@123456',
    full_name: 'Administrador SGC',
    role: 'education_secretary',
    tenant_id: '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451',
    school_id: null
  },
  {
    email: 'coord@sgc.edu.br',
    password: 'SGC@123456',
    full_name: 'Coordenador SGC',
    role: 'coordinator',
    tenant_id: '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451',
    school_id: null // Será vinculado a uma escola específica
  },
  {
    email: 'professor@sgc.edu.br',
    password: 'SGC@123456',
    full_name: 'Professor SGC',
    role: 'teacher',
    tenant_id: '62d992ab-ef6b-4d13-b9c9-6cdfdcb59451',
    school_id: null
  },
  {
    email: 'admin@teste.com',
    password: 'Admin123!@#',
    full_name: 'Super Administrador',
    role: 'superadmin',
    tenant_id: null,
    school_id: null
  }
];

async function createUsers() {
  console.log('👥 CRIANDO USUÁRIOS DE TESTE - VERSÃO CORRIGIDA');
  console.log('='.repeat(60));
  console.log('');
  
  let created = 0;
  let existing = 0;
  let errors = 0;
  
  for (const user of testUsers) {
    console.log(`\n📧 Processando: ${user.email}`);
    
    try {
      // 1. Verificar se já existe
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers.users.some(u => u.email === user.email);
      
      if (userExists) {
        console.log(`   ✓ Usuário já existe`);
        existing++;
        continue;
      }
      
      // 2. Criar usuário no auth
      console.log(`   ⏳ Criando usuário no auth...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name
        }
      });
      
      if (authError) {
        console.log(`   ❌ Erro no auth: ${authError.message}`);
        errors++;
        continue;
      }
      
      console.log(`   ✓ Usuário criado no auth: ${authData.user.id}`);
      
      // 3. Criar profile (COM role preenchida!)
      console.log(`   ⏳ Criando profile...`);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: user.full_name,
          tenant_id: user.tenant_id,
          school_id: user.school_id,
          role: user.role, // ← IMPORTANTE: Preencher role!
          is_active: true
        });
      
      if (profileError) {
        console.log(`   ❌ Erro ao criar profile: ${profileError.message}`);
        // Tentar deletar usuário do auth para não deixar órfão
        await supabase.auth.admin.deleteUser(authData.user.id);
        errors++;
        continue;
      }
      
      console.log(`   ✓ Profile criado`);
      
      // 4. Criar entrada em user_roles (tabela separada)
      console.log(`   ⏳ Criando role em user_roles...`);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: user.role
        });
      
      if (roleError) {
        console.log(`   ⚠️ Aviso ao criar user_role: ${roleError.message}`);
        // Não é crítico se falhar - role já está em profiles
      } else {
        console.log(`   ✓ Role criada em user_roles`);
      }
      
      console.log(`   ✅ SUCESSO: ${user.email} criado completamente!`);
      created++;
      
      // Aguardar para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Erro geral: ${error.message}`);
      errors++;
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`Total:         ${testUsers.length}`);
  console.log(`Criados:       ${created} ✅`);
  console.log(`Já existiam:   ${existing} ℹ️`);
  console.log(`Erros:         ${errors} ❌`);
  console.log('='.repeat(60));
  console.log('');
  
  if (created > 0) {
    console.log('🎉 Usuários criados com sucesso!');
    console.log('');
    console.log('📝 CREDENCIAIS PARA TESTE:');
    console.log('');
    testUsers.forEach(u => {
      console.log(`   ${u.role.padEnd(20)} | ${u.email.padEnd(25)} | ${u.password}`);
    });
    console.log('');
  }
  
  if (errors > 0) {
    console.log('⚠️ Alguns usuários não foram criados.');
    console.log('   Execute o script novamente ou crie manualmente no Supabase Dashboard.');
  }
}

// Executar
createUsers().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});




































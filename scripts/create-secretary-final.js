import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Carregar variáveis de ambiente do arquivo .env
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
  console.log('⚠️ Arquivo .env não encontrado, usando variáveis do sistema');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSecretaryFinal() {
  console.log('🏛️ Criando Secretário de Educação (método final)...\n');
  
  try {
    // 1. Verificar se o secretário já existe
    console.log('1. Verificando se o secretário já existe...');
    const { data: existingSecretary, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name, user_roles(role)')
      .eq('id', '137a0b95-fcb1-4433-8f84-94717ba752c3')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar secretário:', checkError);
      return;
    }
    
    if (existingSecretary) {
      console.log('✅ Secretário já existe:', existingSecretary);
      
      // Verificar se tem role
      if (existingSecretary.user_roles && existingSecretary.user_roles.length > 0) {
        console.log('✅ Secretário já tem role:', existingSecretary.user_roles[0].role);
        return;
      }
    }
    
    // 2. Criar o usuário se não existir
    if (!existingSecretary) {
      console.log('\n2. Criando usuário do secretário...');
      
      // Verificar tenant
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, network_name')
        .limit(1);
      
      if (tenantsError) {
        console.error('❌ Erro ao buscar tenants:', tenantsError);
        return;
      }
      
      const tenantId = tenants?.[0]?.id;
      if (!tenantId) {
        console.error('❌ Nenhum tenant encontrado');
        return;
      }
      
      // Criar profile
      const secretaryData = {
        id: '137a0b95-fcb1-4433-8f84-94717ba752c3',
        full_name: 'Dr. Roberto Secretário de Educação',
        tenant_id: tenantId,
        school_id: null,
        is_active: true
      };
      
      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(secretaryData)
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao criar profile:', profileError);
        return;
      }
      
      console.log('✅ Profile criado:', insertedProfile);
    }
    
    // 3. Criar role usando SQL direto
    console.log('\n3. Criando role usando SQL direto...');
    
    // Usar uma abordagem diferente - inserir via RPC se disponível
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: '137a0b95-fcb1-4433-8f84-94717ba752c3',
          role: 'education_secretary'
        })
        .select()
        .single();
      
      if (roleError) {
        console.log('⚠️ Erro ao criar role via Supabase:', roleError.message);
        console.log('💡 Execute o SQL manualmente no Supabase Studio:');
        console.log('   INSERT INTO user_roles (user_id, role) VALUES (\'137a0b95-fcb1-4433-8f84-94717ba752c3\', \'education_secretary\');');
      } else {
        console.log('✅ Role criado via Supabase:', roleData);
      }
    } catch (err) {
      console.log('⚠️ Erro ao criar role:', err.message);
      console.log('💡 Execute o SQL manualmente no Supabase Studio:');
      console.log('   INSERT INTO user_roles (user_id, role) VALUES (\'137a0b95-fcb1-4433-8f84-94717ba752c3\', \'education_secretary\');');
    }
    
    // 4. Verificar resultado final
    console.log('\n4. Verificando resultado final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        tenant_id,
        school_id,
        is_active,
        user_roles(role)
      `)
      .eq('id', '137a0b95-fcb1-4433-8f84-94717ba752c3')
      .single();
    
    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError);
      return;
    }
    
    console.log('✅ Resultado final:');
    console.log(`   Nome: ${finalCheck.full_name}`);
    console.log(`   ID: ${finalCheck.id}`);
    console.log(`   Tenant: ${finalCheck.tenant_id}`);
    console.log(`   School: ${finalCheck.school_id || 'N/A (Network Admin)'}`);
    console.log(`   Role: ${finalCheck.user_roles?.[0]?.role || 'N/A'}`);
    console.log(`   Ativo: ${finalCheck.is_active ? 'Sim' : 'Não'}`);
    
    if (finalCheck.user_roles && finalCheck.user_roles.length > 0) {
      console.log('\n🎉 Secretário de Educação criado com sucesso!');
      console.log('💡 Para testar:');
      console.log('   1. Acesse http://localhost:8081');
      console.log('   2. Faça login com: roberto.secretario@educacao.gov.br / 123456');
      console.log('   3. Verifique se o dashboard do secretário aparece');
    } else {
      console.log('\n⚠️ Secretário criado, mas sem role. Execute o SQL manualmente:');
      console.log('   INSERT INTO user_roles (user_id, role) VALUES (\'137a0b95-fcb1-4433-8f84-94717ba752c3\', \'education_secretary\');');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSecretaryFinal();



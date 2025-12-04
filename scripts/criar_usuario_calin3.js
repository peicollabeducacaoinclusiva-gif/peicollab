/**
 * Script: Criar usuário calin3.estrela@gmail.com
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const email = 'calin3.estrela@gmail.com'
const senha = 'PeiCollab@2025'

async function criarUsuario() {
  console.log('\n🔍 Verificando usuário:', email)
  
  // Verificar se já existe
  const { data: users } = await supabase.auth.admin.listUsers()
  const existing = users?.users?.find(u => u.email === email)
  
  if (existing) {
    console.log('✅ Usuário já existe em auth.users')
    console.log('   ID:', existing.id)
    console.log('   Email confirmado:', existing.email_confirmed_at ? 'Sim' : 'Não')
    
    // Verificar profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', existing.id)
      .single()
    
    if (profile) {
      console.log('✅ Profile existe')
      console.log('   Nome:', profile.full_name)
      console.log('   Ativo:', profile.is_active)
      console.log('   Role:', profile.role)
    } else {
      console.log('❌ Profile NÃO existe - criando...')
      
      // Buscar escola do coordenador pelos PEIs
      const { data: pei } = await supabase
        .from('peis')
        .select('school_id, tenant_id')
        .eq('created_by', existing.id)
        .limit(1)
        .single()
      
      if (!pei) {
        console.log('❌ Não encontrou PEIs deste coordenador')
        return
      }
      
      // Criar profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: existing.id,
          full_name: 'Caline Estrela',
          email: email,
          school_id: pei.school_id,
          tenant_id: pei.tenant_id,
          role: 'coordinator',
          is_active: true
        })
      
      if (error) {
        console.log('❌ Erro ao criar profile:', error)
      } else {
        console.log('✅ Profile criado!')
        
        // Criar user_role
        await supabase
          .from('user_roles')
          .insert({
            user_id: existing.id,
            role: 'coordinator'
          })
        console.log('✅ Role criada!')
      }
    }
    return
  }
  
  console.log('❌ Usuário NÃO existe - criando...')
  
  // Criar em auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      full_name: 'Caline Estrela'
    }
  })
  
  if (authError) {
    console.log('❌ Erro ao criar auth user:', authError.message)
    return
  }
  
  console.log('✅ Usuário criado em auth.users')
  console.log('   ID:', authUser.user.id)
  
  // Buscar escola pelos PEIs existentes deste email
  const { data: peis } = await supabase
    .from('peis')
    .select('school_id, tenant_id')
    .limit(1)
  
  const schoolId = peis?.[0]?.school_id
  const tenantId = peis?.[0]?.tenant_id
  
  // Criar profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      full_name: 'Caline Estrela',
      email: email,
      school_id: schoolId,
      tenant_id: tenantId,
      role: 'coordinator',
      is_active: true
    })
  
  if (profileError) {
    console.log('❌ Erro ao criar profile:', profileError)
  } else {
    console.log('✅ Profile criado!')
  }
  
  // Criar user_role
  await supabase
    .from('user_roles')
    .insert({
      user_id: authUser.user.id,
      role: 'coordinator'
    })
  
  console.log('✅ Role criada!')
  console.log('\n🎉 TUDO PRONTO!')
  console.log('\n📝 CREDENCIAIS:')
  console.log('   📧 Email:', email)
  console.log('   🔒 Senha:', senha)
  console.log('\n✅ Pode fazer login agora!\n')
}

criarUsuario()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Erro:', err)
    process.exit(1)
  })


/**
 * Script: Criar Usuários em auth.users para Coordenadores
 * 
 * Os coordenadores foram criados em profiles, mas não em auth.users.
 * Este script cria os usuários faltantes para que possam fazer login.
 * 
 * Uso:
 *   node scripts/criar_usuarios_auth_coordenadores.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Lista de coordenadores do CSV de São Gonçalo
const coordenadores = [
  { email: 'erotildesrosa33@gmail.com', nome: 'Erotildes Rosa' },
  { email: 'jaquelinnesouzasilva27@gmail.com', nome: 'Jaqueline Souza Silva' },
  { email: 'vi_garcia19@hotmail.com', nome: 'Vi Garcia' },
  { email: 'ecmnoidecerqueira@gmail.com', nome: 'ECM Nóide Cerqueira' },
  { email: 'calin3.estrela@gmail.com', nome: 'Caline Estrela' },
  { email: 'michellesilvagomes@gmail.com', nome: 'Michelle Silva Gomes' },
  { email: 'costalidiane65@gmail.com', nome: 'Lidiane Costa' },
  { email: 'rosileidesoaressantos@hotmail.commail.com', nome: 'Rosileide Soares Santos' },
  { email: 'rosileidesoaressantos82@gmail.com', nome: 'Rosileide Soares Santos' },
  { email: 'suzy-ecv@hotmail.com', nome: 'Suzy ECV' },
  { email: 'lucianasgc@gmail.com', nome: 'Luciana SGC' }
]

const senha = 'PeiCollab@2025'

async function criarUsuariosAuth() {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  👥 CRIAR USUÁRIOS AUTH PARA COORDENADORES              ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  
  let criados = 0
  let existentes = 0
  let erros = 0
  
  for (const coord of coordenadores) {
    process.stdout.write(`  📧 ${coord.email.padEnd(45)} ... `)
    
    try {
      // Verificar se profile existe
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', coord.email)
        .single()
      
      if (!profile) {
        console.log('⚠️  Profile não existe')
        continue
      }
      
      // Tentar criar usuário em auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: coord.email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          full_name: coord.nome
        }
      })
      
      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log('✅ Já existe')
          existentes++
        } else {
          console.log(`❌ Erro: ${authError.message}`)
          erros++
        }
      } else {
        console.log('✅ Criado')
        criados++
        
        // Atualizar profile com o ID correto do auth.users (se diferente)
        if (authUser.user.id !== profile.id) {
          // Copiar profile para novo ID
          await supabase
            .from('profiles')
            .insert({
              id: authUser.user.id,
              email: coord.email,
              full_name: coord.nome,
              school_id: profile.school_id,
              tenant_id: profile.tenant_id,
              role: 'coordinator',
              is_active: true
            })
          
          // Copiar user_roles
          await supabase
            .from('user_roles')
            .insert({
              user_id: authUser.user.id,
              role: 'coordinator'
            })
          
          // Deletar profile antigo (sem auth.users)
          await supabase
            .from('profiles')
            .delete()
            .eq('id', profile.id)
        }
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`)
      erros++
    }
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  📊 RESUMO                                              ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  console.log(`  ✅ Criados:     ${criados}`)
  console.log(`  ✓  Existentes:  ${existentes}`)
  console.log(`  ❌ Erros:       ${erros}`)
  console.log(`  📊 Total:       ${coordenadores.length}\n`)
  
  if (criados > 0 || existentes > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║  🔐 CREDENCIAIS PARA LOGIN                              ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')
    console.log('  📧 Email: Qualquer um da lista acima')
    console.log('  🔒 Senha: PeiCollab@2025\n')
    console.log('  ⚠️  Oriente a alterar a senha no primeiro acesso!\n')
  }
}

criarUsuariosAuth()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })



































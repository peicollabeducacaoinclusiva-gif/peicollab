/**
 * Script FINAL: Criar logins para coordenadores de São Gonçalo
 * 
 * Cria usuários em auth.users para que possam fazer login
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

// Coordenadores com emails e nomes corretos
const coordenadores = [
  { email: 'erotildesrosa33@gmail.com', nome: 'Erotildes Rosa', username: 'erotildesrosa33' },
  { email: 'jaquelinnesouzasilva27@gmail.com', nome: 'Jaqueline Souza Silva', username: 'jaquelinnesouzasilva27' },
  { email: 'vi_garcia19@hotmail.com', nome: 'Vi Garcia', username: 'vi_garcia19' },
  { email: 'ecmnoidecerqueira@gmail.com', nome: 'ECM Nóide Cerqueira', username: 'ecmnoidecerqueira' },
  { email: 'calin3.estrela@gmail.com', nome: 'Caline Estrela', username: 'calin3.estrela' },
  { email: 'michellesilvagomes@gmail.com', nome: 'Michelle Silva Gomes', username: 'michellesilvagomes' },
  { email: 'costalidiane65@gmail.com', nome: 'Lidiane Costa', username: 'costalidiane65' },
  { email: 'rosileidesoaressantos82@gmail.com', nome: 'Rosileide Soares Santos', username: 'rosileidesoaressantos82' },
  { email: 'suzy-ecv@hotmail.com', nome: 'Suzy ECV', username: 'suzy-ecv' },
  { email: 'lucianasgc@gmail.com', nome: 'Luciana SGC', username: 'lucianasgc' }
]

const senha = 'PeiCollab@2025'

async function criarLogins() {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  🔐 CRIAR LOGINS PARA COORDENADORES                     ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  
  const resultado = {
    criados: [],
    existentes: [],
    erros: []
  }
  
  for (const coord of coordenadores) {
    process.stdout.write(`  [${coordenadores.indexOf(coord) + 1}/${coordenadores.length}] ${coord.nome.padEnd(30)} ... `)
    
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: coord.email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          full_name: coord.nome,
          username: coord.username
        }
      })
      
      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log('✅ Já existe')
          resultado.existentes.push(coord)
        } else {
          console.log(`❌ Erro: ${authError.message}`)
          resultado.erros.push({ ...coord, erro: authError.message })
        }
      } else {
        console.log('✅ Criado')
        resultado.criados.push(coord)
        
        // Buscar escola do coordenador nos PEIs criados
        const { data: pei } = await supabase
          .from('peis')
          .select('school_id, tenant_id')
          .eq('created_by', authUser.user.id)
          .limit(1)
          .single()
        
        // Criar ou atualizar profile
        await supabase
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            email: coord.email,
            full_name: coord.nome,
            school_id: pei?.school_id,
            tenant_id: pei?.tenant_id,
            role: 'coordinator',
            is_active: true
          })
        
        // Criar user_role
        await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: 'coordinator'
          })
          .onConflict('user_id, role')
          .ignore()
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`)
      resultado.erros.push({ ...coord, erro: err.message })
    }
  }
  
  // Relatório final
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  📊 RESUMO FINAL                                        ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  console.log(`  ✅ Novos criados:  ${resultado.criados.length}`)
  console.log(`  ✓  Já existiam:    ${resultado.existentes.length}`)
  console.log(`  ❌ Erros:          ${resultado.erros.length}`)
  console.log(`  📊 Total:          ${coordenadores.length}\n`)
  
  if (resultado.criados.length > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║  🎉 USUÁRIOS CRIADOS                                    ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')
    
    resultado.criados.forEach((coord, i) => {
      console.log(`  ${i + 1}. 👤 ${coord.nome}`)
      console.log(`     📧 Email: ${coord.email}`)
      console.log(`     🔑 Username: ${coord.username}`)
      console.log(`     🔒 Senha: ${senha}`)
      console.log('')
    })
  }
  
  if (resultado.existentes.length > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║  ✅ USUÁRIOS QUE JÁ EXISTIAM                            ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')
    
    resultado.existentes.forEach((coord, i) => {
      console.log(`  ${i + 1}. ${coord.nome} (${coord.email})`)
    })
    console.log('')
  }
  
  console.log('✅ Processo concluído!')
  console.log('\n🔗 Acesse: https://peicollab.com.br')
  console.log('🔒 Senha padrão: PeiCollab@2025\n')
}

criarLogins()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })


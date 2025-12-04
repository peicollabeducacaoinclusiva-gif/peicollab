/**
 * Script de Importação CSV → PEIs
 * 
 * Importa arquivo CSV de São Gonçalo e cria PEIs automaticamente
 * com metas baseadas em BNCC e encaminhamentos inteligentes.
 * 
 * Uso:
 *   npx ts-node scripts/import_csv_pei.ts caminho/para/arquivo.csv
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as Papa from 'papaparse'

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('Configure: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================================================
// INTERFACES
// ============================================================================

interface CSVRow {
  'Carimbo de data/hora': string
  'Endereço de e-mail': string
  'ESCOLA REGULAR': string
  'Nome do Estudante': string
  'Série/Ano Escolar': string
  'Turno': string
  'Histórico resumido (Relato familiar, escolar e do próprio estudante. Inclua informações sobre convivência, saúde, frequência e rotina.)': string
  'Interesses / Hiperfoco (Exemplo: música, animais, desenhos, jogos, números, personagens, cores, temas específicos etc.)': string
  'Desinteresses / Aversão (Exemplo: barulho alto, determinadas atividades, contato físico, mudanças de rotina, alguns temas ou matérias etc.)': string
  'O que a criança já consegue fazer - habilidades (Exemplo: reconhece letras, escreve o nome, interage com colegas, segue instruções simples, identifica moedas etc.)': string
  'O que precisa de mais ajuda - necessidades (Exemplo: leitura de palavras, organização de materiais, manter a atenção, coordenação motora fina, compreensão oral etc.)': string
  'Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [🏗️ Arquitetônicas (mobiliário inadequado, banheiros não adaptados...)]': string
  'Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [💬 Comunicacionais (ausência de Libras, braile, CAA...)]': string
  'Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [🤝 Atitudinais (falta de acolhimento, capacitismo, bullying...)]': string
  'Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [💻 Tecnológicas (falta de computadores, tablets, softwares acessíveis...)]': string
  'Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [📚 Pedagógicas (atividades sem adaptação, provas inflexíveis, metodologias únicas...)]': string
  'Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [⚙️ Outras (ex: emocionais, familiares, sensoriais...)]': string
  'Comentários ou observações sobre barreiras  (Descreva situações ou exemplos práticos dessas barreiras no ambiente escolar. ex: falta de sinalização tátil, ausência de intérprete, ruídos, resistência docente etc.) ': string
}

interface ImportResult {
  success: boolean
  pei_id?: string
  student_id?: string
  student_name?: string
  goals_generated?: number
  referrals_generated?: number
  coordinator_created?: boolean
  coordinator_name?: string
  error?: string
}

interface ImportStats {
  total: number
  success: number
  errors: number
  warnings: number
  results: ImportResult[]
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function getOrCreateCoordinator(
  email: string,
  schoolId: string
): Promise<{ id: string; name: string; isNew: boolean }> {
  // 1. Buscar coordenador existente
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email)
    .single()
  
  if (existing) {
    return { 
      id: existing.id, 
      name: existing.full_name, 
      isNew: false 
    }
  }
  
  // 2. Extrair username e nome do email
  const username = email.split('@')[0]
  const fullName = username
    .replace(/[._]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  const defaultPassword = 'PeiCollab@2025'
  
  // 3. Criar usuário em auth.users via Admin API
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'coordinator'
    }
  })
  
  if (authError || !authUser.user) {
    throw new Error(`Erro ao criar auth user: ${authError?.message}`)
  }
  
  // 4. Obter tenant_id da escola
  const { data: school } = await supabase
    .from('schools')
    .select('tenant_id')
    .eq('id', schoolId)
    .single()
  
  if (!school) {
    throw new Error('Escola não encontrada ao criar coordenador')
  }
  
  // 5. Criar profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      email,
      full_name: fullName,
      school_id: schoolId,
      tenant_id: school.tenant_id,
      role: 'coordinator',
      is_active: true
    })
  
  if (profileError) {
    console.error('Erro ao criar profile:', profileError)
    throw new Error(`Erro ao criar profile: ${profileError.message}`)
  }
  
  // 6. Adicionar role
  await supabase
    .from('user_roles')
    .insert({
      user_id: authUser.user.id,
      role: 'coordinator'
    })
  
  console.log(`  ✅ Novo coordenador criado: ${fullName} (${email})`)
  console.log(`     Username: ${username} | Senha: ${defaultPassword}`)
  
  return {
    id: authUser.user.id,
    name: fullName,
    isNew: true
  }
}

function normalizeFieldName(name: string): string {
  // Remove emojis e caracteres especiais, mantém apenas texto essencial
  const cleanName = name.replace(/[🏗️💬🤝💻📚⚙️]/g, '').trim()
  
  if (cleanName.includes('Arquitetônicas')) return 'barrier_arquitetonicas'
  if (cleanName.includes('Comunicacionais')) return 'barrier_comunicacionais'
  if (cleanName.includes('Atitudinais')) return 'barrier_atitudinais'
  if (cleanName.includes('Tecnológicas')) return 'barrier_tecnologicas'
  if (cleanName.includes('Pedagógicas')) return 'barrier_pedagogicas'
  if (cleanName.includes('Outras')) return 'barrier_outras'
  
  return cleanName
}

async function createImportBatch(fileName: string, totalRows: number): Promise<string> {
  const { data, error } = await supabase
    .from('pei_import_batches')
    .insert({
      file_name: fileName,
      total_rows: totalRows,
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (error) throw new Error(`Erro ao criar batch: ${error.message}`)
  
  return data.id
}

async function updateBatchStatus(
  batchId: string, 
  status: string, 
  stats: ImportStats
): Promise<void> {
  await supabase
    .from('pei_import_batches')
    .update({
      status,
      completed_at: new Date().toISOString(),
      success_count: stats.success,
      error_count: stats.errors,
      warning_count: stats.warnings,
      report_data: {
        results: stats.results,
        summary: {
          total: stats.total,
          success: stats.success,
          errors: stats.errors,
          warnings: stats.warnings
        }
      }
    })
    .eq('id', batchId)
}

async function importRow(
  row: CSVRow, 
  batchId: string,
  schoolsCache: Map<string, string>
): Promise<ImportResult> {
  try {
    // 1. Buscar escola no cache ou no banco
    let schoolId = schoolsCache.get(row['ESCOLA REGULAR'])
    
    if (!schoolId) {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .ilike('school_name', `%${row['ESCOLA REGULAR'].trim()}%`)
        .eq('is_active', true)
        .limit(1)
        .single()
      
      if (!school) {
        throw new Error(`Escola não encontrada: ${row['ESCOLA REGULAR']}`)
      }
      
      schoolId = school.id
      schoolsCache.set(row['ESCOLA REGULAR'], schoolId)
    }
    
    // 2. Buscar ou criar coordenador
    const coordinator = await getOrCreateCoordinator(
      row['Endereço de e-mail'],
      schoolId
    )
    
    // 3. Chamar função SQL de importação
    const { data, error } = await supabase.rpc('import_pei_from_csv_row', {
      p_coordinator_email: row['Endereço de e-mail'],
      p_school_name: row['ESCOLA REGULAR'],
      p_student_name: row['Nome do Estudante'],
      p_grade: row['Série/Ano Escolar'],
      p_shift: row['Turno'],
      p_history: row['Histórico resumido (Relato familiar, escolar e do próprio estudante. Inclua informações sobre convivência, saúde, frequência e rotina.)'],
      p_interests: row['Interesses / Hiperfoco (Exemplo: música, animais, desenhos, jogos, números, personagens, cores, temas específicos etc.)'],
      p_aversions: row['Desinteresses / Aversão (Exemplo: barulho alto, determinadas atividades, contato físico, mudanças de rotina, alguns temas ou matérias etc.)'],
      p_abilities: row['O que a criança já consegue fazer - habilidades (Exemplo: reconhece letras, escreve o nome, interage com colegas, segue instruções simples, identifica moedas etc.)'],
      p_special_needs: row['O que precisa de mais ajuda - necessidades (Exemplo: leitura de palavras, organização de materiais, manter a atenção, coordenação motora fina, compreensão oral etc.)'],
      p_barrier_arquitetonicas: row['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [🏗️ Arquitetônicas (mobiliário inadequado, banheiros não adaptados...)]'] || 'Nenhum',
      p_barrier_comunicacionais: row['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [💬 Comunicacionais (ausência de Libras, braile, CAA...)]'] || 'Nenhum',
      p_barrier_atitudinais: row['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [🤝 Atitudinais (falta de acolhimento, capacitismo, bullying...)]'] || 'Nenhum',
      p_barrier_tecnologicas: row['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [💻 Tecnológicas (falta de computadores, tablets, softwares acessíveis...)]'] || 'Nenhum',
      p_barrier_pedagogicas: row['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [📚 Pedagógicas (atividades sem adaptação, provas inflexíveis, metodologias únicas...)]'] || 'Nenhum',
      p_barrier_outras: row['Barreiras para Aprendizagem e Participação na Escola . Marque o nível de impacto conforme o contexto do aluno. [⚙️ Outras (ex: emocionais, familiares, sensoriais...)]'] || 'Nenhum',
      p_barriers_comments: row['Comentários ou observações sobre barreiras  (Descreva situações ou exemplos práticos dessas barreiras no ambiente escolar. ex: falta de sinalização tátil, ausência de intérprete, ruídos, resistência docente etc.) '] || '',
      p_batch_id: batchId,
      p_auto_create_coordinator: false  // Já criado no TypeScript
    })
    
    if (error) {
      console.error('Erro ao importar:', error)
      return {
        success: false,
        student_name: row['Nome do Estudante'],
        error: error.message
      }
    }
    
    const result = data as ImportResult
    
    // Adicionar info do coordenador
    if (coordinator.isNew) {
      result.coordinator_created = true
      result.coordinator_name = coordinator.name
    }
    
    return result
  } catch (err: any) {
    return {
      success: false,
      student_name: row['Nome do Estudante'],
      error: err.message
    }
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function importCSV(filePath: string): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  📥 IMPORTAÇÃO CSV → PEIs                               ║')
  console.log('║  São Gonçalo do Amarante - CE                           ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  
  // Verificar se arquivo existe
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`)
    process.exit(1)
  }
  
  const fileName = filePath.split('/').pop() || filePath
  console.log(`📂 Arquivo: ${fileName}`)
  
  // Ler CSV
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const parseResult = Papa.parse<CSVRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  })
  
  const rows = parseResult.data
  console.log(`📊 Total de linhas: ${rows.length}\n`)
  
  // Criar batch
  const batchId = await createImportBatch(fileName, rows.length)
  console.log(`✅ Batch criado: ${batchId}\n`)
  
  // Cache de escolas e coordenadores criados
  const schoolsCache = new Map<string, string>()
  const coordinatorsCreated = new Set<string>()
  
  // Importar linha por linha
  const stats: ImportStats = {
    total: rows.length,
    success: 0,
    errors: 0,
    warnings: 0,
    results: []
  }
  
  console.log('🔄 Processando...\n')
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const studentName = row['Nome do Estudante']
    
    process.stdout.write(`  [${i + 1}/${rows.length}] ${studentName.padEnd(40)} ... `)
    
    const result = await importRow(row, batchId, schoolsCache)
    stats.results.push(result)
    
    if (result.success) {
      stats.success++
      
      // Rastrear coordenadores criados
      if (result.coordinator_created) {
        coordinatorsCreated.add(row['Endereço de e-mail'])
      }
      
      console.log(`✅ OK (${result.goals_generated} metas geradas)`)
    } else {
      stats.errors++
      console.log(`❌ ERRO: ${result.error}`)
    }
  }
  
  // Atualizar batch
  await updateBatchStatus(batchId, 'completed', stats)
  
  // Exibir relatório final
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  📊 RELATÓRIO FINAL                                     ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  console.log(`  Total processados: ${stats.total}`)
  console.log(`  ✅ Sucesso:        ${stats.success}`)
  console.log(`  ❌ Erros:          ${stats.errors}`)
  console.log(`  ⚠️  Avisos:         ${stats.warnings}\n`)
  
  // Estatísticas de metas
  const totalGoals = stats.results
    .filter(r => r.success)
    .reduce((sum, r) => sum + (r.goals_generated || 0), 0)
  
  const avgGoals = stats.success > 0 ? (totalGoals / stats.success).toFixed(1) : 0
  
  console.log(`  🎯 Metas geradas:  ${totalGoals}`)
  console.log(`  📈 Média por PEI:  ${avgGoals}\n`)
  
  // Listar coordenadores criados
  if (coordinatorsCreated.size > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║  👥 COORDENADORES CRIADOS                               ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')
    console.log(`  Total de coordenadores novos: ${coordinatorsCreated.size}\n`)
    console.log('  ⚙️  CREDENCIAIS DE ACESSO:\n')
    
    const createdCoords = stats.results
      .filter(r => r.success && r.coordinator_created)
      .reduce((acc, r) => {
        const email = rows.find(row => row['Nome do Estudante'] === r.student_name)?.['Endereço de e-mail']
        if (email && !acc.has(email)) {
          acc.set(email, r.coordinator_name || '')
        }
        return acc
      }, new Map<string, string>())
    
    let i = 1
    for (const [email, name] of createdCoords) {
      const username = email.split('@')[0]
      console.log(`  ${i}. 👤 ${name}`)
      console.log(`     📧 Email: ${email}`)
      console.log(`     🔑 Username: ${username}`)
      console.log(`     🔒 Senha padrão: PeiCollab@2025`)
      console.log('')
      i++
    }
    
    console.log('  ⚠️  IMPORTANTE: Oriente os coordenadores a alterarem a senha no primeiro acesso!\n')
  }
  
  // Listar erros
  if (stats.errors > 0) {
    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║  ❌ ERROS ENCONTRADOS                                   ║')
    console.log('╚══════════════════════════════════════════════════════════╝\n')
    
    stats.results
      .filter(r => !r.success)
      .forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.student_name}`)
        console.log(`     Erro: ${r.error}\n`)
      })
  }
  
  console.log('✅ Importação concluída!\n')
  console.log(`📝 Batch ID: ${batchId}`)
  console.log(`   Use este ID para consultar detalhes no sistema.\n`)
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

const filePath = process.argv[2]

if (!filePath) {
  console.error('\n❌ Uso: npx ts-node scripts/import_csv_pei.ts <caminho-do-csv>\n')
  console.error('Exemplo:')
  console.error('  npx ts-node scripts/import_csv_pei.ts PEIColaborativo-SGC.csv\n')
  process.exit(1)
}

importCSV(filePath)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })


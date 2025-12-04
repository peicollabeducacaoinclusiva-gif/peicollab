/**
 * Script para importar PEIs em lote a partir do CSV do formulário
 * Município de São Gonçalo - 32 alunos
 */

import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import fs from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Precisa de service role

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mapeamento de níveis de barreira
const SEVERITY_MAP = {
  'Nenhum': null,
  'Pouco': 'leve',
  'Moderado': 'moderada',
  'Alto': 'severa'
}

// Mapeamento de escolas (nome no CSV → ID no banco)
const SCHOOL_MAPPING = {
  'ESCOLA MUNICIPAL EMIGDIA PEDREIRA DE SOUZA': 'school-id-001',
  'ESCOLA MUNICIPAL MANOEL FRANCISCO DE OLIVEIRA': 'school-id-002',
  'ESCOLA MUNICIPAL DEPUTADO NÓIDE CERQUEIRA': 'school-id-003',
  'ESCOLA MUNICIPAL FRANCISCO JOSÉ DA SILVA': 'school-id-004',
  'ESCOLA MUN PEDRO MOURA': 'school-id-005',
  'CRECHE ESCOLA TIA MARIA ANTÔNIA FALCÃO': 'school-id-006',
  'ESCOLA MUNICIPAL PROFESSORA FELICÍSSIMA GUIMARÃES PINTO': 'school-id-007'
}

// Mapeamento de coordenadores (email → ID no banco)
const COORDINATOR_MAPPING = {
  'erotildesrosa33@gmail.com': 'coordinator-id-001',
  'jaquelinnesouzasilva27@gmail.com': 'coordinator-id-002',
  'vi_garcia19@hotmail.com': 'coordinator-id-003',
  'ecmnoidecerqueira@gmail.com': 'coordinator-id-004',
  'calin3.estrela@gmail.com': 'coordinator-id-005',
  'rosileidesoaressantos@hotmail.commail.com': 'coordinator-id-006',
  'rosileidesoaressantos82@gmail.com': 'coordinator-id-007',
  'michellesilvagomes@gmail.com': 'coordinator-id-008',
  'costalidiane65@gmail.com': 'coordinator-id-009',
  'suzy-ecv@hotmail.com': 'coordinator-id-010',
  'lucianasgc@gmail.com': 'coordinator-id-011'
}

/**
 * Gera metas automaticamente baseado nas necessidades
 */
function generateGoalsFromNeeds(needsText, interestsText) {
  const goals = []
  const needsLower = needsText?.toLowerCase() || ''
  const interests = interestsText?.toLowerCase() || ''
  
  // Detectar necessidades e criar metas
  if (needsLower.includes('leitura')) {
    goals.push({
      description: "Desenvolver habilidades de leitura e decodificação de palavras",
      category: 'academic',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 meses
      strategies: [
        "Leitura compartilhada com mediação",
        "Uso de textos adaptados ao nível do aluno",
        "Jogos de formação de palavras",
        interests.includes('jogo') ? "Uso de jogos educativos" : "Atividades lúdicas"
      ].filter(Boolean),
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  if (needsLower.includes('escrita')) {
    goals.push({
      description: "Aprimorar habilidades de escrita",
      category: 'academic',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      strategies: [
        "Tracejados e atividades preparatórias",
        "Escrita guiada com apoio",
        "Uso de pautas diferenciadas",
        interests.includes('desenho') ? "Desenho e registro visual" : "Registro escrito"
      ].filter(Boolean),
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  if (needsLower.includes('atenção') || needsLower.includes('concentração')) {
    goals.push({
      description: "Melhorar capacidade de atenção e concentração",
      category: 'functional',
      target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 meses
      strategies: [
        "Atividades curtas e variadas",
        "Pausas programadas",
        "Ambiente com menos estímulos visuais e sonoros",
        interests ? `Uso de ${interests.split(',')[0]} para engajamento` : "Uso de interesses do aluno"
      ].filter(Boolean),
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  if (needsLower.includes('coordenação motora')) {
    goals.push({
      description: "Desenvolver coordenação motora fina",
      category: 'functional',
      target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      strategies: [
        "Atividades com massinha e argila",
        "Recorte e colagem",
        "Tracejados e pontilhados",
        "Jogos de encaixe e montagem"
      ],
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  if (needsLower.includes('autonomia')) {
    goals.push({
      description: "Ampliar autonomia nas atividades cotidianas",
      category: 'functional',
      target_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      strategies: [
        "Rotina visual estruturada",
        "Checklist de tarefas diárias",
        "Reforço positivo",
        "Prática com supervisão gradualmente reduzida"
      ],
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  if (needsLower.includes('socialização') || needsLower.includes('interação') || needsLower.includes('interagir')) {
    goals.push({
      description: "Ampliar habilidades de interação social",
      category: 'functional',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      strategies: [
        "Atividades em duplas e grupos pequenos",
        "Jogos cooperativos",
        "Mediação de interações sociais",
        "Reforço de comportamentos sociais positivos"
      ],
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  if (needsLower.includes('matemática') || needsLower.includes('cálculo') || needsLower.includes('número')) {
    goals.push({
      description: "Desenvolver raciocínio lógico-matemático",
      category: 'academic',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      strategies: [
        "Uso de material concreto (blocos, ábacos)",
        "Jogos matemáticos",
        "Situações-problema do cotidiano",
        "Atividades lúdicas com números"
      ],
      notes: "Meta gerada automaticamente a partir do formulário"
    })
  }
  
  // Se não gerou nenhuma meta, criar uma genérica
  if (goals.length === 0) {
    goals.push({
      description: "Acompanhar e apoiar o desenvolvimento global do aluno",
      category: 'functional',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      strategies: [
        "Observação sistemática",
        "Atividades adaptadas",
        "Apoio individualizado",
        "Parceria com a família"
      ],
      notes: "Meta genérica - ajustar conforme necessidades específicas"
    })
  }
  
  return goals
}

/**
 * Parseia barreiras do CSV
 */
function parseBarriers(row) {
  const barriers = []
  
  const barrierColumns = [
    { key: 12, type: 'architectural', name: 'Arquitetônicas' },
    { key: 13, type: 'communicational', name: 'Comunicacionais' },
    { key: 14, type: 'attitudinal', name: 'Atitudinais' },
    { key: 15, type: 'technological', name: 'Tecnológicas' },
    { key: 16, type: 'pedagogical', name: 'Pedagógicas' },
    { key: 17, type: 'other', name: 'Outras' }
  ]
  
  barrierColumns.forEach(({ key, type, name }) => {
    const value = Object.values(row)[key]
    const severity = SEVERITY_MAP[value?.trim()]
    
    if (severity) {
      barriers.push({
        barrier_type: type,
        description: `Barreiras ${name.toLowerCase()} identificadas`,
        severity: severity
      })
    }
  })
  
  return barriers
}

/**
 * Mapeia linha do CSV para objeto PEI
 */
function mapRowToPEI(row, rowIndex) {
  const values = Object.values(row)
  
  const studentName = values[3]?.trim()
  const schoolName = values[2]?.trim()
  const coordinatorEmail = values[1]?.trim()
  
  // Validar campos obrigatórios
  if (!studentName) {
    throw new Error(`Linha ${rowIndex + 2}: Nome do estudante não informado`)
  }
  
  if (!schoolName) {
    throw new Error(`Linha ${rowIndex + 2}: Escola não informada`)
  }
  
  // Buscar IDs
  const schoolId = SCHOOL_MAPPING[schoolName]
  const coordinatorId = COORDINATOR_MAPPING[coordinatorEmail]
  
  if (!schoolId) {
    console.warn(`⚠️ Escola não mapeada: ${schoolName}`)
  }
  
  if (!coordinatorId && coordinatorEmail) {
    console.warn(`⚠️ Coordenador não mapeado: ${coordinatorEmail}`)
  }
  
  // Montar diagnosis_data
  const diagnosis_data = {
    history: values[6] || '',
    interests: values[7] || '',
    aversions: values[8] || '',
    abilities: values[9] || '',
    specialNeeds: values[10] || '',
    barriers: parseBarriers(row),
    barriersComments: values[18] || ''
  }
  
  // Gerar metas automaticamente
  const planning_data = {
    goals: generateGoalsFromNeeds(values[10], values[7]),
    accessibilityResources: []
  }
  
  return {
    student: {
      name: studentName,
      grade: values[4]?.trim(),
      shift: values[5]?.trim()
    },
    school_name: schoolName,
    school_id: schoolId,
    coordinator_email: coordinatorEmail,
    coordinator_id: coordinatorId,
    diagnosis_data,
    planning_data
  }
}

/**
 * Processa arquivo CSV
 */
async function processCSV(filePath) {
  console.log('📂 Lendo arquivo CSV...')
  
  const csvContent = fs.readFileSync(filePath, 'utf-8')
  
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8'
  })
  
  console.log(`✅ ${parsed.data.length} linhas encontradas`)
  
  const results = {
    success: [],
    errors: [],
    warnings: []
  }
  
  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i]
    
    try {
      const peiData = mapRowToPEI(row, i)
      
      console.log(`\n📋 Processando: ${peiData.student.name}`)
      
      // 1. Buscar ou criar aluno
      let student = await findOrCreateStudent(peiData)
      
      // 2. Verificar se já tem PEI
      const { data: existingPEI } = await supabase
        .from('peis')
        .select('id')
        .eq('student_id', student.id)
        .eq('is_active_version', true)
        .maybeSingle()
      
      if (existingPEI) {
        results.warnings.push({
          student: peiData.student.name,
          message: 'Aluno já possui PEI ativo - pulado'
        })
        console.log(`⚠️ Aluno já tem PEI ativo`)
        continue
      }
      
      // 3. Criar PEI
      const { data: newPEI, error: peiError } = await supabase
        .from('peis')
        .insert({
          student_id: student.id,
          school_id: peiData.school_id,
          tenant_id: student.tenant_id,
          created_by: peiData.coordinator_id,
          assigned_teacher_id: null, // Atribuir depois
          status: 'draft',
          version_number: 1,
          is_active_version: true,
          diagnosis_data: peiData.diagnosis_data,
          planning_data: peiData.planning_data,
          evaluation_data: { referrals: [], observations: '' }
        })
        .select()
        .single()
      
      if (peiError) throw peiError
      
      results.success.push({
        student: peiData.student.name,
        pei_id: newPEI.id,
        goals_generated: peiData.planning_data.goals.length
      })
      
      console.log(`✅ PEI criado com ${peiData.planning_data.goals.length} metas`)
      
    } catch (error) {
      results.errors.push({
        row: i + 2,
        student: Object.values(row)[3] || 'Nome não identificado',
        error: error.message
      })
      console.error(`❌ Erro na linha ${i + 2}:`, error.message)
    }
  }
  
  return results
}

/**
 * Busca ou cria aluno
 */
async function findOrCreateStudent(peiData) {
  // Tentar encontrar aluno por nome e escola
  const { data: existingStudent } = await supabase
    .from('students')
    .select('*')
    .eq('name', peiData.student.name)
    .eq('school_id', peiData.school_id)
    .maybeSingle()
  
  if (existingStudent) {
    console.log(`👤 Aluno já cadastrado`)
    return existingStudent
  }
  
  // Criar novo aluno
  const { data: school } = await supabase
    .from('schools')
    .select('tenant_id')
    .eq('id', peiData.school_id)
    .single()
  
  const { data: newStudent, error } = await supabase
    .from('students')
    .insert({
      name: peiData.student.name,
      school_id: peiData.school_id,
      tenant_id: school.tenant_id,
      grade: peiData.student.grade,
      shift: peiData.student.shift,
      class_name: extractClassName(peiData.student.grade),
      is_active: true
    })
    .select()
    .single()
  
  if (error) throw error
  
  console.log(`👤 Aluno criado`)
  return newStudent
}

/**
 * Extrai nome da turma da série
 */
function extractClassName(grade) {
  // "3° ano" → "A" (padrão)
  // "4 ano" → "A"
  return 'A' // Pode ser ajustado depois
}

/**
 * Gera relatório
 */
function generateReport(results) {
  console.log('\n\n')
  console.log('═'.repeat(60))
  console.log('📊 RELATÓRIO DE IMPORTAÇÃO')
  console.log('═'.repeat(60))
  console.log('')
  
  console.log(`✅ PEIs criados com sucesso: ${results.success.length}`)
  results.success.forEach(s => {
    console.log(`   • ${s.student} (${s.goals_generated} metas geradas)`)
  })
  
  console.log('')
  console.log(`⚠️ Avisos: ${results.warnings.length}`)
  results.warnings.forEach(w => {
    console.log(`   • ${w.student}: ${w.message}`)
  })
  
  console.log('')
  console.log(`❌ Erros: ${results.errors.length}`)
  results.errors.forEach(e => {
    console.log(`   • Linha ${e.row} (${e.student}): ${e.error}`)
  })
  
  console.log('')
  console.log('═'.repeat(60))
  
  const totalMetas = results.success.reduce((sum, s) => sum + s.goals_generated, 0)
  console.log(`\n📈 Estatísticas:`)
  console.log(`   Total de alunos processados: ${results.success.length + results.errors.length + results.warnings.length}`)
  console.log(`   PEIs criados: ${results.success.length}`)
  console.log(`   Metas geradas: ${totalMetas}`)
  console.log(`   Média de metas por PEI: ${(totalMetas / results.success.length).toFixed(1)}`)
  console.log('')
}

/**
 * Main
 */
async function main() {
  const csvPath = process.argv[2] || './PEIColaborativo-SGC-Respostasaoformulário1.csv'
  
  console.log('🚀 Iniciando importação em lote de PEIs')
  console.log(`📂 Arquivo: ${csvPath}`)
  console.log('')
  
  const results = await processCSV(csvPath)
  
  generateReport(results)
  
  // Salvar relatório em arquivo
  fs.writeFileSync(
    `importacao_report_${Date.now()}.json`,
    JSON.stringify(results, null, 2)
  )
  
  console.log('💾 Relatório salvo em importacao_report_*.json')
}

// Executar
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}


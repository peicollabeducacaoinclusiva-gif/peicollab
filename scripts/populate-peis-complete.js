import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SCHOOL_ID = '00000000-0000-0000-0000-000000000002';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Barreiras comuns
const barrierTemplates = [
  { type: 'Barreira Atitudinal', description: 'Preconceito e estereótipos sobre alunos com deficiência', severity: 'alta' },
  { type: 'Barreira Pedagógica', description: 'Falta de adaptação curricular e metodologias inclusivas', severity: 'alta' },
  { type: 'Barreira Arquitetônica', description: 'Acesso físico inadequado às dependências da escola', severity: 'média' },
  { type: 'Barreira Tecnológica', description: 'Ausência de tecnologias assistivas necessárias', severity: 'alta' },
  { type: 'Barreira Comunicacional', description: 'Dificuldade na comunicação entre aluno, família e escola', severity: 'média' },
  { type: 'Barreira Familiar', description: 'Falta de participação efetiva da família no processo escolar', severity: 'média' },
  { type: 'Barreira Social', description: 'Dificuldade de interação com os colegas de turma', severity: 'baixa' },
];

// Recursos de acessibilidade
const accessibilityResources = [
  { type: 'Tecnologias Assistivas', description: 'Tablet com apps educacionais adaptados', frequency: 'diária' },
  { type: 'Adaptações Físicas', description: 'Mesa regulável e cadeira ergonômica', frequency: 'diária' },
  { type: 'Material Didático Adaptado', description: 'Livros e apostilas em fonte ampliada', frequency: 'semanal' },
  { type: 'Comunicação Alternativa', description: 'Painel de comunicação com símbolos PECS', frequency: 'diária' },
  { type: 'Apoio Pedagógico', description: 'Atendimento educacional especializado (AEE)', frequency: 'semanal' },
  { type: 'Terapia Ocupacional', description: 'Adaptação de atividades para habilidades motoras', frequency: 'quinzenal' },
  { type: 'Fonoaudiologia', description: 'Exercícios de linguagem e comunicação', frequency: 'semanal' },
  { type: 'Psicopedagogia', description: 'Acompanhamento do desenvolvimento de aprendizagem', frequency: 'quinzenal' },
];

// Encaminhamentos comuns
const referralTypes = [
  { referredTo: 'Neurologista', reason: 'Avaliação neurológica completa para diagnóstico diferencial' },
  { referredTo: 'Psicólogo', reason: 'Acompanhamento psicológico para desenvolvimento socioemocional' },
  { referredTo: 'Fonoaudiólogo', reason: 'Avaliação e intervenção em linguagem e comunicação' },
  { referredTo: 'Terapeuta Ocupacional', reason: 'Desenvolvimento de habilidades motoras e adaptações' },
  { referredTo: 'Oftalmologista', reason: 'Avaliação visual e prescrição de adaptações' },
  { referredTo: 'Otorrinolaringologista', reason: 'Avaliação auditiva e prescrição de aparelhos' },
  { referredTo: 'Psiquiatra Infantil', reason: 'Avaliação psiquiátrica e acompanhamento medicamentoso' },
  { referredTo: 'Assistente Social', reason: 'Apoio familiar e encaminhamentos à rede de serviços' },
];

// Metas por categoria
const goalTemplates = {
  academic: [
    { desc: 'Dominar leitura silábica de palavras de 3 sílabas', level: 'em progresso', score: 60 },
    { desc: 'Compreender e resolver problemas matemáticos de soma simples', level: 'não iniciada', score: 0 },
    { desc: 'Produzir textos narrativos com coerência básica', level: 'em progresso', score: 40 },
    { desc: 'Identificar e nomear todas as letras do alfabeto', level: 'concluída', score: 100 },
    { desc: 'Realizar operações de soma e subtração até 20', level: 'em progresso', score: 70 },
  ],
  functional: [
    { desc: 'Desenvolver autonomia na alimentação com talheres', level: 'concluída', score: 100 },
    { desc: 'Utilizar banheiro de forma independente', level: 'em progresso', score: 80 },
    { desc: 'Organizar materiais escolares e mochila', level: 'em progresso', score: 50 },
    { desc: 'Participar de atividades coletivas respeitando turno', level: 'em progresso', score: 65 },
    { desc: 'Manter atenção em atividades por 15 minutos', level: 'não iniciada', score: 0 },
  ],
};

async function populatePEIs() {
  console.log('📋 Populando PEIs completos com dados de análise...\n');

  try {
    // Buscar alunos da escola
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .eq('school_id', SCHOOL_ID)
      .eq('is_active', true);

    if (studentsError) {
      console.error('❌ Erro ao buscar alunos:', studentsError.message);
      return;
    }

    if (!students || students.length === 0) {
      console.log('⚠️ Nenhum aluno encontrado na escola');
      return;
    }

    console.log(`✅ Encontrados ${students.length} alunos\n`);

    // Buscar coordenador para ser o criador
    const { data: coordRoles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['coordinator', 'education_secretary'])
      .limit(1);

    var coordinatorId = null;
    
    if (coordRoles && coordRoles.length > 0) {
      coordinatorId = coordRoles[0].user_id;
    } else {
      console.log('⚠️ Nenhum coordenador encontrado, buscando qualquer usuário...');
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(1);
      
      if (profiles && profiles.length > 0) {
        coordinatorId = profiles[0].id;
      }
    }

    if (!coordinatorId) {
      console.error('❌ Nenhum usuário encontrado no sistema');
      return;
    }

    console.log(`👤 Usando coordenador: ${coordinatorId}\n`);

    let peisCreated = 0;
    let barriersCreated = 0;
    let goalsCreated = 0;
    let resourcesCreated = 0;
    let referralsCreated = 0;
    let reviewsCreated = 0;

    // Criar PEIs para os primeiros 8 alunos
    for (let i = 0; i < Math.min(8, students.length); i++) {
      const student = students[i];
      
      try {
        console.log(`📝 Criando PEI para ${student.name}...`);

        // Verificar se já existe PEI
        const { data: existingPEI } = await supabase
          .from('peis')
          .select('id')
          .eq('student_id', student.id)
          .single();

        let peiId;
        if (existingPEI) {
          console.log(`   ⏭️  PEI já existe, usando existente`);
          peiId = existingPEI.id;
        } else {
          // Criar PEI
          const { data: newPEI, error: peiError } = await supabase
            .from('peis')
            .insert({
              student_id: student.id,
              school_id: SCHOOL_ID,
              tenant_id: TENANT_ID,
              assigned_teacher_id: coordinatorId,
              created_by: coordinatorId,
              status: Math.random() > 0.5 ? 'approved' : 'pending',
              version_number: 1,
              is_active_version: true,
            })
            .select()
            .single();

          if (peiError) {
            console.error(`   ❌ Erro ao criar PEI:`, peiError.message);
            continue;
          }

          peiId = newPEI.id;
          peisCreated++;
          console.log(`   ✅ PEI criado`);
        }

        // Criar barreiras (2-3 por aluno)
        const numBarriers = Math.floor(Math.random() * 2) + 2;
        const selectedBarriers = shuffleArray(barrierTemplates).slice(0, numBarriers);
        
        for (const barrier of selectedBarriers) {
          const { error: barrierError } = await supabase
            .from('pei_barriers')
            .insert({
              pei_id: peiId,
              barrier_type: barrier.type,
              description: barrier.description,
              severity: barrier.severity,
            });

          if (!barrierError) barriersCreated++;
        }

        // Criar barreiras para garantir barreiras comuns
        const commonBarriers = [
          { type: 'Barreira Pedagógica', description: 'Falta de adaptação curricular', severity: 'alta' },
          { type: 'Barreira Tecnológica', description: 'Ausência de tecnologias assistivas', severity: 'alta' },
        ];

        for (const barrier of commonBarriers) {
          const { error } = await supabase
            .from('pei_barriers')
            .insert({
              pei_id: peiId,
              barrier_type: barrier.type,
              description: barrier.description,
              severity: barrier.severity,
            });

          if (!error) barriersCreated++;
        }

        // Criar recursos de acessibilidade (3-4 por aluno)
        const numResources = Math.floor(Math.random() * 2) + 3;
        const selectedResources = shuffleArray(accessibilityResources).slice(0, numResources);
        
        for (const resource of selectedResources) {
          const { error: resourceError } = await supabase
            .from('pei_accessibility_resources')
            .insert({
              pei_id: peiId,
              resource_type: resource.type,
              description: resource.description,
              usage_frequency: resource.frequency,
            });

          if (!resourceError) resourcesCreated++;
        }

        // Criar encaminhamentos (1-2 por aluno)
        const numReferrals = Math.floor(Math.random() * 2) + 1;
        const selectedReferrals = shuffleArray(referralTypes).slice(0, numReferrals);
        
        for (const referral of selectedReferrals) {
          const { error: referralError } = await supabase
            .from('pei_referrals')
            .insert({
              pei_id: peiId,
              referred_to: referral.referredTo,
              reason: referral.reason,
              date: new Date().toISOString(),
            });

          if (!referralError) referralsCreated++;
        }

        // Criar metas acadêmicas e funcionais
        const numAcademicGoals = Math.floor(Math.random() * 2) + 2;
        const academicGoals = shuffleArray(goalTemplates.academic).slice(0, numAcademicGoals);
        
        for (const goal of academicGoals) {
          const { error: goalError } = await supabase
            .from('pei_goals')
            .insert({
              pei_id: peiId,
              description: goal.desc,
              category: 'academic',
              progress_level: goal.level,
              progress_score: goal.score,
              target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });

          if (!goalError) goalsCreated++;
        }

        const numFunctionalGoals = Math.floor(Math.random() * 2) + 2;
        const functionalGoals = shuffleArray(goalTemplates.functional).slice(0, numFunctionalGoals);
        
        for (const goal of functionalGoals) {
          const { error: goalError } = await supabase
            .from('pei_goals')
            .insert({
              pei_id: peiId,
              description: goal.desc,
              category: 'functional',
              progress_level: goal.level,
              progress_score: goal.score,
              target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });

          if (!goalError) goalsCreated++;
        }

        // Criar revisões (2-3 por aluno)
        const numReviews = Math.floor(Math.random() * 2) + 2;
        const reviewDates = [
          new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date(Date.now()),
        ].slice(0, numReviews);

        for (const reviewDate of reviewDates) {
          const { error: reviewError } = await supabase
            .from('pei_reviews')
            .insert({
              pei_id: peiId,
              reviewer_id: coordinatorId,
              reviewer_role: 'coordinator',
              review_date: reviewDate.toISOString(),
              notes: 'Avaliação periódica do desenvolvimento do aluno conforme estabelecido no PEI.',
              next_review_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });

          if (!reviewError) reviewsCreated++;
        }

        // Pequeno delay para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${student.name}:`, error.message);
      }
    }

    console.log('\n📊 Resumo da população:');
    console.log(`   ✅ PEIs criados: ${peisCreated}`);
    console.log(`   🚧 Barreiras criadas: ${barriersCreated}`);
    console.log(`   🎯 Metas criadas: ${goalsCreated}`);
    console.log(`   ♿ Recursos de acessibilidade: ${resourcesCreated}`);
    console.log(`   📤 Encaminhamentos: ${referralsCreated}`);
    console.log(`   📝 Revisões: ${reviewsCreated}`);
    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error(error);
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

populatePEIs();


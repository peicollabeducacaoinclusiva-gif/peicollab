/**
 * Script para preencher dados de teste no App Gestão Escolar
 * 
 * Este script cria:
 * - Alunos (students)
 * - Profissionais (professionals)
 * - Turmas (classes)
 * - Matrículas (student_enrollments, se existir)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const envPath = join(__dirname, '..', '.env');
let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('Erro ao ler .env:', error.message);
  process.exit(1);
}

const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tentar diferentes credenciais de superadmin
async function authenticateAsSuperadmin() {
  console.log('🔐 Tentando autenticar como superadmin...');
  
  const credentials = [
    { email: 'superadmin@teste.com', password: 'Teste123!' },
    { email: 'admin@teste.com', password: 'Teste123!' },
    { email: 'superadmin@example.com', password: 'Teste123!' },
  ];

  for (const cred of credentials) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cred.email,
      password: cred.password,
    });

    if (!authError && authData) {
      console.log(`✅ Autenticado como ${cred.email}\n`);
      return true;
    }
  }

  console.log('⚠️  Não foi possível fazer login como superadmin.');
  console.log('   Tentando usar tenant/escola existentes ou criar via RPC...\n');
  return false;
}

// Dados de teste
const testData = {
  students: [
    {
      name: 'Ana Silva Santos',
      date_of_birth: '2015-03-15',
      student_id: 'STU001',
      mother_name: 'Maria Silva Santos',
      father_name: 'João Santos',
      email: 'ana.silva@example.com',
      phone: '(11) 98765-4321',
      necessidades_especiais: false,
      tipo_necessidade: [],
    },
    {
      name: 'Carlos Eduardo Oliveira',
      date_of_birth: '2014-07-22',
      student_id: 'STU002',
      mother_name: 'Patricia Oliveira',
      father_name: 'Eduardo Oliveira',
      email: 'carlos.eduardo@example.com',
      phone: '(11) 98765-4322',
      necessidades_especiais: true,
      tipo_necessidade: ['TDAH'],
    },
    {
      name: 'Mariana Costa Lima',
      date_of_birth: '2015-11-08',
      student_id: 'STU003',
      mother_name: 'Fernanda Costa',
      father_name: 'Roberto Lima',
      email: 'mariana.costa@example.com',
      phone: '(11) 98765-4323',
      necessidades_especiais: false,
      tipo_necessidade: [],
    },
    {
      name: 'Lucas Henrique Ferreira',
      date_of_birth: '2013-05-20',
      student_id: 'STU004',
      mother_name: 'Juliana Ferreira',
      father_name: 'Henrique Ferreira',
      email: 'lucas.henrique@example.com',
      phone: '(11) 98765-4324',
      necessidades_especiais: true,
      tipo_necessidade: ['TEA'],
    },
    {
      name: 'Isabella Rodrigues Alves',
      date_of_birth: '2015-09-12',
      student_id: 'STU005',
      mother_name: 'Camila Rodrigues',
      father_name: 'Pedro Alves',
      email: 'isabella.rodrigues@example.com',
      phone: '(11) 98765-4325',
      necessidades_especiais: false,
      tipo_necessidade: [],
    },
    {
      name: 'Gabriel Souza Martins',
      date_of_birth: '2014-12-03',
      student_id: 'STU006',
      mother_name: 'Amanda Souza',
      father_name: 'Ricardo Martins',
      email: 'gabriel.souza@example.com',
      phone: '(11) 98765-4326',
      necessidades_especiais: true,
      tipo_necessidade: ['Dislexia'],
    },
    {
      name: 'Sophia Araújo Barbosa',
      date_of_birth: '2015-01-18',
      student_id: 'STU007',
      mother_name: 'Larissa Araújo',
      father_name: 'Marcos Barbosa',
      email: 'sophia.araujo@example.com',
      phone: '(11) 98765-4327',
      necessidades_especiais: false,
      tipo_necessidade: [],
    },
    {
      name: 'Rafael Mendes Pereira',
      date_of_birth: '2013-08-25',
      student_id: 'STU008',
      mother_name: 'Vanessa Mendes',
      father_name: 'Felipe Pereira',
      email: 'rafael.mendes@example.com',
      phone: '(11) 98765-4328',
      necessidades_especiais: true,
      tipo_necessidade: ['TDAH', 'Dislexia'],
    },
    {
      name: 'Julia Fernandes Rocha',
      date_of_birth: '2015-04-30',
      student_id: 'STU009',
      mother_name: 'Beatriz Fernandes',
      father_name: 'André Rocha',
      email: 'julia.fernandes@example.com',
      phone: '(11) 98765-4329',
      necessidades_especiais: false,
      tipo_necessidade: [],
    },
    {
      name: 'Enzo Gomes Carvalho',
      date_of_birth: '2014-10-14',
      student_id: 'STU010',
      mother_name: 'Renata Gomes',
      father_name: 'Thiago Carvalho',
      email: 'enzo.gomes@example.com',
      phone: '(11) 98765-4330',
      necessidades_especiais: true,
      tipo_necessidade: ['TEA'],
    },
  ],
  professionals: [
    {
      full_name: 'Prof. Maria Eduarda Silva',
      email: 'maria.silva@escola.com',
      phone: '(11) 98765-4101',
      professional_role: 'teacher',
      registration_number: 'PROF001',
      specialization: 'Pedagogia - Anos Iniciais',
    },
    {
      full_name: 'Prof. João Pedro Santos',
      email: 'joao.santos@escola.com',
      phone: '(11) 98765-4102',
      professional_role: 'teacher',
      registration_number: 'PROF002',
      specialization: 'Matemática',
    },
    {
      full_name: 'Prof. Ana Paula Costa',
      email: 'ana.costa@escola.com',
      phone: '(11) 98765-4103',
      professional_role: 'teacher',
      registration_number: 'PROF003',
      specialization: 'Língua Portuguesa',
    },
    {
      full_name: 'Coord. Pedagógica - Luciana Oliveira',
      email: 'luciana.oliveira@escola.com',
      phone: '(11) 98765-4104',
      professional_role: 'coordinator',
      registration_number: 'COORD001',
      specialization: 'Coordenação Pedagógica',
    },
    {
      full_name: 'Diretor - Roberto Alves',
      email: 'roberto.alves@escola.com',
      phone: '(11) 98765-4105',
      professional_role: 'school_director',
      registration_number: 'DIR001',
      specialization: 'Gestão Escolar',
    },
    {
      full_name: 'Prof. AEE - Fernanda Lima',
      email: 'fernanda.lima@escola.com',
      phone: '(11) 98765-4106',
      professional_role: 'aee_teacher',
      registration_number: 'AEE001',
      specialization: 'Atendimento Educacional Especializado',
    },
    {
      full_name: 'Prof. Educação Física - Carlos Mendes',
      email: 'carlos.mendes@escola.com',
      phone: '(11) 98765-4107',
      professional_role: 'teacher',
      registration_number: 'PROF004',
      specialization: 'Educação Física',
    },
    {
      full_name: 'Prof. Artes - Patricia Souza',
      email: 'patricia.souza@escola.com',
      phone: '(11) 98765-4108',
      professional_role: 'teacher',
      registration_number: 'PROF005',
      specialization: 'Artes',
    },
  ],
  classes: [
    {
      class_name: '3º Ano A',
      education_level: 'ENSINO_FUNDAMENTAL',
      grade: '3º Ano EF',
      shift: 'Manhã',
      academic_year: '2025',
      max_students: 25,
      current_students: 0,
    },
    {
      class_name: '3º Ano B',
      education_level: 'ENSINO_FUNDAMENTAL',
      grade: '3º Ano EF',
      shift: 'Tarde',
      academic_year: '2025',
      max_students: 25,
      current_students: 0,
    },
    {
      class_name: '4º Ano A',
      education_level: 'ENSINO_FUNDAMENTAL',
      grade: '4º Ano EF',
      shift: 'Manhã',
      academic_year: '2025',
      max_students: 25,
      current_students: 0,
    },
    {
      class_name: '5º Ano A',
      education_level: 'ENSINO_FUNDAMENTAL',
      grade: '5º Ano EF',
      shift: 'Manhã',
      academic_year: '2025',
      max_students: 25,
      current_students: 0,
    },
    {
      class_name: 'Maternal',
      education_level: 'EDUCACAO_INFANTIL',
      grade: 'Maternal',
      shift: 'Integral',
      academic_year: '2025',
      max_students: 20,
      current_students: 0,
    },
  ],
};

async function populateData() {
  console.log('🚀 Iniciando preenchimento de dados de teste para Gestão Escolar...\n');

  // Autenticar como superadmin
  await authenticateAsSuperadmin();

  try {
    // 1. Buscar ou criar tenant e escola
    console.log('📋 Buscando tenant e escola existentes...');
    let { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, network_name')
      .limit(1);

    if (tenantsError) throw tenantsError;
    
    let tenant;
    if (!tenants || tenants.length === 0) {
      console.log('⚠️  Nenhum tenant encontrado.');
      console.log('   Por favor, crie um tenant manualmente ou via interface do sistema.');
      console.log('   Você pode usar o script create_test_network.sql ou criar via interface.\n');
      throw new Error('Tenant é necessário para continuar. Crie um tenant primeiro.');
    } else {
      tenant = tenants[0];
      console.log(`✅ Tenant encontrado: ${tenant.network_name} (${tenant.id})\n`);
    }

    let { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('tenant_id', tenant.id)
      .limit(1);

    if (schoolsError) throw schoolsError;
    
    let school;
    if (!schools || schools.length === 0) {
      console.log('⚠️  Nenhuma escola encontrada. Criando escola de teste...');
      const { data: newSchool, error: createSchoolError } = await supabase
        .from('schools')
        .insert({
          tenant_id: tenant.id,
          school_name: 'Escola Municipal de Ensino Fundamental - Teste',
          school_address: 'Avenida Principal, 200',
          school_email: 'escola@teste.com',
          school_phone: '(11) 88888-8888',
          is_active: true,
        })
        .select()
        .single();

      if (createSchoolError) throw createSchoolError;
      school = newSchool;
      console.log(`✅ Escola criada: ${school.school_name} (${school.id})\n`);
    } else {
      school = schools[0];
      console.log(`✅ Escola encontrada: ${school.school_name} (${school.id})\n`);
    }

    // 2. Criar Profissionais
    console.log('👥 Criando profissionais...');
    const createdProfessionals = [];
    for (const prof of testData.professionals) {
      const { data, error } = await supabase
        .from('professionals')
        .insert({
          ...prof,
          tenant_id: tenant.id,
          school_id: school.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`⚠️  Erro ao criar profissional ${prof.full_name}:`, error.message);
      } else {
        createdProfessionals.push(data);
        console.log(`  ✅ ${prof.full_name} criado`);
      }
    }
    console.log(`✅ ${createdProfessionals.length} profissionais criados\n`);

    // 3. Criar Turmas
    console.log('📚 Criando turmas...');
    const createdClasses = [];
    for (let i = 0; i < testData.classes.length; i++) {
      const classData = testData.classes[i];
      // Atribuir professor regente (se houver professores criados)
      const mainTeacherId = createdProfessionals.find(p => p.professional_role === 'teacher')?.id || null;

      const { data, error } = await supabase
        .from('classes')
        .insert({
          ...classData,
          tenant_id: tenant.id,
          school_id: school.id,
          main_teacher_id: mainTeacherId,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`⚠️  Erro ao criar turma ${classData.class_name}:`, error.message);
      } else {
        createdClasses.push(data);
        console.log(`  ✅ ${classData.class_name} criada`);
      }
    }
    console.log(`✅ ${createdClasses.length} turmas criadas\n`);

    // 4. Criar Alunos
    console.log('👨‍🎓 Criando alunos...');
    const createdStudents = [];
    for (let i = 0; i < testData.students.length; i++) {
      const student = testData.students[i];
      // Distribuir alunos entre as turmas
      const classIndex = i % createdClasses.length;
      const assignedClass = createdClasses[classIndex];

      const { data, error } = await supabase
        .from('students')
        .insert({
          ...student,
          tenant_id: tenant.id,
          school_id: school.id,
          class_id: assignedClass.id,
          class_name: assignedClass.class_name,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`⚠️  Erro ao criar aluno ${student.name}:`, error.message);
      } else {
        createdStudents.push(data);
        console.log(`  ✅ ${student.name} criado (${assignedClass.class_name})`);

        // Atualizar contador de alunos na turma
        await supabase
          .from('classes')
          .update({ current_students: assignedClass.current_students + 1 })
          .eq('id', assignedClass.id);
      }
    }
    console.log(`✅ ${createdStudents.length} alunos criados\n`);

    // 5. Verificar se existe tabela student_enrollments e criar matrículas
    console.log('📝 Verificando tabela de matrículas...');
    try {
      const { data: enrollmentCheck, error: enrollmentCheckError } = await supabase
        .from('student_enrollments')
        .select('id')
        .limit(1);

      if (!enrollmentCheckError) {
        console.log('✅ Tabela student_enrollments encontrada. Criando matrículas...');
        for (let i = 0; i < createdStudents.length; i++) {
          const student = createdStudents[i];
          const classIndex = i % createdClasses.length;
          const assignedClass = createdClasses[classIndex];

          const { error: enrollmentError } = await supabase
            .from('student_enrollments')
            .insert({
              student_id: student.id,
              school_id: school.id,
              academic_year: parseInt(assignedClass.academic_year),
              grade: assignedClass.grade,
              class_name: assignedClass.class_name,
              shift: assignedClass.shift,
              enrollment_number: `MAT${String(i + 1).padStart(3, '0')}`,
              enrollment_date: new Date().toISOString().split('T')[0],
              status: 'active',
            });

          if (enrollmentError) {
            console.error(`⚠️  Erro ao criar matrícula para ${student.name}:`, enrollmentError.message);
          } else {
            console.log(`  ✅ Matrícula criada para ${student.name}`);
          }
        }
        console.log('✅ Matrículas criadas\n');
      } else {
        console.log('ℹ️  Tabela student_enrollments não encontrada ou não acessível. Pulando criação de matrículas.\n');
      }
    } catch (error) {
      console.log('ℹ️  Tabela student_enrollments não encontrada ou não acessível. Pulando criação de matrículas.\n');
    }

    // 6. Resumo
    console.log('📊 RESUMO DO PREENCHIMENTO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Tenant: ${tenant.network_name}`);
    console.log(`✅ Escola: ${school.school_name}`);
    console.log(`✅ Profissionais: ${createdProfessionals.length}`);
    console.log(`✅ Turmas: ${createdClasses.length}`);
    console.log(`✅ Alunos: ${createdStudents.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Preenchimento de dados concluído com sucesso!');
    console.log('\n💡 Você pode agora testar o app Gestão Escolar com esses dados.');

  } catch (error) {
    console.error('❌ Erro ao preencher dados:', error);
    process.exit(1);
  }
}

populateData();


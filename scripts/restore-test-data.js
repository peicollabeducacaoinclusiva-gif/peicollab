// Script para restaurar dados de teste no banco de produção
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IDs fixos para a escola e rede de demonstração
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SCHOOL_ID = '00000000-0000-0000-0000-000000000002';

// Dados dos alunos
const students = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Ana Beatriz Santos',
    date_of_birth: '2015-03-15',
    student_id: '2024001',
    class_name: '4º Ano A',
    mother_name: 'Maria Santos',
    father_name: 'João Santos',
    phone: '(11) 99999-0001',
    email: 'ana.santos@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Bruno Oliveira Costa',
    date_of_birth: '2014-07-22',
    student_id: '2024002',
    class_name: '5º Ano B',
    mother_name: 'Carla Costa',
    father_name: 'Pedro Costa',
    phone: '(11) 99999-0002',
    email: 'bruno.costa@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Carlos Eduardo Silva',
    date_of_birth: '2016-11-08',
    student_id: '2024003',
    class_name: '3º Ano A',
    mother_name: 'Fernanda Silva',
    father_name: 'Eduardo Silva',
    phone: '(11) 99999-0003',
    email: 'carlos.silva@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Débora Lima Rodrigues',
    date_of_birth: '2015-01-30',
    student_id: '2024004',
    class_name: '4º Ano B',
    mother_name: 'Patrícia Rodrigues',
    father_name: 'Roberto Lima',
    phone: '(11) 99999-0004',
    email: 'debora.rodrigues@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Eduardo Henrique Pereira',
    date_of_birth: '2014-09-12',
    student_id: '2024005',
    class_name: '5º Ano A',
    mother_name: 'Silvia Pereira',
    father_name: 'Henrique Pereira',
    phone: '(11) 99999-0005',
    email: 'eduardo.pereira@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: 'Fernanda Alves Souza',
    date_of_birth: '2016-05-18',
    student_id: '2024006',
    class_name: '3º Ano B',
    mother_name: 'Lucia Souza',
    father_name: 'Marcos Alves',
    phone: '(11) 99999-0006',
    email: 'fernanda.souza@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    name: 'Gabriel Martins Ferreira',
    date_of_birth: '2015-12-03',
    student_id: '2024007',
    class_name: '4º Ano A',
    mother_name: 'Adriana Ferreira',
    father_name: 'Antonio Martins',
    phone: '(11) 99999-0007',
    email: 'gabriel.ferreira@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    name: 'Helena Cristina Barbosa',
    date_of_birth: '2014-04-25',
    student_id: '2024008',
    class_name: '5º Ano B',
    mother_name: 'Cristina Barbosa',
    father_name: 'Paulo Barbosa',
    phone: '(11) 99999-0008',
    email: 'helena.barbosa@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    name: 'Isabela Mendes Carvalho',
    date_of_birth: '2016-08-14',
    student_id: '2024009',
    class_name: '3º Ano A',
    mother_name: 'Juliana Carvalho',
    father_name: 'Ricardo Mendes',
    phone: '(11) 99999-0009',
    email: 'isabela.carvalho@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'João Pedro Ribeiro',
    date_of_birth: '2015-02-07',
    student_id: '2024010',
    class_name: '4º Ano B',
    mother_name: 'Alessandra Ribeiro',
    father_name: 'Marcelo Ribeiro',
    phone: '(11) 99999-0010',
    email: 'joao.ribeiro@familia.com'
  }
];

// IDs dos professores para criar PEIs
const TEACHER_IDS = [
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
];

async function restoreTestData() {
  console.log('🚀 Restaurando dados de teste no banco de produção...\n');

  try {
    // 1. Verificar se a escola existe
    console.log('1. Verificando se a escola de demonstração existe...');
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('id', SCHOOL_ID)
      .single();

    if (schoolError) {
      console.error('❌ Erro ao verificar escola:', schoolError.message);
      console.log('💡 A escola de demonstração não foi encontrada. Criando...');
      
      // Criar a escola se não existir
      const { data: newSchool, error: createSchoolError } = await supabase
        .from('schools')
        .insert({
          id: SCHOOL_ID,
          tenant_id: TENANT_ID,
          school_name: 'Escola Municipal João da Silva',
          school_address: 'Rua das Flores, 456',
          school_email: 'escola@municipal.com',
          is_active: true
        })
        .select()
        .single();

      if (createSchoolError) {
        console.error('❌ Erro ao criar escola:', createSchoolError.message);
        return;
      }
      console.log('✅ Escola criada:', newSchool.school_name);
    } else {
      console.log('✅ Escola encontrada:', school.school_name);
    }

    // 2. Inserir alunos
    console.log('\n2. Inserindo alunos de teste...');
    const studentsWithSchoolData = students.map(student => ({
      ...student,
      school_id: SCHOOL_ID,
      tenant_id: TENANT_ID,
      is_active: true
    }));

    const { data: insertedStudents, error: studentsError } = await supabase
      .from('students')
      .upsert(studentsWithSchoolData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (studentsError) {
      console.error('❌ Erro ao inserir alunos:', studentsError.message);
      return;
    }

    console.log(`✅ ${insertedStudents.length} alunos inseridos/atualizados`);

    // 3. Criar PEIs de teste para alguns alunos
    console.log('\n3. Criando PEIs de teste...');
    const peisToCreate = [
      {
        student_id: '10000000-0000-0000-0000-000000000001',
        status: 'draft',
        version_number: 1
      },
      {
        student_id: '10000000-0000-0000-0000-000000000002',
        status: 'pending',
        version_number: 1
      },
      {
        student_id: '10000000-0000-0000-0000-000000000003',
        status: 'approved',
        version_number: 1
      },
      {
        student_id: '10000000-0000-0000-0000-000000000004',
        status: 'draft',
        version_number: 1
      }
    ];

    const peisWithSchoolData = peisToCreate.map(pei => ({
      ...pei,
      school_id: SCHOOL_ID,
      tenant_id: TENANT_ID,
      is_active_version: true
    }));

    const { data: insertedPEIs, error: peisError } = await supabase
      .from('peis')
      .upsert(peisWithSchoolData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (peisError) {
      console.error('❌ Erro ao inserir PEIs:', peisError.message);
      return;
    }

    console.log(`✅ ${insertedPEIs?.length || 0} PEIs criados/atualizados`);

    // 4. Verificar resultado final
    console.log('\n4. Verificando resultado final...');
    const { count: studentsCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    const { count: peisCount } = await supabase
      .from('peis')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Resumo:`);
    console.log(`   Students: ${studentsCount}`);
    console.log(`   PEIs: ${peisCount}`);

    if (studentsCount > 0 && peisCount > 0) {
      console.log('\n🎉 Dados de teste restaurados com sucesso!');
    } else {
      console.log('\n⚠️ Ainda faltam dados. Verifique erros acima.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

restoreTestData();


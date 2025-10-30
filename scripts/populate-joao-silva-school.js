// Script para popular alunos e professores na Escola Municipal João da Silva
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// IDs fixos para a escola e rede
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
    name: 'Igor Santos Nascimento',
    date_of_birth: '2016-08-14',
    student_id: '2024009',
    class_name: '3º Ano A',
    mother_name: 'Rosa Nascimento',
    father_name: 'Carlos Santos',
    phone: '(11) 99999-0009',
    email: 'igor.nascimento@familia.com'
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'Julia Mendes Rocha',
    date_of_birth: '2015-06-09',
    student_id: '2024010',
    class_name: '4º Ano B',
    mother_name: 'Márcia Rocha',
    father_name: 'José Mendes',
    phone: '(11) 99999-0010',
    email: 'julia.rocha@familia.com'
  }
];

// Dados dos professores
const teachers = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    email: 'prof.maria@escola.com',
    password: 'Teste123!',
    full_name: 'Maria das Graças Santos',
    role: 'teacher',
    class_name: '4º Ano A'
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    email: 'prof.joao@escola.com',
    password: 'Teste123!',
    full_name: 'João Carlos Oliveira',
    role: 'teacher',
    class_name: '5º Ano B'
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    email: 'prof.ana@escola.com',
    password: 'Teste123!',
    full_name: 'Ana Paula Costa',
    role: 'teacher',
    class_name: '3º Ano A'
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    email: 'prof.pedro@escola.com',
    password: 'Teste123!',
    full_name: 'Pedro Henrique Lima',
    role: 'teacher',
    class_name: '4º Ano B'
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    email: 'prof.carla@escola.com',
    password: 'Teste123!',
    full_name: 'Carla Regina Silva',
    role: 'teacher',
    class_name: '5º Ano A'
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    email: 'prof.antonio@escola.com',
    password: 'Teste123!',
    full_name: 'Antonio Carlos Souza',
    role: 'teacher',
    class_name: '3º Ano B'
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    email: 'aee.marcia@escola.com',
    password: 'Teste123!',
    full_name: 'Márcia Inclusão AEE',
    role: 'aee_teacher',
    class_name: 'AEE - Atendimento Especializado'
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    email: 'coord.fernanda@escola.com',
    password: 'Teste123!',
    full_name: 'Fernanda Coordenadora Pedagógica',
    role: 'coordinator',
    class_name: 'Coordenação Pedagógica'
  }
];

async function populateSchool() {
  console.log('🚀 Iniciando população da Escola Municipal João da Silva...\n');

  try {
    // 1. Verificar se a escola existe
    console.log('1. Verificando se a escola existe...');
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, school_name')
      .eq('id', SCHOOL_ID)
      .single();

    if (schoolError) {
      console.error('❌ Erro ao verificar escola:', schoolError);
      return;
    }

    console.log('✅ Escola encontrada:', school.school_name);

    // 2. Inserir alunos
    console.log('\n2. Inserindo alunos...');
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
      console.error('❌ Erro ao inserir alunos:', studentsError);
      return;
    }

    console.log(`✅ ${insertedStudents.length} alunos inseridos/atualizados`);

    // 3. Inserir usuários de autenticação para professores
    console.log('\n3. Criando usuários de autenticação para professores...');
    
    for (const teacher of teachers) {
      try {
        // Verificar se o usuário já existe
        const { data: existingUser } = await supabase.auth.admin.getUserById(teacher.id);
        
        if (existingUser.user) {
          console.log(`   ⚠️ Usuário ${teacher.email} já existe, pulando...`);
          continue;
        }

        // Criar usuário de autenticação
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          id: teacher.id,
          email: teacher.email,
          password: teacher.password,
          email_confirm: true,
          user_metadata: {
            full_name: teacher.full_name,
            role: teacher.role,
            tenant_id: TENANT_ID,
            school_id: SCHOOL_ID
          }
        });

        if (authError) {
          console.error(`   ❌ Erro ao criar usuário ${teacher.email}:`, authError.message);
          continue;
        }

        console.log(`   ✅ Usuário ${teacher.email} criado com sucesso`);

      } catch (error) {
        console.error(`   ❌ Erro ao processar professor ${teacher.email}:`, error.message);
      }
    }

    // 4. Inserir perfis dos professores
    console.log('\n4. Criando perfis dos professores...');
    
    const profiles = teachers.map(teacher => ({
      id: teacher.id,
      full_name: teacher.full_name,
      school_id: SCHOOL_ID,
      tenant_id: TENANT_ID,
      role: teacher.role,
      is_active: true
    }));

    const { data: insertedProfiles, error: profilesError } = await supabase
      .from('profiles')
      .upsert(profiles, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();

    if (profilesError) {
      console.error('❌ Erro ao inserir perfis:', profilesError);
      return;
    }

    console.log(`✅ ${insertedProfiles.length} perfis de professores criados/atualizados`);

    // 5. Inserir roles dos professores
    console.log('\n5. Criando roles dos professores...');
    
    const userRoles = teachers.map(teacher => ({
      user_id: teacher.id,
      role: teacher.role
    }));

    const { data: insertedRoles, error: rolesError } = await supabase
      .from('user_roles')
      .upsert(userRoles, { 
        onConflict: 'user_id,role',
        ignoreDuplicates: false 
      })
      .select();

    if (rolesError) {
      console.error('❌ Erro ao inserir roles:', rolesError);
      return;
    }

    console.log(`✅ ${insertedRoles.length} roles de professores criados/atualizados`);

    // 6. Inserir relacionamentos user_schools
    console.log('\n6. Criando relacionamentos user_schools...');
    
    const userSchools = teachers.map(teacher => ({
      user_id: teacher.id,
      school_id: SCHOOL_ID
    }));

    const { data: insertedUserSchools, error: userSchoolsError } = await supabase
      .from('user_schools')
      .upsert(userSchools, { 
        onConflict: 'user_id,school_id',
        ignoreDuplicates: false 
      })
      .select();

    if (userSchoolsError) {
      console.error('❌ Erro ao inserir user_schools:', userSchoolsError);
      return;
    }

    console.log(`✅ ${insertedUserSchools.length} relacionamentos user_schools criados/atualizados`);

    // 7. Inserir relacionamentos user_tenants
    console.log('\n7. Criando relacionamentos user_tenants...');
    
    const userTenants = teachers.map(teacher => ({
      user_id: teacher.id,
      tenant_id: TENANT_ID
    }));

    const { data: insertedUserTenants, error: userTenantsError } = await supabase
      .from('user_tenants')
      .upsert(userTenants, { 
        onConflict: 'user_id,tenant_id',
        ignoreDuplicates: false 
      })
      .select();

    if (userTenantsError) {
      console.error('❌ Erro ao inserir user_tenants:', userTenantsError);
      return;
    }

    console.log(`✅ ${insertedUserTenants.length} relacionamentos user_tenants criados/atualizados`);

    // 8. Resumo final
    console.log('\n🎉 População da escola concluída com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - Alunos: ${students.length}`);
    console.log(`   - Professores: ${teachers.length}`);
    console.log(`   - Professores AEE: ${teachers.filter(t => t.role === 'aee_teacher').length}`);
    console.log(`   - Coordenadores: ${teachers.filter(t => t.role === 'coordinator').length}`);
    
    console.log('\n🔑 Credenciais de acesso:');
    teachers.forEach(teacher => {
      console.log(`   - ${teacher.full_name}: ${teacher.email} / ${teacher.password}`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  populateSchool();
}

export { populateSchool, students, teachers };

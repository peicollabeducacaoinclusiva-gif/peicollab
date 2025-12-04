// Script para testar criação de PEIs com coordenador e professor
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
  console.log('⚠️ Arquivo .env não encontrado, usando variáveis padrão');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Credenciais de teste
const coordinatorEmail = 'coordenador@teste.com';
const coordinatorPassword = 'Teste123!';

const teacherEmail = 'professor@teste.com';
const teacherPassword = 'Teste123!';

async function testPEICreationForRole(email, password, roleName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTANDO CRIAÇÃO DE PEI COMO ${roleName.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);

  const results = {
    role: roleName,
    email: email,
    success: false,
    peiId: null,
    errors: []
  };

  try {
    // 1. Fazer login
    console.log(`1️⃣ Fazendo login como ${roleName}...`);
    await supabase.auth.signOut(); // Garantir logout prévio
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (authError) {
      console.error(`❌ Erro ao fazer login: ${authError.message}`);
      results.errors.push(`Erro de autenticação: ${authError.message}`);
      return results;
    }

    console.log(`✅ Login realizado com sucesso`);
    console.log(`   👤 User ID: ${authData.user.id}`);
    console.log(`   📧 Email: ${authData.user.email}\n`);

    // 2. Buscar informações do perfil
    console.log(`2️⃣ Buscando informações do perfil...`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        tenant_id,
        school_id,
        is_active
      `)
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error(`❌ Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      results.errors.push(`Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      return results;
    }

    console.log(`✅ Perfil encontrado:`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Tenant ID: ${profile.tenant_id || 'N/A'}`);
    console.log(`   School ID: ${profile.school_id || 'N/A'}`);
    console.log(`   Ativo: ${profile.is_active ? 'Sim' : 'Não'}\n`);

    // Buscar roles separadamente
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id);

    if (rolesError) {
      console.warn(`⚠️ Erro ao buscar roles: ${rolesError.message}`);
    } else if (userRoles && userRoles.length > 0) {
      const roles = userRoles.map((r) => r.role).join(', ');
      console.log(`   Roles: ${roles}\n`);
    }

    // 3. Buscar alunos disponíveis
    console.log(`3️⃣ Buscando alunos disponíveis...`);
    let studentsQuery = supabase
      .from('students')
      .select(`
        id,
        name,
        date_of_birth,
        school_id,
        tenant_id,
        is_active
      `)
      .eq('is_active', true);

    // Filtrar por school_id ou tenant_id dependendo do perfil
    if (profile.school_id) {
      studentsQuery = studentsQuery.eq('school_id', profile.school_id);
    } else if (profile.tenant_id) {
      studentsQuery = studentsQuery.eq('tenant_id', profile.tenant_id);
    }

    const { data: students, error: studentsError } = await studentsQuery.limit(10);

    if (studentsError) {
      console.error(`❌ Erro ao buscar alunos: ${studentsError.message}`);
      results.errors.push(`Erro ao buscar alunos: ${studentsError.message}`);
      return results;
    }

    if (!students || students.length === 0) {
      console.error(`❌ Nenhum aluno encontrado para este ${roleName}`);
      results.errors.push('Nenhum aluno disponível');
      return results;
    }

    console.log(`✅ Encontrados ${students.length} aluno(s):`);
    students.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.name} (ID: ${student.id})`);
    });

    // 4. Selecionar um aluno que não tenha PEI ativo
    console.log(`\n4️⃣ Verificando quais alunos não têm PEI ativo...`);
    let selectedStudent = null;

    for (const student of students) {
      const { data: existingPEI, error: peiCheckError } = await supabase
        .from('peis')
        .select('id, status')
        .eq('student_id', student.id)
        .eq('is_active_version', true)
        .maybeSingle();

      if (peiCheckError && peiCheckError.code !== 'PGRST116') {
        console.warn(`   ⚠️ Erro ao verificar PEI para ${student.name}: ${peiCheckError.message}`);
        continue;
      }

      if (!existingPEI) {
        selectedStudent = student;
        console.log(`   ✅ Aluno selecionado: ${student.name} (sem PEI ativo)`);
        break;
      } else {
        console.log(`   ⚠️ ${student.name} já possui PEI ativo (status: ${existingPEI.status})`);
      }
    }

    if (!selectedStudent) {
      console.warn(`⚠️ Todos os alunos já possuem PEI ativo. Criando PEI mesmo assim para teste...`);
      selectedStudent = students[0];
      console.log(`   Usando aluno: ${selectedStudent.name} (pode ter PEI ativo)`);
    }

    // 5. Buscar professor (se não for professor criando para si mesmo)
    console.log(`\n5️⃣ Buscando professor para atribuir ao PEI...`);
    let assignedTeacherId = null;

    if (roleName === 'professor') {
      // Professor pode criar PEI para si mesmo
      // Mas não vamos atribuir via assigned_teacher_id para evitar problema de RLS
      // A trigger sync_pei_primary_teacher() não é SECURITY DEFINER
      // Vamos usar a função add_teacher_to_pei() depois de criar o PEI
      assignedTeacherId = authData.user.id;
      console.log(`   ✅ Professor criando PEI para si mesmo`);
      console.log(`   📝 Nota: Professor será adicionado via função add_teacher_to_pei() após criar o PEI`);
    } else {
      // Coordenador precisa atribuir a um professor
      let teachersQuery = supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true);

      // Buscar professores do mesmo tenant/escola
      if (profile.school_id) {
        teachersQuery = teachersQuery.eq('school_id', profile.school_id);
      } else if (profile.tenant_id) {
        // Buscar professores por tenant
        teachersQuery = teachersQuery.eq('tenant_id', profile.tenant_id);
      }

      // Buscar roles de professores
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['teacher', 'aee_teacher']);

      if (teacherRoles && teacherRoles.length > 0) {
        const teacherIds = teacherRoles.map(tr => tr.user_id);
        teachersQuery = teachersQuery.in('id', teacherIds);
      }

      const { data: teachers, error: teachersError } = await teachersQuery.limit(5);

      if (teachersError) {
        console.warn(`   ⚠️ Erro ao buscar professores: ${teachersError.message}`);
      } else if (teachers && teachers.length > 0) {
        assignedTeacherId = teachers[0].id;
        console.log(`   ✅ Professor selecionado: ${teachers[0].full_name}`);
      } else {
        console.warn(`   ⚠️ Nenhum professor encontrado. PEI será criado sem professor atribuído.`);
      }
    }

    // 6. Criar PEI
    console.log(`\n6️⃣ Criando PEI...`);
    console.log(`   Aluno: ${selectedStudent.name} (ID: ${selectedStudent.id})`);
    console.log(`   School ID: ${selectedStudent.school_id}`);
    console.log(`   Tenant ID: ${selectedStudent.tenant_id}`);
    if (assignedTeacherId) {
      console.log(`   Professor atribuído: ${assignedTeacherId}`);
    }

    const peiPayload = {
      student_id: selectedStudent.id,
      school_id: selectedStudent.school_id,
      tenant_id: selectedStudent.tenant_id,
      created_by: authData.user.id,
      status: 'draft',
      diagnosis_data: {
        interests: `Interesses do aluno ${selectedStudent.name}`,
        specialNeeds: 'Necessidades especiais identificadas',
        strengths: ['Força 1', 'Força 2'],
        barriers: ['Barreira 1']
      },
      planning_data: {
        goals: [
          {
            description: 'Meta de teste criada pelo ' + roleName,
            category: 'academic',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ]
      },
      evaluation_data: {}
    };

    if (assignedTeacherId) {
      peiPayload.assigned_teacher_id = assignedTeacherId;
    }

    // Para professor, criar PEI sem assigned_teacher_id primeiro para evitar RLS
    let peiPayloadForInsert = { ...peiPayload };
    if (roleName === 'professor') {
      delete peiPayloadForInsert.assigned_teacher_id;
    }

    const { data: peiData, error: peiError } = await supabase
      .from('peis')
      .insert(peiPayloadForInsert)
      .select()
      .single();

    if (peiError) {
      console.error(`   ❌ Erro ao criar PEI: ${peiError.message}`);
      console.error(`   📝 Código: ${peiError.code}`);
      if (peiError.details) {
        console.error(`   📝 Detalhes: ${peiError.details}`);
      }
      results.errors.push(`Erro ao criar PEI: ${peiError.message}`);
      return results;
    }

    console.log(`   ✅ PEI criado com sucesso!`);
    console.log(`      PEI ID: ${peiData.id}`);
    console.log(`      Status: ${peiData.status}`);
    console.log(`      Criado por: ${authData.user.id}`);

    // Para professor, adicionar professor usando a função RPC após criar o PEI
    if (roleName === 'professor' && assignedTeacherId) {
      console.log(`   📝 Adicionando professor ao PEI via função RPC...`);
      const { data: teacherAdded, error: addTeacherError } = await supabase.rpc('add_teacher_to_pei', {
        p_pei_id: peiData.id,
        p_teacher_id: assignedTeacherId,
        p_subject: 'Português', // Disciplina padrão
        p_is_primary: true
      });

      if (addTeacherError) {
        console.error(`   ⚠️ Erro ao adicionar professor: ${addTeacherError.message}`);
        console.warn(`   ⚠️ PEI criado, mas professor não foi atribuído automaticamente`);
      } else {
        console.log(`   ✅ Professor adicionado ao PEI via função RPC`);
      }

      // Atualizar assigned_teacher_id no PEI também
      const { error: updateError } = await supabase
        .from('peis')
        .update({ assigned_teacher_id: assignedTeacherId })
        .eq('id', peiData.id);

      if (updateError) {
        console.warn(`   ⚠️ Erro ao atualizar assigned_teacher_id: ${updateError.message}`);
      }
    }

    results.peiId = peiData.id;
    results.success = true;

    // 7. Verificar PEI criado
    console.log(`\n7️⃣ Verificando PEI criado...`);
    const { data: createdPEI, error: verifyError } = await supabase
      .from('peis')
      .select(`
        id,
        student_id,
        school_id,
        tenant_id,
        status,
        created_by,
        assigned_teacher_id,
        diagnosis_data,
        planning_data
      `)
      .eq('id', peiData.id)
      .maybeSingle();

    // Buscar dados relacionados separadamente
    let studentName = 'N/A';
    let creatorName = 'N/A';

    if (createdPEI) {
      const { data: student } = await supabase
        .from('students')
        .select('name')
        .eq('id', createdPEI.student_id)
        .maybeSingle();

      if (student) {
        studentName = student.name;
      }

      const { data: creator } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', createdPEI.created_by)
        .maybeSingle();

      if (creator) {
        creatorName = creator.full_name;
      }
    }

    if (verifyError || !createdPEI) {
      console.error(`   ❌ Erro ao verificar PEI: ${verifyError?.message || 'PEI não encontrado'}`);
      results.errors.push(`Erro ao verificar PEI: ${verifyError?.message || 'PEI não encontrado'}`);
      return results;
    }

    console.log(`   ✅ PEI verificado:`);
    console.log(`      ID: ${createdPEI.id}`);
    console.log(`      Status: ${createdPEI.status}`);
    console.log(`      Aluno: ${studentName}`);
    console.log(`      Criado por: ${creatorName}`);
    console.log(`      School ID: ${createdPEI.school_id}`);
    console.log(`      Tenant ID: ${createdPEI.tenant_id}`);
    if (createdPEI.assigned_teacher_id) {
      console.log(`      Professor atribuído: ${createdPEI.assigned_teacher_id}`);
    }
    
    // Verificar se os dados JSON foram salvos
    if (createdPEI.diagnosis_data) {
      console.log(`      ✅ Diagnosis data salvo: ${JSON.stringify(createdPEI.diagnosis_data).substring(0, 50)}...`);
    }
    if (createdPEI.planning_data) {
      console.log(`      ✅ Planning data salvo: ${JSON.stringify(createdPEI.planning_data).substring(0, 50)}...`);
    }

    // Verificar consistência de tenant/school
    if (createdPEI.tenant_id !== selectedStudent.tenant_id) {
      console.error(`   ❌ ERRO: Tenant ID inconsistente! Esperado: ${selectedStudent.tenant_id}, Encontrado: ${createdPEI.tenant_id}`);
      results.errors.push('Tenant ID inconsistente');
    } else {
      console.log(`   ✅ Tenant ID consistente`);
    }

    if (createdPEI.school_id !== selectedStudent.school_id) {
      console.error(`   ❌ ERRO: School ID inconsistente! Esperado: ${selectedStudent.school_id}, Encontrado: ${createdPEI.school_id}`);
      results.errors.push('School ID inconsistente');
    } else {
      console.log(`   ✅ School ID consistente`);
    }

    // 8. Fazer logout
    await supabase.auth.signOut();
    console.log(`\n🚪 Logout realizado\n`);

    return results;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro geral: ${errorMessage}`);
    results.errors.push(`Erro geral: ${errorMessage}`);
    return results;
  }
}

async function testPEICreation() {
  console.log('🔍 Testando criação de PEIs com coordenador e professor...\n');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

  const allResults = [];

  // Testar como coordenador
  const coordinatorResults = await testPEICreationForRole(coordinatorEmail, coordinatorPassword, 'coordenador');
  allResults.push(coordinatorResults);

  // Aguardar um pouco antes do próximo teste
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Testar como professor
  const teacherResults = await testPEICreationForRole(teacherEmail, teacherPassword, 'professor');
  allResults.push(teacherResults);

  // Relatório final
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log(`${'='.repeat(80)}\n`);

  let successCount = 0;
  let failureCount = 0;

  allResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.role.toUpperCase()}: ${result.email}`);
    if (result.success) {
      console.log(`   PEI ID: ${result.peiId}`);
      successCount++;
    } else {
      console.log(`   Erros:`);
      result.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
      failureCount++;
    }
    console.log('');
  });

  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
  console.log(`📝 Total: ${allResults.length}\n`);

  console.log(`${'='.repeat(80)}\n`);

  // Retornar código de saída apropriado
  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testPEICreation().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});


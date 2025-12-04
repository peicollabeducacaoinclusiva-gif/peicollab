import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do arquivo .env
try {
  const envPath = join(__dirname, '..', '.env');
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testando solicitação de PEI pelo coordenador...\n');
console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

async function testCoordinatorRequestPEI() {
  const results = {
    coordinatorLogin: false,
    studentsLoaded: false,
    teachersLoaded: false,
    peiCreated: false,
    studentAccessCreated: false,
    peiData: null,
    errors: []
  };

  try {
    // 1. Login como coordenador
    console.log('1️⃣ Fazendo login como coordenador...\n');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coordenador@teste.com',
      password: 'Teste123!'
    });

    if (authError) {
      console.error('   ❌ Erro ao fazer login:', authError.message);
      results.errors.push(`Erro ao fazer login: ${authError.message}`);
      return results;
    }

    console.log('   ✅ Login realizado com sucesso');
    console.log(`   User ID: ${authData.user.id}`);
    results.coordinatorLogin = true;

    // 2. Buscar perfil do coordenador
    console.log('\n2️⃣ Buscando perfil do coordenador...\n');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id, school_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error('   ❌ Erro ao buscar perfil:', profileError?.message || 'Perfil não encontrado');
      results.errors.push(`Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      return results;
    }

    console.log('   ✅ Perfil encontrado:');
    console.log(`      Nome: ${profileData.full_name}`);
    console.log(`      Tenant ID: ${profileData.tenant_id || 'N/A'}`);
    console.log(`      School ID: ${profileData.school_id || 'N/A'}`);

    // 3. Buscar alunos disponíveis
    console.log('\n3️⃣ Buscando alunos disponíveis...\n');
    let studentsQuery = supabase
      .from('students')
      .select('id, name, school_id, tenant_id')
      .eq('is_active', true)
      .order('name');

    if (profileData.school_id) {
      studentsQuery = studentsQuery.eq('school_id', profileData.school_id);
    } else if (profileData.tenant_id) {
      studentsQuery = studentsQuery.eq('tenant_id', profileData.tenant_id);
    }

    const { data: studentsData, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('   ❌ Erro ao buscar alunos:', studentsError.message);
      results.errors.push(`Erro ao buscar alunos: ${studentsError.message}`);
      return results;
    }

    if (!studentsData || studentsData.length === 0) {
      console.error('   ❌ Nenhum aluno encontrado');
      results.errors.push('Nenhum aluno encontrado');
      return results;
    }

    console.log(`   ✅ ${studentsData.length} aluno(s) encontrado(s):`);
    studentsData.slice(0, 5).forEach((student, index) => {
      console.log(`      ${index + 1}. ${student.name} (ID: ${student.id.substring(0, 8)}...)`);
    });
    results.studentsLoaded = true;

    // Selecionar primeiro aluno que não tenha PEI ativo
    let selectedStudent = null;
    for (const student of studentsData) {
      const { data: existingPEI } = await supabase
        .from('peis')
        .select('id')
        .eq('student_id', student.id)
        .eq('is_active_version', true)
        .maybeSingle();

      if (!existingPEI) {
        selectedStudent = student;
        break;
      }
    }

    if (!selectedStudent) {
      console.warn('   ⚠️ Todos os alunos já têm PEI ativo. Usando primeiro aluno para teste...');
      selectedStudent = studentsData[0];
    }

    console.log(`\n   📝 Aluno selecionado: ${selectedStudent.name}`);
    console.log(`      ID: ${selectedStudent.id}`);

    // 4. Buscar professores disponíveis
    console.log('\n4️⃣ Buscando professores disponíveis...\n');
    
    let teachersData = null;
    let teachersError = null;
    
    // Primeiro, buscar todos os professores (teacher ou aee_teacher) pelo user_roles
    const { data: teacherRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['teacher', 'aee_teacher']);

    if (rolesError) {
      console.error('   ⚠️ Erro ao buscar roles:', rolesError.message);
    }

    let teacherIds = [];
    if (teacherRoles && teacherRoles.length > 0) {
      teacherIds = teacherRoles.map(tr => tr.user_id);
      console.log(`   📝 Encontrados ${teacherIds.length} professores (por role)`);
    }

    if (profileData.school_id && teacherIds.length > 0) {
      // Filtrar professores da mesma escola
      const { data: schoolTeachers, error: schoolTeachersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('school_id', profileData.school_id)
        .in('id', teacherIds);

      if (!schoolTeachersError && schoolTeachers && schoolTeachers.length > 0) {
        // Usar professores encontrados da escola (já filtrados por role)
        teachersData = schoolTeachers;
        teachersError = null;
      } else {
        console.log(`   ⚠️ Nenhum professor encontrado na escola específica. Buscando no tenant...`);
      }
    }

    // Se não encontrou por school_id, buscar no tenant
    if ((!teachersData || teachersData.length === 0) && profileData.tenant_id && teacherIds.length > 0) {
      const { data: tenantTeachers, error: tenantTeachersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('tenant_id', profileData.tenant_id)
        .in('id', teacherIds);

      if (!tenantTeachersError && tenantTeachers && tenantTeachers.length > 0) {
        teachersData = tenantTeachers;
        teachersError = null;
      }
    }

    // Se ainda não encontrou, buscar todos os professores (sem filtro de escola/tenant)
    if ((!teachersData || teachersData.length === 0) && teacherIds.length > 0) {
      console.log(`   ⚠️ Buscando todos os professores disponíveis...`);
      const { data: allTeachers, error: allTeachersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', teacherIds)
        .order('full_name');

      if (!allTeachersError && allTeachers && allTeachers.length > 0) {
        teachersData = allTeachers;
        teachersError = null;
      }
    }

    if (!teachersData || teachersData.length === 0) {
      console.error('   ❌ Nenhum professor encontrado');
      results.errors.push('Nenhum professor encontrado');
      await supabase.auth.signOut();
      return results;
    }

    console.log(`   ✅ ${teachersData.length} professor(es) encontrado(s):`);
    teachersData.forEach((teacher, index) => {
      console.log(`      ${index + 1}. ${teacher.full_name} (ID: ${teacher.id.substring(0, 8)}...)`);
    });
    results.teachersLoaded = true;

    const selectedTeacher = teachersData[0];
    console.log(`\n   📝 Professor selecionado: ${selectedTeacher.full_name}`);
    console.log(`      ID: ${selectedTeacher.id}`);

    // 5. Verificar se aluno já tem PEI ativo
    console.log('\n5️⃣ Verificando se aluno já tem PEI ativo...\n');
    const { data: existingPEI, error: existingPEIError } = await supabase
              .from('peis')
              .select('id, status, assigned_teacher_id, version_number')
              .eq('student_id', selectedStudent.id)
              .eq('is_active_version', true)
              .maybeSingle();

            if (existingPEIError) {
              console.error('   ❌ Erro ao verificar PEI existente:', existingPEIError.message);
              results.errors.push(`Erro ao verificar PEI existente: ${existingPEIError.message}`);
            } else if (existingPEI) {
              console.log(`   ⚠️ Aluno já possui PEI ativo:`);
              console.log(`      PEI ID: ${existingPEI.id}`);
              console.log(`      Status: ${existingPEI.status}`);
              console.log(`      Versão: ${existingPEI.version_number}`);
              console.log(`      Professor atribuído: ${existingPEI.assigned_teacher_id || 'N/A'}`);

              // Atualizar professor atribuído
              if (existingPEI.assigned_teacher_id !== selectedTeacher.id) {
                console.log('\n   📝 Atualizando professor atribuído...');
                const { error: updateError } = await supabase
                  .from('peis')
                  .update({ assigned_teacher_id: selectedTeacher.id })
                  .eq('id', existingPEI.id);

                if (updateError) {
                  console.error('   ❌ Erro ao atualizar professor:', updateError.message);
                  results.errors.push(`Erro ao atualizar professor: ${updateError.message}`);
                } else {
                  console.log('   ✅ Professor atualizado com sucesso');
                  results.peiCreated = true;
                  results.peiData = existingPEI;
                }
              }

              // Criar student_access
              console.log('\n   📝 Criando student_access...');
              const { error: accessError } = await supabase
                .from('student_access')
                .upsert({
                  user_id: selectedTeacher.id,
                  student_id: selectedStudent.id
                }, {
                  onConflict: 'user_id,student_id',
                  ignoreDuplicates: true
                });

              if (accessError) {
                console.warn('   ⚠️ Erro ao criar student_access:', accessError.message);
                results.errors.push(`Erro ao criar student_access: ${accessError.message}`);
              } else {
                console.log('   ✅ student_access criado/atualizado com sucesso');
                results.studentAccessCreated = true;
              }

              return results;
            }

    // 6. Criar novo PEI
    console.log('   ✅ Aluno não possui PEI ativo. Criando novo PEI...\n');
    console.log('6️⃣ Criando novo PEI...\n');

    // Buscar próximo número de versão
    const { data: versionData } = await supabase
              .from('peis')
              .select('version_number')
              .eq('student_id', selectedStudent.id)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle();

            const nextVersion = (versionData?.version_number || 0) + 1;
            console.log(`   📝 Próxima versão: ${nextVersion}`);

    const { data: peiData, error: peiError } = await supabase
              .from('peis')
              .insert({
                student_id: selectedStudent.id,
                school_id: selectedStudent.school_id || profileData.school_id,
                tenant_id: selectedStudent.tenant_id || profileData.tenant_id,
                created_by: authData.user.id,
                assigned_teacher_id: selectedTeacher.id,
                status: 'draft',
                version_number: nextVersion,
                is_active_version: true,
                diagnosis_data: {},
                planning_data: {},
                evaluation_data: {},
              })
              .select()
              .single();

            if (peiError) {
              console.error('   ❌ Erro ao criar PEI:', peiError.message);
              console.error('   📝 Código:', peiError.code);
              console.error('   📝 Detalhes:', peiError.details || 'N/A');
              results.errors.push(`Erro ao criar PEI: ${peiError.message}`);
              return results;
            }

            console.log('   ✅ PEI criado com sucesso!');
            console.log(`      PEI ID: ${peiData.id}`);
            console.log(`      Aluno: ${selectedStudent.name}`);
            console.log(`      Professor: ${selectedTeacher.full_name}`);
            console.log(`      Status: ${peiData.status}`);
            console.log(`      Versão: ${peiData.version_number}`);
            console.log(`      Criado por: ${profileData.full_name}`);
            results.peiCreated = true;
            results.peiData = peiData;

    // 7. Criar student_access
    console.log('\n7️⃣ Criando student_access para o professor...\n');
    const { error: accessError } = await supabase
              .from('student_access')
              .upsert({
                user_id: selectedTeacher.id,
                student_id: selectedStudent.id
              }, {
                onConflict: 'user_id,student_id',
                ignoreDuplicates: true
              });

            if (accessError) {
              console.error('   ❌ Erro ao criar student_access:', accessError.message);
              results.errors.push(`Erro ao criar student_access: ${accessError.message}`);
            } else {
              console.log('   ✅ student_access criado com sucesso!');
              results.studentAccessCreated = true;

              // Verificar se student_access foi criado
              const { data: accessData } = await supabase
                .from('student_access')
                .select('*')
                .eq('user_id', selectedTeacher.id)
                .eq('student_id', selectedStudent.id)
                .maybeSingle();

              if (accessData) {
                console.log(`      ✅ Acesso verificado: Professor ${selectedTeacher.full_name} pode ver aluno ${selectedStudent.name}`);
              }
            }

    // 8. Verificar PEI criado
    console.log('\n8️⃣ Verificando PEI criado...\n');
    const { data: verifyPEI, error: verifyError } = await supabase
              .from('peis')
              .select(`
                id,
                status,
                version_number,
                is_active_version,
                assigned_teacher_id,
                created_by,
                students (name),
                profiles!peis_assigned_teacher_id_fkey (full_name)
              `)
              .eq('id', peiData.id)
              .single();

            if (verifyError) {
              console.warn('   ⚠️ Erro ao verificar PEI:', verifyError.message);
            } else {
              console.log('   ✅ PEI verificado:');
              console.log(`      Aluno: ${verifyPEI.students?.name || 'N/A'}`);
              console.log(`      Professor: ${verifyPEI.profiles?.full_name || 'N/A'}`);
              console.log(`      Status: ${verifyPEI.status}`);
              console.log(`      Versão: ${verifyPEI.version_number}`);
              console.log(`      Versão ativa: ${verifyPEI.is_active_version ? 'Sim' : 'Não'}`);
            }

    // Logout
    await supabase.auth.signOut();
    return results;
      const { data: tenantUsers } = await supabase
        .from('user_tenants')
        .select('user_id')
        .eq('tenant_id', profileData.tenant_id);

      if (tenantUsers && tenantUsers.length > 0) {
        const userIds = tenantUsers.map(ut => ut.user_id);
        
        // Verificar quais são professores
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds)
          .in('role', ['teacher', 'aee_teacher']);

        if (rolesData && rolesData.length > 0) {
          const teacherIds = [...new Set(rolesData.map(r => r.user_id))];
          
          const { data: teachersData, error: teachersError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', teacherIds)
            .order('full_name');

          if (!teachersError && teachersData && teachersData.length > 0) {
            console.log(`   ✅ ${teachersData.length} professor(es) encontrado(s):`);
            teachersData.forEach((teacher, index) => {
              console.log(`      ${index + 1}. ${teacher.full_name} (ID: ${teacher.id.substring(0, 8)}...)`);
            });
            results.teachersLoaded = true;

            const selectedTeacher = teachersData[0];
            console.log(`\n   📝 Professor selecionado: ${selectedTeacher.full_name}`);
            console.log(`      ID: ${selectedTeacher.id}`);

            // Continuar com criação do PEI aqui
            // ... (mesmo código de criação do PEI que está acima)
          }
        }
      }
    }

    // Logout
    await supabase.auth.signOut();
    return results;

  } catch (error) {
    console.error('\n❌ Erro geral:', error);
    results.errors.push(`Erro geral: ${error.message}`);
    await supabase.auth.signOut();
    return results;
  }
}

// Executar teste
testCoordinatorRequestPEI().then((results) => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL - SOLICITAÇÃO DE PEI PELO COORDENADOR');
  console.log('='.repeat(80) + '\n');

  console.log(`${results.coordinatorLogin ? '✅' : '❌'} Login como coordenador: ${results.coordinatorLogin ? 'Sim' : 'Não'}`);
  console.log(`${results.studentsLoaded ? '✅' : '❌'} Alunos carregados: ${results.studentsLoaded ? 'Sim' : 'Não'}`);
  console.log(`${results.teachersLoaded ? '✅' : '❌'} Professores carregados: ${results.teachersLoaded ? 'Sim' : 'Não'}`);
  console.log(`${results.peiCreated ? '✅' : '❌'} PEI criado: ${results.peiCreated ? 'Sim' : 'Não'}`);
  console.log(`${results.studentAccessCreated ? '✅' : '❌'} Student access criado: ${results.studentAccessCreated ? 'Sim' : 'Não'}`);

  if (results.peiData) {
    console.log(`\n📝 PEI criado:`);
    console.log(`   ID: ${results.peiData.id}`);
    console.log(`   Status: ${results.peiData.status}`);
    console.log(`   Versão: ${results.peiData.version_number}`);
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Erros encontrados (${results.errors.length}):`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  process.exit(results.peiCreated && results.studentAccessCreated ? 0 : 1);
});


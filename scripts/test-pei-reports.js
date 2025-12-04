// Script para testar relatórios de PEIs
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

console.log('🔍 Testando relatórios de PEIs...\n');
console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

async function testPEIReports() {
  const results = {
    coordinatorLogin: false,
    profileLoaded: false,
    statsCalculated: false,
    peisLoaded: false,
    schoolInfoLoaded: false,
    networkInfoLoaded: false,
    reportDataValid: false,
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
    results.profileLoaded = true;

    // 3. Buscar informações da escola e rede
    console.log('\n3️⃣ Buscando informações da escola e rede...\n');
    let schoolInfo = null;
    let networkInfo = null;

    if (profileData.school_id) {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select(`
          school_name,
          school_address,
          school_phone,
          school_email,
          tenant_id,
          tenants(network_name, network_address, network_phone, network_email)
        `)
        .eq('id', profileData.school_id)
        .maybeSingle();

      if (schoolError) {
        console.warn('   ⚠️ Erro ao buscar dados da escola:', schoolError.message);
        results.errors.push(`Erro ao buscar escola: ${schoolError.message}`);
      } else if (schoolData) {
        schoolInfo = schoolData;
        networkInfo = schoolData.tenants;
        console.log('   ✅ Informações da escola carregadas:');
        console.log(`      Escola: ${schoolInfo.school_name || 'N/A'}`);
        console.log(`      Endereço: ${schoolInfo.school_address || 'N/A'}`);
        results.schoolInfoLoaded = true;
        if (networkInfo) {
          console.log(`      Rede: ${networkInfo.network_name || 'N/A'}`);
          results.networkInfoLoaded = true;
        }
      }
    } else if (profileData.tenant_id) {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('network_name, network_address, network_phone, network_email')
        .eq('id', profileData.tenant_id)
        .maybeSingle();

      if (tenantError) {
        console.warn('   ⚠️ Erro ao buscar dados da rede:', tenantError.message);
        results.errors.push(`Erro ao buscar rede: ${tenantError.message}`);
      } else if (tenantData) {
        networkInfo = tenantData;
        console.log('   ✅ Informações da rede carregadas:');
        console.log(`      Rede: ${networkInfo.network_name || 'N/A'}`);
        console.log(`      Endereço: ${networkInfo.network_address || 'N/A'}`);
        results.networkInfoLoaded = true;
      }
    }

    // 4. Buscar PEIs para o relatório
    console.log('\n4️⃣ Buscando PEIs para o relatório...\n');
    let peisQuery = supabase
      .from('peis')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        student_id,
        assigned_teacher_id,
        students(name)
      `)
      .eq('is_active_version', true);

    if (profileData.school_id) {
      peisQuery = peisQuery.eq('school_id', profileData.school_id);
    } else if (profileData.tenant_id) {
      peisQuery = peisQuery.eq('tenant_id', profileData.tenant_id);
    }

    const { data: peisData, error: peisError } = await peisQuery.order('created_at', { ascending: false });

    if (peisError) {
      console.error('   ❌ Erro ao buscar PEIs:', peisError.message);
      results.errors.push(`Erro ao buscar PEIs: ${peisError.message}`);
      return results;
    }

    let peis = peisData || [];

    // Buscar nomes dos professores separadamente
    if (peis.length > 0) {
      const teacherIds = [...new Set(peis.map(p => p.assigned_teacher_id).filter(Boolean))];
      
      if (teacherIds.length > 0) {
        const { data: teachersData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);

        const teacherMap = new Map();
        if (teachersData) {
          teachersData.forEach(t => teacherMap.set(t.id, t.full_name));
        }

        // Adicionar nome do professor aos PEIs
        peis = peis.map(pei => ({
          ...pei,
          teacher_name: pei.assigned_teacher_id ? teacherMap.get(pei.assigned_teacher_id) || 'N/A' : 'N/A'
        }));
      } else {
        peis = peis.map(pei => ({
          ...pei,
          teacher_name: 'N/A'
        }));
      }
    }

    console.log(`   ✅ ${peis.length} PEI(s) encontrado(s) para o relatório`);
    results.peisLoaded = true;

    if (peis.length > 0) {
      console.log(`   📝 Primeiros 5 PEIs:`);
      peis.slice(0, 5).forEach((pei, index) => {
        const studentName = pei.students?.name || 'N/A';
        const teacherName = pei.teacher_name || 'N/A';
        console.log(`      ${index + 1}. ${studentName} - ${teacherName} (${pei.status})`);
      });
    }

    // 5. Calcular estatísticas
    console.log('\n5️⃣ Calculando estatísticas para o relatório...\n');
    
    // Buscar alunos para calcular total
    let studentsQuery = supabase
      .from('students')
      .select('id')
      .eq('is_active', true);

    if (profileData.school_id) {
      studentsQuery = studentsQuery.eq('school_id', profileData.school_id);
    } else if (profileData.tenant_id) {
      studentsQuery = studentsQuery.eq('tenant_id', profileData.tenant_id);
    }

    const { data: studentsData } = await studentsQuery;
    const totalStudents = studentsData?.length || 0;

    // Calcular estatísticas de PEIs
    const stats = {
      students: totalStudents,
      total: peis.length,
      peisDraft: peis.filter(p => p.status === 'draft').length,
      peisPending: peis.filter(p => p.status === 'pending' || p.status === 'pending_validation').length,
      peisValidated: peis.filter(p => p.status === 'validated').length,
      peisPendingFamily: peis.filter(p => p.status === 'pending_family').length,
      peisApproved: peis.filter(p => p.status === 'approved').length,
      peisReturned: peis.filter(p => p.status === 'returned').length,
      withComments: 0 // Será calculado abaixo
    };

    // Contar PEIs com comentários
    if (peis.length > 0) {
      const peiIds = peis.map(p => p.id);
      const { data: commentsData } = await supabase
        .from('pei_comments')
        .select('pei_id')
        .in('pei_id', peiIds);
      
      const peisWithComments = new Set(commentsData?.map(c => c.pei_id) || []);
      stats.withComments = peisWithComments.size;
    }

    console.log('   ✅ Estatísticas calculadas:');
    console.log(`      Total de Alunos: ${stats.students}`);
    console.log(`      Total de PEIs: ${stats.total}`);
    console.log(`      PEIs em Rascunho: ${stats.peisDraft}`);
    console.log(`      PEIs Pendentes: ${stats.peisPending}`);
    console.log(`      PEIs Validados: ${stats.peisValidated}`);
    console.log(`      PEIs Aguardando Família: ${stats.peisPendingFamily}`);
    console.log(`      PEIs Aprovados: ${stats.peisApproved}`);
    console.log(`      PEIs Devolvidos: ${stats.peisReturned}`);
    console.log(`      PEIs com Comentários: ${stats.withComments}`);
    results.statsCalculated = true;

    // 6. Validar dados do relatório
    console.log('\n6️⃣ Validando dados do relatório...\n');
    const reportData = {
      profile: profileData,
      schoolInfo: schoolInfo,
      networkInfo: networkInfo,
      stats: stats,
      peis: peis.map(pei => ({
        id: pei.id,
        student_name: pei.students?.name || 'N/A',
        teacher_name: pei.teacher_name || 'N/A',
        status: pei.status,
        created_at: pei.created_at
      })),
      generatedAt: new Date().toISOString()
    };

    // Validações
    const validations = {
      hasProfile: !!reportData.profile,
      hasStats: !!reportData.stats,
      hasPeis: reportData.peis.length > 0,
      hasNetworkOrSchool: !!(reportData.networkInfo || reportData.schoolInfo),
      statsConsistency: stats.total === (stats.peisDraft + stats.peisPending + stats.peisValidated + 
                                         stats.peisPendingFamily + stats.peisApproved + stats.peisReturned)
    };

    console.log('   ✅ Validações:');
    console.log(`      Perfil presente: ${validations.hasProfile ? '✅' : '❌'}`);
    console.log(`      Estatísticas presentes: ${validations.hasStats ? '✅' : '❌'}`);
    console.log(`      PEIs carregados: ${validations.hasPeis ? '✅' : '❌'}`);
    console.log(`      Informações institucionais: ${validations.hasNetworkOrSchool ? '✅' : '❌'}`);
    console.log(`      Consistência de estatísticas: ${validations.statsConsistency ? '✅' : '❌'}`);

    if (Object.values(validations).every(v => v === true)) {
      results.reportDataValid = true;
      console.log('\n   ✅ Todos os dados do relatório estão válidos!');
    } else {
      const failedValidations = Object.entries(validations)
        .filter(([_, valid]) => !valid)
        .map(([key, _]) => key);
      results.errors.push(`Validações falharam: ${failedValidations.join(', ')}`);
    }

    // 7. Testar estrutura de dados para impressão
    console.log('\n7️⃣ Testando estrutura de dados para impressão...\n');
    
    const printData = {
      header: {
        title: 'RELATÓRIO DE PEIs - PLANOS EDUCACIONAIS INDIVIDUALIZADOS',
        networkName: networkInfo?.network_name || 'Rede de Ensino',
        schoolName: schoolInfo?.school_name || null,
        coordinatorName: profileData.full_name,
        generatedAt: new Date().toLocaleString('pt-BR')
      },
      stats: stats,
      peis: reportData.peis.slice(0, 10), // Primeiros 10 para demonstração
      extendedStats: null // Seria calculado com dados adicionais
    };

    console.log('   ✅ Estrutura de impressão criada:');
    console.log(`      Título: ${printData.header.title}`);
    console.log(`      Rede/Escola: ${printData.header.schoolName || printData.header.networkName}`);
    console.log(`      Coordenador: ${printData.header.coordinatorName}`);
    console.log(`      Data/Hora: ${printData.header.generatedAt}`);
    console.log(`      PEIs no relatório: ${printData.peis.length}`);

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
testPEIReports().then((results) => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL - TESTE DE RELATÓRIOS DE PEIs');
  console.log('='.repeat(80) + '\n');

  console.log(`${results.coordinatorLogin ? '✅' : '❌'} Login como coordenador: ${results.coordinatorLogin ? 'Sim' : 'Não'}`);
  console.log(`${results.profileLoaded ? '✅' : '❌'} Perfil carregado: ${results.profileLoaded ? 'Sim' : 'Não'}`);
  console.log(`${results.schoolInfoLoaded ? '✅' : '❌'} Informações da escola: ${results.schoolInfoLoaded ? 'Sim' : 'Não'}`);
  console.log(`${results.networkInfoLoaded ? '✅' : '❌'} Informações da rede: ${results.networkInfoLoaded ? 'Sim' : 'Não'}`);
  console.log(`${results.peisLoaded ? '✅' : '❌'} PEIs carregados: ${results.peisLoaded ? 'Sim' : 'Não'}`);
  console.log(`${results.statsCalculated ? '✅' : '❌'} Estatísticas calculadas: ${results.statsCalculated ? 'Sim' : 'Não'}`);
  console.log(`${results.reportDataValid ? '✅' : '❌'} Dados do relatório válidos: ${results.reportDataValid ? 'Sim' : 'Não'}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Erros encontrados (${results.errors.length}):`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  const allTestsPassed = Object.values(results).every((value, key) => {
    if (key === 'errors') return true; // Ignorar errors no check
    return value === true;
  });

  process.exit(allTestsPassed && results.errors.length === 0 ? 0 : 1);
});


// Script para testar comentários de PEI com vários perfis
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

// Lista de perfis para testar
const testProfiles = [
  { email: 'coordenador@teste.com', password: 'Teste123!', role: 'coordenador', name: 'Maria Coordenadora' },
  { email: 'professor@teste.com', password: 'Teste123!', role: 'professor', name: 'João Professor' },
  { email: 'especialista@teste.com', password: 'Teste123!', role: 'especialista', name: 'Dr. Pedro Especialista' },
  { email: 'gestor.escolar@teste.com', password: 'Teste123!', role: 'gestor_escolar', name: 'Carlos Gestor Escolar' },
  { email: 'professor.aee@teste.com', password: 'Teste123!', role: 'professor_aee', name: 'Ana Professora AEE' },
  { email: 'diretor.escola@teste.com', password: 'Teste123!', role: 'diretor', name: 'Diretor da Escola' }
];

let testPeiId = null;

async function getOrCreateTestPEI() {
  console.log('\n🔍 Buscando PEI existente para testes...\n');
  
  // Fazer login temporário como coordenador para buscar PEI
  await supabase.auth.signOut();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'coordenador@teste.com',
    password: 'Teste123!'
  });

  if (authError) {
    console.error('❌ Erro ao fazer login para buscar PEI:', authError.message);
    return null;
  }

  // Buscar um PEI existente
  const { data: peis, error: peisError } = await supabase
    .from('peis')
    .select('id, student_id, students(name)')
    .eq('is_active_version', true)
    .limit(1)
    .maybeSingle();

  if (peisError || !peis) {
    console.error('❌ Erro ao buscar PEI:', peisError?.message || 'Nenhum PEI encontrado');
    console.log('   Criando um novo PEI para teste...');
    
    // Buscar um aluno
    const { data: students } = await supabase
      .from('students')
      .select('id, name, school_id, tenant_id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!students) {
      console.error('❌ Nenhum aluno encontrado para criar PEI');
      return null;
    }

    // Criar PEI
    const { data: newPei, error: createError } = await supabase
      .from('peis')
      .insert({
        student_id: students.id,
        school_id: students.school_id,
        tenant_id: students.tenant_id,
        created_by: authData.user.id,
        status: 'draft',
        diagnosis_data: { test: true },
        planning_data: {},
        evaluation_data: {}
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar PEI:', createError.message);
      return null;
    }

    console.log(`✅ PEI criado para testes: ${newPei.id} (Aluno: ${students.name})`);
    await supabase.auth.signOut();
    return newPei.id;
  }

  console.log(`✅ PEI encontrado para testes: ${peis.id} (Aluno: ${peis.students?.name || 'N/A'})`);
  await supabase.auth.signOut();
  return peis.id;
}

async function testCommentForProfile(profile, peiId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTANDO COMENTÁRIOS COMO ${profile.role.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);

  const results = {
    profile: profile,
    success: false,
    commentId: null,
    errors: [],
    canViewComments: false,
    commentCount: 0
  };

  try {
    // 1. Fazer login
    console.log(`1️⃣ Fazendo login como ${profile.role}...`);
    await supabase.auth.signOut();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: profile.password
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
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, tenant_id, school_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error(`❌ Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      results.errors.push(`Erro ao buscar perfil: ${profileError?.message || 'Perfil não encontrado'}`);
      return results;
    }

    console.log(`✅ Perfil encontrado: ${profileData.full_name}\n`);

    // 3. Verificar se pode visualizar comentários existentes
    console.log(`3️⃣ Verificando se pode visualizar comentários existentes...`);
    // Buscar comentários sem embed para evitar problemas de relacionamento
    const { data: existingComments, error: viewError } = await supabase
      .from('pei_comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        pei_id
      `)
      .eq('pei_id', peiId)
      .order('created_at', { ascending: false });

    if (viewError) {
      console.error(`❌ Erro ao visualizar comentários: ${viewError.message}`);
      console.error(`   📝 Código: ${viewError.code}`);
      results.errors.push(`Erro ao visualizar comentários: ${viewError.message}`);
      // Continuar mesmo se não conseguir visualizar
    } else {
      const commentCount = existingComments?.length || 0;
      console.log(`✅ Pode visualizar comentários! Total de comentários: ${commentCount}`);
      if (commentCount > 0) {
        console.log(`   Últimos comentários:`);
        // Buscar nomes dos autores separadamente
        for (let i = 0; i < Math.min(3, existingComments.length); i++) {
          const comment = existingComments[i];
          let author = 'Anônimo';
          if (comment.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', comment.user_id)
              .maybeSingle();
            if (profile) {
              author = profile.full_name;
            }
          }
          const date = comment.created_at ? new Date(comment.created_at).toLocaleString('pt-BR') : 'N/A';
          const text = comment.comment_text || '';
          console.log(`   ${i + 1}. [${author}] ${text.substring(0, 50)}... (${date})`);
        }
      }
      results.canViewComments = true;
      results.commentCount = commentCount;
    }

    // 4. Criar comentário
    console.log(`\n4️⃣ Criando comentário...`);
    const commentContent = `[${profile.role.toUpperCase()}] Comentário de teste criado por ${profile.name} em ${new Date().toLocaleString('pt-BR')}`;

    const { data: commentData, error: commentError } = await supabase
      .from('pei_comments')
      .insert({
        pei_id: peiId,
        user_id: authData.user.id,
        comment_text: commentContent
      })
      .select()
      .single();

    if (commentError) {
      console.error(`   ❌ Erro ao criar comentário: ${commentError.message}`);
      console.error(`   📝 Código: ${commentError.code}`);
      if (commentError.details) {
        console.error(`   📝 Detalhes: ${commentError.details}`);
      }
      results.errors.push(`Erro ao criar comentário: ${commentError.message}`);
      return results;
    }

    console.log(`   ✅ Comentário criado com sucesso!`);
    console.log(`      Comment ID: ${commentData.id}`);
    console.log(`      Conteúdo: ${commentContent.substring(0, 60)}...`);
    results.commentId = commentData.id;
    results.success = true;

    // 5. Verificar comentário criado
    console.log(`\n5️⃣ Verificando comentário criado...`);
    const { data: createdComment, error: verifyError } = await supabase
      .from('pei_comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        pei_id
      `)
      .eq('id', commentData.id)
      .maybeSingle();
    
    // Buscar nome do autor separadamente
    let authorName = 'N/A';
    if (createdComment?.user_id) {
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', createdComment.user_id)
        .maybeSingle();
      if (authorProfile) {
        authorName = authorProfile.full_name;
      }
    }

    if (verifyError || !createdComment) {
      console.error(`   ❌ Erro ao verificar comentário: ${verifyError?.message || 'Comentário não encontrado'}`);
      results.errors.push(`Erro ao verificar comentário: ${verifyError?.message || 'Comentário não encontrado'}`);
      return results;
    }

    console.log(`   ✅ Comentário verificado:`);
    console.log(`      ID: ${createdComment.id}`);
    console.log(`      PEI ID: ${createdComment.pei_id}`);
    console.log(`      Autor: ${authorName}`);
    console.log(`      Conteúdo: ${(createdComment.comment_text || '').substring(0, 80)}...`);
    console.log(`      Criado em: ${createdComment.created_at ? new Date(createdComment.created_at).toLocaleString('pt-BR') : 'N/A'}`);

    // 6. Listar todos os comentários após criar
    console.log(`\n6️⃣ Listando todos os comentários do PEI...`);
    const { data: allComments, error: listError } = await supabase
      .from('pei_comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id
      `)
      .eq('pei_id', peiId)
      .order('created_at', { ascending: false });

    if (listError) {
      console.warn(`   ⚠️ Erro ao listar comentários: ${listError.message}`);
    } else {
      const totalComments = allComments?.length || 0;
      console.log(`   ✅ Total de comentários no PEI: ${totalComments}`);
      if (totalComments > 0) {
        console.log(`   Comentários (do mais recente para o mais antigo):`);
        for (let i = 0; i < Math.min(5, allComments.length); i++) {
          const comment = allComments[i];
          let author = 'Anônimo';
          if (comment.user_id) {
            const { data: authorProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', comment.user_id)
              .maybeSingle();
            if (authorProfile) {
              author = authorProfile.full_name;
            }
          }
          const date = comment.created_at ? new Date(comment.created_at).toLocaleTimeString('pt-BR') : 'N/A';
          const text = comment.comment_text || '';
          const preview = text.substring(0, 40).replace(/\n/g, ' ');
          console.log(`   ${i + 1}. [${author}] ${preview}... (${date})`);
        }
      }
    }

    // 7. Fazer logout
    await supabase.auth.signOut();
    console.log(`\n🚪 Logout realizado\n`);

    // Aguardar um pouco antes do próximo teste
    await new Promise(resolve => setTimeout(resolve, 1000));

    return results;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro geral: ${errorMessage}`);
    results.errors.push(`Erro geral: ${errorMessage}`);
    return results;
  }
}

async function testPEIComments() {
  console.log('🔍 Testando comentários de PEI com vários perfis...\n');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

  // Obter ou criar PEI para teste
  testPeiId = await getOrCreateTestPEI();
  
  if (!testPeiId) {
    console.error('❌ Não foi possível obter ou criar um PEI para teste');
    process.exit(1);
  }

  console.log(`✅ Usando PEI ID: ${testPeiId}\n`);

  const allResults = [];

  // Testar comentários para cada perfil
  for (const profile of testProfiles) {
    const result = await testCommentForProfile(profile, testPeiId);
    allResults.push(result);
  }

  // Relatório final
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 RELATÓRIO FINAL DOS TESTES DE COMENTÁRIOS');
  console.log(`${'='.repeat(80)}\n`);

  let successCount = 0;
  let failureCount = 0;
  let canViewCount = 0;

  allResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const viewStatus = result.canViewComments ? '👁️' : '🚫';
    console.log(`${status} ${viewStatus} ${result.profile.role.toUpperCase()}: ${result.profile.email}`);
    if (result.success) {
      console.log(`   Comment ID: ${result.commentId}`);
      console.log(`   Comentários visíveis: ${result.commentCount}`);
      successCount++;
      if (result.canViewComments) {
        canViewCount++;
      }
    } else {
      console.log(`   Erros:`);
      result.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
      failureCount++;
    }
    console.log('');
  });

  console.log(`✅ Sucessos na criação: ${successCount}`);
  console.log(`👁️ Podem visualizar comentários: ${canViewCount}`);
  console.log(`❌ Falhas: ${failureCount}`);
  console.log(`📝 Total de perfis testados: ${allResults.length}`);
  console.log(`📝 PEI usado para testes: ${testPeiId}\n`);

  console.log(`${'='.repeat(80)}\n`);

  // Retornar código de saída apropriado
  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testPEIComments().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});


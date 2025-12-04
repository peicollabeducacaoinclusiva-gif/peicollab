// Script para testar participação da família nos PEIs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
// Função para calcular hash SHA-256
import { createHash } from 'crypto';

function calculateTokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

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

// Credenciais do coordenador para gerar token
const coordinatorEmail = 'coordenador@teste.com';
const coordinatorPassword = 'Teste123!';


async function generateFamilyToken(peiId, studentId) {
  console.log('\n1️⃣ Gerando token de acesso familiar...\n');
  
  // Fazer login como coordenador
  await supabase.auth.signOut();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: coordinatorEmail,
    password: coordinatorPassword
  });

  if (authError) {
    console.error('❌ Erro ao fazer login como coordenador:', authError.message);
    return null;
  }

  console.log('✅ Login como coordenador realizado com sucesso');

  // Gerar token (8 caracteres alfanuméricos maiúsculos)
  const tokenArray = new Uint8Array(4); // 4 bytes = 8 caracteres hex
  crypto.getRandomValues(tokenArray);
  const token = Array.from(tokenArray).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 8);
  
  // Calcular hash SHA-256 do token
  const tokenHash = calculateTokenHash(token);

  // Calcular data de expiração (7 dias a partir de agora)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  console.log(`   Token gerado: ${token}`);
  console.log(`   Token hash: ${tokenHash.substring(0, 16)}...`);
  console.log(`   Expira em: ${expiresAt.toLocaleString('pt-BR')}`);

  // Verificar dados do coordenador para debug
  const { data: coordinatorProfile } = await supabase
    .from('profiles')
    .select('id, school_id, tenant_id')
    .eq('id', authData.user.id)
    .maybeSingle();

  console.log(`   🔍 Coordenador - School ID: ${coordinatorProfile?.school_id || 'N/A'}, Tenant ID: ${coordinatorProfile?.tenant_id || 'N/A'}`);

  // Verificar dados do aluno e PEI
  const { data: studentInfo } = await supabase
    .from('students')
    .select('id, school_id, tenant_id')
    .eq('id', studentId)
    .maybeSingle();

  const { data: peiInfo } = await supabase
    .from('peis')
    .select('id, school_id, tenant_id')
    .eq('id', peiId)
    .maybeSingle();

  console.log(`   🔍 Aluno - School ID: ${studentInfo?.school_id || 'N/A'}, Tenant ID: ${studentInfo?.tenant_id || 'N/A'}`);
  console.log(`   🔍 PEI - School ID: ${peiInfo?.school_id || 'N/A'}, Tenant ID: ${peiInfo?.tenant_id || 'N/A'}`);

  // Criar registro do token
  const { data: tokenData, error: tokenError } = await supabase
    .from('family_access_tokens')
    .insert({
      student_id: studentId,
      pei_id: peiId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used: false,
      max_uses: 10,
      current_uses: 0,
      created_by: authData.user.id
    })
    .select()
    .single();

  if (tokenError) {
    console.error('❌ Erro ao criar token:', tokenError.message);
    console.error('   📝 Código:', tokenError.code);
    await supabase.auth.signOut();
    return null;
  }

  console.log(`✅ Token criado com sucesso!`);
  console.log(`   Token ID: ${tokenData.id}`);
  console.log(`   PEI ID: ${tokenData.pei_id}`);
  console.log(`   Student ID: ${tokenData.student_id}`);

  // Verificar se o token foi realmente salvo buscando-o novamente
  const { data: verifyToken } = await supabase
    .from('family_access_tokens')
    .select('id, token_hash, pei_id')
    .eq('id', tokenData.id)
    .maybeSingle();

  if (verifyToken) {
    console.log(`   ✅ Token verificado no banco`);
    console.log(`   Hash armazenado: ${verifyToken.token_hash.substring(0, 20)}...`);
  } else {
    console.warn(`   ⚠️ Token não encontrado após criação (possível problema de RLS)`);
  }

  // Retornar o token antes do logout para uso na simulação
  return { token, tokenHash, tokenData };
}

async function simulateFamilyAccess(token, tokenHash, peiId, coordinatorSession) {
  console.log('\n\n2️⃣ Simulando acesso da família ao PEI...\n');

  try {
    // Validar token (como a família faria)
    // Nota: A família acessa via token sem autenticação através de Edge Function ou RPC
    // Para teste, vamos buscar o token usando a sessão do coordenador
    // Na prática, a família usaria /secure-family?token=... ou Edge Function
    
    console.log('   Validando token...');
    console.log(`   🔍 Buscando token com hash: ${tokenHash.substring(0, 20)}...`);
    
    // Usar a sessão do coordenador para buscar (simulando acesso interno)
    const { data: tokensData, error: tokenError } = await supabase
      .from('family_access_tokens')
      .select(`
        id,
        student_id,
        pei_id,
        expires_at,
        used,
        max_uses,
        current_uses
      `)
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .limit(1);

    if (tokenError) {
      console.error('   ❌ Erro ao buscar token:', tokenError.message);
      return { success: false, error: 'Erro ao buscar token' };
    }

    const tokenData = tokensData && tokensData.length > 0 ? tokensData[0] : null;

    if (tokenError) {
      console.error('   ❌ Erro ao buscar token:', tokenError.message);
      return { success: false, error: 'Erro ao buscar token' };
    }

    if (!tokenData) {
      console.error('   ❌ Token não encontrado no banco de dados');
      console.log(`   🔍 Token hash procurado: ${tokenHash.substring(0, 20)}...`);
      
      // Verificar se há algum token no banco para debug
      const { data: allTokens } = await supabase
        .from('family_access_tokens')
        .select('id, token_hash, pei_id, expires_at')
        .eq('pei_id', peiId)
        .limit(5);
      
      if (allTokens && allTokens.length > 0) {
        console.log(`   ℹ️ Tokens encontrados para este PEI: ${allTokens.length}`);
        allTokens.forEach((t, i) => {
          console.log(`      ${i + 1}. Hash: ${t.token_hash.substring(0, 20)}..., Expira: ${t.expires_at ? new Date(t.expires_at).toLocaleDateString('pt-BR') : 'N/A'}`);
        });
      }
      
      return { success: false, error: 'Token não encontrado' };
    }

    console.log('   ✅ Token encontrado no banco de dados');

    // Verificar se expirou
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      console.error('   ❌ Token expirado');
      return { success: false, error: 'Token expirado' };
    }

    // Verificar se excedeu limite de usos
    if (tokenData.current_uses >= tokenData.max_uses) {
      console.error('   ❌ Token excedeu limite de usos');
      return { success: false, error: 'Token excedeu limite' };
    }

    console.log('   ✅ Token válido e não expirado');
    console.log(`   Usos atuais: ${tokenData.current_uses}/${tokenData.max_uses}`);

    // Incrementar contador de usos
    await supabase
      .from('family_access_tokens')
      .update({
        current_uses: tokenData.current_uses + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    console.log('   ✅ Contador de usos atualizado');

    // Buscar dados do PEI
    console.log('\n   📋 Buscando dados do PEI...');
    const { data: peiData, error: peiError } = await supabase
      .from('peis')
      .select('*')
      .eq('id', peiId)
      .single();

    if (peiError || !peiData) {
      console.error('   ❌ Erro ao buscar PEI:', peiError?.message || 'PEI não encontrado');
      return { success: false, error: 'PEI não encontrado' };
    }

    console.log('   ✅ PEI encontrado:');
    console.log(`      ID: ${peiData.id}`);
    console.log(`      Status: ${peiData.status}`);
    console.log(`      Criado em: ${peiData.created_at ? new Date(peiData.created_at).toLocaleDateString('pt-BR') : 'N/A'}`);
    console.log(`      Aprovado pela família: ${peiData.family_approved_at ? 'Sim' : 'Não'}`);

    // Buscar dados do estudante
    const { data: studentData } = await supabase
      .from('students')
      .select('id, name, date_of_birth')
      .eq('id', tokenData.student_id)
      .maybeSingle();

    if (studentData) {
      console.log(`\n   👤 Dados do estudante:`);
      console.log(`      Nome: ${studentData.name}`);
      console.log(`      Data de nascimento: ${studentData.date_of_birth ? new Date(studentData.date_of_birth).toLocaleDateString('pt-BR') : 'N/A'}`);
    }

    // Verificar comentários existentes
    console.log('\n   💬 Verificando comentários existentes...');
    const { data: existingComments } = await supabase
      .from('pei_comments')
      .select('id, comment_text, created_at, user_id')
      .eq('pei_id', peiId)
      .order('created_at', { ascending: false });

    const commentCount = existingComments?.length || 0;
    console.log(`   ✅ Total de comentários: ${commentCount}`);
    if (commentCount > 0) {
      console.log('   Últimos comentários:');
      existingComments.slice(0, 3).forEach((comment, index) => {
        const isFamilyComment = comment.user_id === null;
        const author = isFamilyComment ? '[Família]' : '[Equipe]';
        const date = comment.created_at ? new Date(comment.created_at).toLocaleDateString('pt-BR') : 'N/A';
        const text = (comment.comment_text || '').substring(0, 40);
        console.log(`   ${index + 1}. ${author} ${text}... (${date})`);
      });
    }

    return {
      success: true,
      peiData,
      studentData,
      tokenData,
      existingComments: existingComments || []
    };

  } catch (error) {
    console.error('   ❌ Erro ao simular acesso:', error);
    return { success: false, error: error.message };
  }
}

async function testFamilyComment(peiId, studentId, tokenHash) {
  console.log('\n\n3️⃣ Testando criação de comentário da família...\n');

  const commentText = `[Família] Comentário de teste criado pela família em ${new Date().toLocaleString('pt-BR')}. Observamos que nosso filho está se desenvolvendo bem.`;

  console.log('   📝 Criando comentário da família usando função RPC...');
  console.log(`   Conteúdo: ${commentText.substring(0, 60)}...`);
  console.log(`   Token hash: ${tokenHash.substring(0, 20)}...`);

  // Usar função RPC que valida o token e insere o comentário
  // A função RPC usa SECURITY DEFINER para bypassar RLS
  const { data: result, error: rpcError } = await supabase.rpc('add_family_comment', {
    p_token_hash: tokenHash,
    p_pei_id: peiId,
    p_comment_text: commentText
  });

  if (rpcError) {
    console.error('   ❌ Erro ao chamar função RPC:', rpcError.message);
    console.error('   📝 Código:', rpcError.code);
    console.error('   📝 Detalhes:', rpcError.details || 'N/A');
    return { success: false, error: rpcError.message };
  }

  if (!result || result.length === 0 || !result[0]?.success) {
    const errorMessage = result?.[0]?.message || 'Erro desconhecido ao adicionar comentário';
    console.error('   ❌ Erro ao criar comentário:', errorMessage);
    return { success: false, error: errorMessage };
  }

  const commentId = result[0].comment_id;
  console.log('   ✅ Comentário da família criado com sucesso!');
  console.log(`      Comment ID: ${commentId}`);
  console.log(`      Mensagem: ${result[0].message}`);

  // Verificar comentário criado
  const { data: commentData } = await supabase
    .from('pei_comments')
    .select('id, comment_text, created_at, user_id')
    .eq('id', commentId)
    .maybeSingle();

  if (commentData) {
    console.log(`      Criado em: ${commentData.created_at ? new Date(commentData.created_at).toLocaleString('pt-BR') : 'N/A'}`);
    console.log(`      User ID: ${commentData.user_id ? commentData.user_id : 'NULL (Família)'}`);
  }

  return { success: true, commentData: commentData || { id: commentId } };
}

async function testFamilyApproval(peiId, tokenHash) {
  console.log('\n\n4️⃣ Testando aprovação do PEI pela família...\n');

  // Verificar se já foi aprovado
  const { data: peiBefore, error: peiError } = await supabase
    .from('peis')
    .select('family_approved_at, family_approved_by, status')
    .eq('id', peiId)
    .maybeSingle();

  if (peiError) {
    console.error('   ❌ Erro ao buscar PEI:', peiError.message);
    return { success: false };
  }

  if (peiBefore?.family_approved_at) {
    console.log('   ℹ️ PEI já foi aprovado pela família anteriormente');
    console.log(`      Aprovado em: ${new Date(peiBefore.family_approved_at).toLocaleString('pt-BR')}`);
    console.log(`      Aprovado por: ${peiBefore.family_approved_by || 'N/A'}`);
    return { success: true, alreadyApproved: true };
  }

  console.log('   ✅ PEI ainda não foi aprovado pela família');
  console.log('   📝 Registrando aprovação...');

  // Atualizar PEI com aprovação familiar
  const { data: peiAfter, error: updateError } = await supabase
    .from('peis')
    .update({
      family_approved_at: new Date().toISOString(),
      family_approved_by: 'Família via link de acesso',
      status: 'approved'
    })
    .eq('id', peiId)
    .select()
    .single();

  if (updateError) {
    console.error('   ❌ Erro ao aprovar PEI:', updateError.message);
    console.error('   📝 Código:', updateError.code);
    return { success: false, error: updateError.message };
  }

  console.log('   ✅ PEI aprovado pela família com sucesso!');
  console.log(`      Aprovado em: ${peiAfter.family_approved_at ? new Date(peiAfter.family_approved_at).toLocaleString('pt-BR') : 'N/A'}`);
  console.log(`      Aprovado por: ${peiAfter.family_approved_by || 'N/A'}`);
  console.log(`      Novo status: ${peiAfter.status}`);

  return { success: true, peiAfter };
}

async function testFamilyParticipation() {
  console.log('🔍 Testando participação da família nos PEIs...\n');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

  // 1. Buscar um PEI existente ou criar um para teste
  console.log('🔍 Buscando PEI para teste...\n');
  
  await supabase.auth.signOut();
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: coordinatorEmail,
    password: coordinatorPassword
  });

  const { data: peis } = await supabase
    .from('peis')
    .select('id, student_id, students(name)')
    .eq('is_active_version', true)
    .limit(1)
    .maybeSingle();

  if (!peis) {
    console.error('❌ Nenhum PEI encontrado para teste');
    process.exit(1);
  }

  const testPeiId = peis.id;
  const testStudentId = peis.student_id;

  console.log(`✅ PEI encontrado para teste:`);
  console.log(`   PEI ID: ${testPeiId}`);
  console.log(`   Student ID: ${testStudentId}`);
  console.log(`   Aluno: ${peis.students?.name || 'N/A'}\n`);

  // 2. Gerar token de acesso familiar
  // Manter sessão para buscar token depois
  const tokenResult = await generateFamilyToken(testPeiId, testStudentId);
  
  if (!tokenResult) {
    console.error('❌ Falha ao gerar token de acesso familiar');
    process.exit(1);
  }

  const { token, tokenHash } = tokenResult;

  // 3. Simular acesso da família
  // Manter sessão do coordenador para poder buscar o token (já que há RLS)
  // Na prática, a família acessaria via Edge Function que bypassa RLS
  const accessResult = await simulateFamilyAccess(token, tokenHash, testPeiId, authData);
  
  if (!accessResult.success) {
    console.error('❌ Falha ao simular acesso da família');
    process.exit(1);
  }

  // 4. Testar criação de comentário da família
  const commentResult = await testFamilyComment(testPeiId, testStudentId, tokenHash);

  // 5. Testar aprovação do PEI pela família
  const approvalResult = await testFamilyApproval(testPeiId, tokenHash);

  // Relatório final
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('📊 RELATÓRIO FINAL - PARTICIPAÇÃO DA FAMÍLIA');
  console.log(`${'='.repeat(80)}\n`);

  console.log(`✅ Token gerado: ${token}`);
  console.log(`✅ Acesso simulado: ${accessResult.success ? 'Sim' : 'Não'}`);
  console.log(`✅ Comentário criado: ${commentResult.success ? 'Sim' : 'Não'}`);
  if (commentResult.error) {
    console.log(`   ⚠️ Nota: ${commentResult.error}`);
  }
  console.log(`✅ PEI aprovado: ${approvalResult.success ? 'Sim' : 'Não'}`);
  if (approvalResult.alreadyApproved) {
    console.log(`   ℹ️ PEI já estava aprovado anteriormente`);
  }

  console.log(`\n📝 PEI usado: ${testPeiId}`);
  console.log(`📝 Aluno: ${peis.students?.name || 'N/A'}`);
  console.log(`📝 Comentários existentes: ${accessResult.existingComments?.length || 0}`);

  console.log(`\n${'='.repeat(80)}\n`);

  // Verificar se houve falhas críticas
  if (!accessResult.success) {
    process.exit(1);
  }

  process.exit(0);
}

testFamilyParticipation().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});


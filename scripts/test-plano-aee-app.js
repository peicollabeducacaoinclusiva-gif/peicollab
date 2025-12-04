// Script para testar o App Plano de AEE
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

console.log('🔍 Testando App Plano de AEE...\n');
console.log(`📡 Conectando ao Supabase: ${supabaseUrl}\n`);

// Lista de funcionalidades para testar por role
const testScenarios = [
  {
    name: 'AEE Teacher',
    role: 'aee_teacher',
    email: 'professor.aee@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'create_plan', 'edit_plan', 'co_teaching', 'materials', 'schedules', 'activities', 'communication']
  },
  {
    name: 'Coordinator',
    role: 'coordinator',
    email: 'coordenador@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'view_plans', 'co_teaching', 'schedules']
  },
  {
    name: 'Regular Teacher',
    role: 'teacher',
    email: 'professor@teste.com',
    password: 'Teste123!',
    features: ['dashboard', 'co_teaching', 'communication']
  }
];

async function testPlanoAEEApp() {
  for (const scenario of testScenarios) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testando como: ${scenario.name} (${scenario.role})`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // 1. Login
      console.log('1️⃣ Testando login...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: scenario.email,
        password: scenario.password
      });

      if (authError) {
        console.log(`❌ Erro no login: ${authError.message}`);
        continue;
      }

      if (!authData.user) {
        console.log('❌ Login falhou: usuário não retornado');
        continue;
      }

      console.log(`✅ Login bem-sucedido: ${authData.user.email}`);

      // 2. Buscar perfil do usuário
      console.log('\n2️⃣ Buscando perfil do usuário...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, school_id, tenant_id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.log(`❌ Erro ao buscar perfil: ${profileError.message}`);
        await supabase.auth.signOut();
        continue;
      }

      if (!profile) {
        console.log('❌ Perfil não encontrado');
        await supabase.auth.signOut();
        continue;
      }

      console.log(`✅ Perfil encontrado: ${profile.full_name}`);

      // 3. Buscar roles do usuário
      console.log('\n3️⃣ Verificando roles do usuário...');
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authData.user.id);

      if (rolesError) {
        console.log(`❌ Erro ao buscar roles: ${rolesError.message}`);
      } else {
        const roles = userRoles.map(r => r.role);
        console.log(`✅ Roles encontradas: ${roles.join(', ')}`);
        if (!roles.includes(scenario.role)) {
          console.log(`⚠️ Aviso: Role esperada '${scenario.role}' não encontrada`);
        }
      }

      // 4. Testar Dashboard - Buscar planos AEE
      console.log('\n4️⃣ Testando Dashboard - Buscar planos AEE...');
      let planosQuery = supabase
        .from('plano_aee')
        .select('id, student_id, status, created_at, student:students(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      // Filtrar por escola/tenant conforme role
      if (profile.school_id) {
        planosQuery = planosQuery.eq('school_id', profile.school_id);
      } else if (profile.tenant_id) {
        planosQuery = planosQuery.eq('tenant_id', profile.tenant_id);
      }

      const { data: planos, error: planosError } = await planosQuery;

      if (planosError) {
        console.log(`❌ Erro ao buscar planos: ${planosError.message}`);
      } else {
        console.log(`✅ Encontrados ${planos?.length || 0} planos AEE`);
        if (planos && planos.length > 0) {
          console.log(`   Exemplo: Plano ${planos[0].id} - Status: ${planos[0].status}`);
        }
      }

      // 5. Testar criação de plano (apenas para AEE Teacher)
      if (scenario.role === 'aee_teacher' && scenario.features.includes('create_plan')) {
        console.log('\n5️⃣ Testando criação de plano AEE...');
        
        // Buscar um aluno disponível
        let studentsQuery = supabase
          .from('students')
          .select('id, name')
          .limit(1);

        if (profile.school_id) {
          studentsQuery = studentsQuery.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          studentsQuery = studentsQuery.eq('tenant_id', profile.tenant_id);
        }

        const { data: students, error: studentsError } = await studentsQuery;

        if (studentsError || !students || students.length === 0) {
          console.log(`⚠️ Não foi possível encontrar alunos para criar plano de teste`);
        } else {
          const student = students[0];
          console.log(`   Usando aluno: ${student.name} (${student.id})`);

          // Verificar se já existe plano para este aluno
          const { data: existingPlan, error: existingError } = await supabase
            .from('plano_aee')
            .select('id')
            .eq('student_id', student.id)
            .maybeSingle();

          if (existingError) {
            console.log(`❌ Erro ao verificar plano existente: ${existingError.message}`);
          } else if (existingPlan) {
            console.log(`⚠️ Já existe um plano para este aluno (${existingPlan.id})`);
          } else {
            // Criar plano de teste
            const { data: newPlan, error: createError } = await supabase
              .from('plano_aee')
              .insert({
                student_id: student.id,
                school_id: profile.school_id,
                tenant_id: profile.tenant_id,
                created_by: authData.user.id,
                assigned_aee_teacher_id: authData.user.id,
                status: 'draft'
              })
              .select()
              .single();

            if (createError) {
              console.log(`❌ Erro ao criar plano: ${createError.message}`);
            } else {
              console.log(`✅ Plano criado com sucesso: ${newPlan.id}`);
            }
          }
        }
      }

      // 6. Testar Co-ensino (se aplicável)
      if (scenario.features.includes('co_teaching')) {
        console.log('\n6️⃣ Testando funcionalidade de Co-ensino...');
        
        // Buscar planos disponíveis
        let planosQuery2 = supabase
          .from('plano_aee')
          .select('id')
          .limit(1);

        if (profile.school_id) {
          planosQuery2 = planosQuery2.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          planosQuery2 = planosQuery2.eq('tenant_id', profile.tenant_id);
        }

        const { data: planos2, error: planosError2 } = await planosQuery2;

        if (planosError2 || !planos2 || planos2.length === 0) {
          console.log(`⚠️ Não foi possível encontrar planos para testar co-ensino`);
        } else {
          const planId = planos2[0].id;

          // Buscar sessões de co-ensino
          const { data: sessions, error: sessionsError } = await supabase
            .from('aee_co_teaching_sessions')
            .select('id, session_date, status')
            .eq('plan_id', planId)
            .limit(5);

          if (sessionsError) {
            console.log(`❌ Erro ao buscar sessões de co-ensino: ${sessionsError.message}`);
          } else {
            console.log(`✅ Encontradas ${sessions?.length || 0} sessões de co-ensino`);
          }
        }
      }

      // 7. Testar Materiais de Acessibilidade
      if (scenario.features.includes('materials')) {
        console.log('\n7️⃣ Testando funcionalidade de Materiais...');
        
        let planosQuery3 = supabase
          .from('plano_aee')
          .select('id')
          .limit(1);

        if (profile.school_id) {
          planosQuery3 = planosQuery3.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          planosQuery3 = planosQuery3.eq('tenant_id', profile.tenant_id);
        }

        const { data: planos3, error: planosError3 } = await planosQuery3;

        if (planosError3 || !planos3 || planos3.length === 0) {
          console.log(`⚠️ Não foi possível encontrar planos para testar materiais`);
        } else {
          const planId = planos3[0].id;

          // Buscar sessões de produção de materiais
          const { data: materials, error: materialsError } = await supabase
            .from('aee_material_production_sessions')
            .select('id, material_name, status')
            .eq('plan_id', planId)
            .limit(5);

          if (materialsError) {
            console.log(`❌ Erro ao buscar materiais: ${materialsError.message}`);
          } else {
            console.log(`✅ Encontradas ${materials?.length || 0} sessões de produção de materiais`);
          }

          // Buscar logs de uso de materiais
          const { data: usageLogs, error: usageError } = await supabase
            .from('aee_materials_usage_log')
            .select('id, material_name, used_date')
            .eq('plan_id', planId)
            .limit(5);

          if (usageError) {
            console.log(`❌ Erro ao buscar logs de uso: ${usageError.message}`);
          } else {
            console.log(`✅ Encontrados ${usageLogs?.length || 0} registros de uso de materiais`);
          }
        }
      }

      // 8. Testar Cronogramas
      if (scenario.features.includes('schedules')) {
        console.log('\n8️⃣ Testando funcionalidade de Cronogramas...');
        
        let planosQuery4 = supabase
          .from('plano_aee')
          .select('id')
          .limit(1);

        if (profile.school_id) {
          planosQuery4 = planosQuery4.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          planosQuery4 = planosQuery4.eq('tenant_id', profile.tenant_id);
        }

        const { data: planos4, error: planosError4 } = await planosQuery4;

        if (planosError4 || !planos4 || planos4.length === 0) {
          console.log(`⚠️ Não foi possível encontrar planos para testar cronogramas`);
        } else {
          const planId = planos4[0].id;

          // Buscar cronogramas vinculados
          const { data: schedules, error: schedulesError } = await supabase
            .from('aee_service_schedule_links')
            .select('id, schedule_type, status, start_date')
            .eq('plan_id', planId)
            .limit(5);

          if (schedulesError) {
            console.log(`❌ Erro ao buscar cronogramas: ${schedulesError.message}`);
          } else {
            console.log(`✅ Encontrados ${schedules?.length || 0} cronogramas vinculados`);
          }

          // Testar RPC get_aee_schedules_by_plan
          const { data: schedulesRPC, error: rpcError } = await supabase
            .rpc('get_aee_schedules_by_plan', { p_plan_id: planId });

          if (rpcError) {
            console.log(`❌ Erro ao usar RPC get_aee_schedules_by_plan: ${rpcError.message}`);
          } else {
            console.log(`✅ RPC get_aee_schedules_by_plan funcionando: ${schedulesRPC?.length || 0} resultados`);
          }
        }
      }

      // 9. Testar Atividades Interativas
      if (scenario.features.includes('activities')) {
        console.log('\n9️⃣ Testando funcionalidade de Atividades Interativas...');
        
        let planosQuery5 = supabase
          .from('plano_aee')
          .select('id')
          .limit(1);

        if (profile.school_id) {
          planosQuery5 = planosQuery5.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          planosQuery5 = planosQuery5.eq('tenant_id', profile.tenant_id);
        }

        const { data: planos5, error: planosError5 } = await planosQuery5;

        if (planosError5 || !planos5 || planos5.length === 0) {
          console.log(`⚠️ Não foi possível encontrar planos para testar atividades`);
        } else {
          const planId = planos5[0].id;

          // Buscar links de atividades
          const { data: activities, error: activitiesError } = await supabase
            .from('aee_activity_links')
            .select('id, activity_name, activity_type')
            .eq('plan_id', planId)
            .limit(5);

          if (activitiesError) {
            console.log(`❌ Erro ao buscar atividades: ${activitiesError.message}`);
          } else {
            console.log(`✅ Encontrados ${activities?.length || 0} links de atividades`);
          }

          // Buscar sessões de atividades
          const { data: activitySessions, error: sessionsError2 } = await supabase
            .from('aee_activity_sessions')
            .select('id, session_date')
            .eq('plan_id', planId)
            .limit(5);

          if (sessionsError2) {
            console.log(`❌ Erro ao buscar sessões de atividades: ${sessionsError2.message}`);
          } else {
            console.log(`✅ Encontradas ${activitySessions?.length || 0} sessões de atividades`);
          }
        }
      }

      // 10. Testar Comunicação
      if (scenario.features.includes('communication')) {
        console.log('\n🔟 Testando funcionalidade de Comunicação...');
        
        let planosQuery6 = supabase
          .from('plano_aee')
          .select('id')
          .limit(1);

        if (profile.school_id) {
          planosQuery6 = planosQuery6.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          planosQuery6 = planosQuery6.eq('tenant_id', profile.tenant_id);
        }

        const { data: planos6, error: planosError6 } = await planosQuery6;

        if (planosError6 || !planos6 || planos6.length === 0) {
          console.log(`⚠️ Não foi possível encontrar planos para testar comunicação`);
        } else {
          const planId = planos6[0].id;

          // Buscar mensagens enviadas
          const { data: sentMessages, error: sentError } = await supabase
            .from('aee_teacher_communication')
            .select('id, communication_type, subject, read_status')
            .eq('from_user_id', authData.user.id)
            .eq('plan_id', planId)
            .limit(5);

          if (sentError) {
            console.log(`❌ Erro ao buscar mensagens enviadas: ${sentError.message}`);
          } else {
            console.log(`✅ Encontradas ${sentMessages?.length || 0} mensagens enviadas`);
          }

          // Buscar mensagens recebidas
          const { data: receivedMessages, error: receivedError } = await supabase
            .from('aee_teacher_communication')
            .select('id, communication_type, subject, read_status')
            .eq('to_user_id', authData.user.id)
            .eq('plan_id', planId)
            .limit(5);

          if (receivedError) {
            console.log(`❌ Erro ao buscar mensagens recebidas: ${receivedError.message}`);
          } else {
            console.log(`✅ Encontradas ${receivedMessages?.length || 0} mensagens recebidas`);
          }

          // Testar RPC get_unread_messages
          const { data: unreadMessages, error: unreadError } = await supabase
            .rpc('get_unread_messages', { p_user_id: authData.user.id });

          if (unreadError) {
            console.log(`❌ Erro ao usar RPC get_unread_messages: ${unreadError.message}`);
          } else {
            console.log(`✅ RPC get_unread_messages funcionando: ${unreadMessages?.length || 0} mensagens não lidas`);
          }

          // Testar RPC count_unread_messages
          const { data: unreadCount, error: countError } = await supabase
            .rpc('count_unread_messages', { p_user_id: authData.user.id });

          if (countError) {
            console.log(`❌ Erro ao usar RPC count_unread_messages: ${countError.message}`);
          } else {
            console.log(`✅ RPC count_unread_messages funcionando: ${unreadCount} mensagens não lidas`);
          }
        }
      }

      // 11. Testar Repertório de Aprendizagem e Progresso
      if (scenario.role === 'aee_teacher') {
        console.log('\n1️⃣1️⃣ Testando Repertório de Aprendizagem e Progresso...');
        
        let planosQuery7 = supabase
          .from('plano_aee')
          .select('id, student_id')
          .limit(1);

        if (profile.school_id) {
          planosQuery7 = planosQuery7.eq('school_id', profile.school_id);
        } else if (profile.tenant_id) {
          planosQuery7 = planosQuery7.eq('tenant_id', profile.tenant_id);
        }

        const { data: planos7, error: planosError7 } = await planosQuery7;

        if (planosError7 || !planos7 || planos7.length === 0) {
          console.log(`⚠️ Não foi possível encontrar planos para testar repertório`);
        } else {
          const planId = planos7[0].id;
          const studentId = planos7[0].student_id;

          // Buscar registros de repertório
          const { data: repertoire, error: repError } = await supabase
            .from('aee_learning_repertoire')
            .select('id, record_date, record_type')
            .eq('plan_id', planId)
            .limit(5);

          if (repError) {
            console.log(`❌ Erro ao buscar repertório: ${repError.message}`);
          } else {
            console.log(`✅ Encontrados ${repertoire?.length || 0} registros de repertório`);
          }

          // Buscar registros de progresso
          const { data: progress, error: progError } = await supabase
            .from('aee_progress_tracking')
            .select('id, tracking_date, metric_type, trend')
            .eq('plan_id', planId)
            .limit(5);

          if (progError) {
            console.log(`❌ Erro ao buscar progresso: ${progError.message}`);
          } else {
            console.log(`✅ Encontrados ${progress?.length || 0} registros de progresso`);
          }
        }
      }

      // Logout
      console.log('\n🔓 Fazendo logout...');
      await supabase.auth.signOut();
      console.log('✅ Logout realizado\n');

    } catch (error) {
      console.error(`❌ Erro geral no teste: ${error.message}`);
      console.error(error);
      await supabase.auth.signOut();
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Teste do App Plano de AEE concluído!');
  console.log('='.repeat(60) + '\n');
}

// Executar testes
testPlanoAEEApp().catch(console.error);


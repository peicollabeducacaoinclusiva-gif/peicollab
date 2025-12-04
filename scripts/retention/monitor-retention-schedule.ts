#!/usr/bin/env node
/**
 * Script para monitorar o agendamento de retenção de dados
 * Uso: npx tsx scripts/retention/monitor-retention-schedule.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Configure as variáveis de ambiente:');
  console.error('   VITE_SUPABASE_URL ou SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function monitorRetentionSchedule() {
  console.log('📊 Monitorando Agendamento de Retenção de Dados\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar jobs agendados
    console.log('\n1️⃣ Jobs Agendados:\n');
    const { data: jobs, error: jobsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
            jobid,
            jobname,
            schedule,
            command,
            active,
            database,
            username
        FROM cron.job
        WHERE jobname LIKE '%retencao%'
        ORDER BY jobid;
      `,
    });

    if (jobsError) {
      // Tentar query direta
      const { data: directJobs, error: directError } = await supabase
        .from('cron.job')
        .select('*')
        .like('jobname', '%retencao%');

      if (directError) {
        console.log('   ⚠️ Erro ao buscar jobs:', directError.message);
        console.log('   💡 Execute a query diretamente no Supabase Dashboard');
      } else {
        displayJobs(directJobs || []);
      }
    } else {
      displayJobs(jobs || []);
    }

    // 2. Ver histórico de execuções
    console.log('\n2️⃣ Histórico de Execuções (últimas 10):\n');
    const { data: executions, error: execError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
            j.jobname,
            jr.start_time,
            jr.end_time,
            jr.status,
            jr.return_message,
            (jr.end_time - jr.start_time) AS duration
        FROM cron.job j
        LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
        WHERE j.jobname LIKE '%retencao%'
        ORDER BY jr.start_time DESC NULLS LAST
        LIMIT 10;
      `,
    });

    if (execError) {
      console.log('   ⚠️ Erro ao buscar histórico:', execError.message);
      console.log('   💡 Execute a query diretamente no Supabase Dashboard');
    } else {
      displayExecutions(executions || []);
    }

    // 3. Ver erros recentes
    console.log('\n3️⃣ Execuções com Erro:\n');
    const { data: errors, error: errError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
            j.jobname,
            jr.start_time,
            jr.return_message,
            jr.status
        FROM cron.job j
        JOIN cron.job_run_details jr ON j.jobid = jr.jobid
        WHERE j.jobname LIKE '%retencao%'
            AND jr.status = 'failed'
        ORDER BY jr.start_time DESC
        LIMIT 10;
      `,
    });

    if (errError) {
      console.log('   ⚠️ Erro ao buscar erros:', errError.message);
    } else if (!errors || errors.length === 0) {
      console.log('   ✅ Nenhuma execução com erro encontrada');
    } else {
      displayErrors(errors);
    }

    // 4. Ver logs de retenção recentes
    console.log('\n4️⃣ Logs de Retenção Recentes (últimas 5):\n');
    const { data: retentionLogs, error: logsError } = await supabase
      .from('retention_execution_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.log('   ⚠️ Erro ao buscar logs:', logsError.message);
    } else if (!retentionLogs || retentionLogs.length === 0) {
      console.log('   ℹ️ Nenhum log de execução encontrado ainda');
      console.log('   💡 Os logs aparecerão após a primeira execução do job');
    } else {
      displayRetentionLogs(retentionLogs);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Monitoramento concluído!');
    console.log('='.repeat(60));
    console.log('\n📋 Próximos passos:');
    console.log('   1. O job executa diariamente às 2h UTC (23h BRT)');
    console.log('   2. Monitore via: SELECT * FROM cron.job_run_details;');
    console.log('   3. Verifique logs em: retention_execution_logs');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Erro durante monitoramento:', error.message);
    process.exit(1);
  }
}

function displayJobs(jobs: any[]) {
  if (jobs.length === 0) {
    console.log('   ⚠️ Nenhum job de retenção encontrado');
    console.log('   💡 Execute o script de configuração primeiro');
    return;
  }

  jobs.forEach((job) => {
    console.log(`   📅 ${job.jobname}`);
    console.log(`      ID: ${job.jobid}`);
    console.log(`      Agendamento: ${job.schedule}`);
    console.log(`      Status: ${job.active ? '✅ Ativo' : '⏸️ Inativo'}`);
    console.log(`      Database: ${job.database || 'postgres'}`);
    console.log('');
  });
}

function displayExecutions(executions: any[]) {
  const validExecutions = executions.filter((e) => e.start_time !== null);

  if (validExecutions.length === 0) {
    console.log('   ℹ️ Nenhuma execução registrada ainda');
    console.log('   💡 O job ainda não foi executado');
    return;
  }

  validExecutions.forEach((exec) => {
    const startTime = new Date(exec.start_time).toLocaleString('pt-BR');
    const endTime = exec.end_time ? new Date(exec.end_time).toLocaleString('pt-BR') : 'Em execução...';
    const status = exec.status === 'succeeded' ? '✅' : exec.status === 'failed' ? '❌' : '⏳';

    console.log(`   ${status} ${exec.jobname}`);
    console.log(`      Início: ${startTime}`);
    console.log(`      Fim: ${endTime}`);
    if (exec.duration) {
      console.log(`      Duração: ${exec.duration}`);
    }
    if (exec.return_message) {
      console.log(`      Mensagem: ${exec.return_message.substring(0, 100)}...`);
    }
    console.log('');
  });
}

function displayErrors(errors: any[]) {
  errors.forEach((err) => {
    console.log(`   ❌ ${err.jobname}`);
    console.log(`      Data: ${new Date(err.start_time).toLocaleString('pt-BR')}`);
    console.log(`      Erro: ${err.return_message || 'Erro desconhecido'}`);
    console.log('');
  });
}

function displayRetentionLogs(logs: any[]) {
  logs.forEach((log: any) => {
    const date = new Date(log.created_at).toLocaleString('pt-BR');
    const status = log.status === 'completed' ? '✅' : log.status === 'failed' ? '❌' : '⏳';
    const type = log.dry_run ? '🧪 TESTE' : '🔧 REAL';

    console.log(`   ${status} ${type} - ${date}`);
    console.log(`      Tenant: ${log.tenant_id}`);
    console.log(`      Resumo: ${log.summary || 'N/A'}`);
    console.log('');
  });
}

monitorRetentionSchedule()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });


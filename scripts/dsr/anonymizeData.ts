#!/usr/bin/env node
/**
 * Script para anonimizar dados pessoais (direito ao esquecimento)
 * Uso: npx tsx scripts/dsr/anonymizeData.ts <tenant_id> <subject_id> <subject_type> <reason>
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (sim/não): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'sim' || answer.toLowerCase() === 's' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function anonymizeData(
  tenantId: string,
  subjectId: string,
  subjectType: 'student' | 'user' | 'guardian' | 'professional',
  reason: string
) {
  try {
    console.log(`\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!`);
    console.log(`   - Tenant: ${tenantId}`);
    console.log(`   - Sujeito: ${subjectType} ${subjectId}`);
    console.log(`   - Motivo: ${reason}\n`);

    const confirmed = await askConfirmation('Deseja realmente anonimizar estes dados?');

    if (!confirmed) {
      console.log('❌ Operação cancelada pelo usuário');
      process.exit(0);
    }

    console.log(`\n🔄 Anonimizando dados...`);

    const { data, error } = await supabase.rpc('anonymize_personal_data_v2', {
      p_subject_id: subjectId,
      p_subject_type: subjectType,
      p_tenant_id: tenantId,
      p_reason: reason,
      p_anonymized_by: null, // Será preenchido pela função RPC
    });

    if (error) {
      console.error('❌ Erro ao anonimizar dados:', error);
      process.exit(1);
    }

    console.log(`\n✅ Dados anonimizados com sucesso!`);
    console.log(`📋 Campos anonimizados: ${data.anonymized_fields.join(', ')}`);
    console.log(`📅 Anonimizado em: ${data.anonymized_at}`);
    console.log(`🆔 ID da anonimização: ${data.anonymization_id}`);

    return data;
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar script
const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('❌ Uso: npx tsx scripts/dsr/anonymizeData.ts <tenant_id> <subject_id> <subject_type> <reason>');
  console.error('   Exemplo: npx tsx scripts/dsr/anonymizeData.ts abc-123 def-456 student "Solicitação do titular"');
  process.exit(1);
}

const [tenantId, subjectId, subjectType, ...reasonParts] = args;
const reason = reasonParts.join(' ');

if (!['student', 'user', 'guardian', 'professional'].includes(subjectType)) {
  console.error('❌ Tipo de sujeito inválido. Use: student, user, guardian ou professional');
  process.exit(1);
}

anonymizeData(tenantId, subjectId, subjectType as 'student' | 'user' | 'guardian' | 'professional', reason)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });


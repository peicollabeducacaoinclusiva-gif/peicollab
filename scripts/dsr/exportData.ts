#!/usr/bin/env node
/**
 * Script para exportar dados pessoais (portabilidade)
 * Uso: npx tsx scripts/dsr/exportData.ts <tenant_id> <subject_id> <subject_type>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fximylewmvsllkdczovj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportData(tenantId: string, subjectId: string, subjectType: 'student' | 'user' | 'guardian' | 'professional') {
  try {
    console.log(`📦 Exportando dados para ${subjectType} ${subjectId} no tenant ${tenantId}...`);

    const { data, error } = await supabase.rpc('export_personal_data_v2', {
      p_subject_id: subjectId,
      p_subject_type: subjectType,
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error('❌ Erro ao exportar dados:', error);
      process.exit(1);
    }

    // Criar diretório de exportação se não existir
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Salvar dados em arquivo JSON
    const filename = `export_${subjectType}_${subjectId}_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✅ Dados exportados com sucesso!`);
    console.log(`📄 Arquivo salvo em: ${filepath}`);
    console.log(`📊 Formato: ${data.format_version}`);
    console.log(`📅 Exportado em: ${data.exported_at}`);

    // Estatísticas
    const stats = {
      profile: data.data.profile ? 1 : 0,
      enrollments: data.data.enrollments?.length || 0,
      grades: data.data.grades?.length || 0,
      attendance: data.data.attendance?.length || 0,
      peis: data.data.peis?.length || 0,
      aee: data.data.aee?.length || 0,
      consents: data.data.consents?.length || 0,
      audit_events: data.data.audit_events?.length || 0,
    };

    console.log('\n📈 Estatísticas:');
    console.log(`   - Perfil: ${stats.profile > 0 ? 'Sim' : 'Não'}`);
    console.log(`   - Matrículas: ${stats.enrollments}`);
    console.log(`   - Notas: ${stats.grades}`);
    console.log(`   - Frequência: ${stats.attendance}`);
    console.log(`   - PEIs: ${stats.peis}`);
    console.log(`   - AEE: ${stats.aee}`);
    console.log(`   - Consentimentos: ${stats.consents}`);
    console.log(`   - Eventos de auditoria: ${stats.audit_events}`);

    return filepath;
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar script
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('❌ Uso: npx tsx scripts/dsr/exportData.ts <tenant_id> <subject_id> <subject_type>');
  console.error('   Exemplo: npx tsx scripts/dsr/exportData.ts abc-123 def-456 student');
  process.exit(1);
}

const [tenantId, subjectId, subjectType] = args;

if (!['student', 'user', 'guardian', 'professional'].includes(subjectType)) {
  console.error('❌ Tipo de sujeito inválido. Use: student, user, guardian ou professional');
  process.exit(1);
}

exportData(tenantId, subjectId, subjectType as 'student' | 'user' | 'guardian' | 'professional')
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });


#!/usr/bin/env node
/**
 * Seed de alunos para smoke E2E (fluxos completos).
 * Cria um aluno "Aluno Smoke" na Escola Demo.
 *
 * Uso: pnpm run seed:students (a partir da raiz)
 * Requer: .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * Pré-requisito: pnpm seed:users (admin, escolas via migrations)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const monorepoRoot = resolve(appRoot, '../..');

function loadEnv() {
  const paths = [resolve(appRoot, '.env.local'), resolve(monorepoRoot, '.env.local')];
  for (const p of paths) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) {
          const key = m[1].trim();
          const val = m[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
      return;
    }
  }
  throw new Error('Arquivo .env.local não encontrado');
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    'Erro: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórios.'
  );
  process.exit(1);
}

const supabase = createClient(url, key);
const SENHA = 'senha123';

async function main() {
  console.log('Criando aluno de smoke...\n');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@pei.demo',
    password: SENHA,
  });

  if (authError) {
    console.error('Erro ao fazer login como admin:', authError.message);
    console.error('Execute pnpm seed:users primeiro.');
    process.exit(1);
  }

  const { data: schools, error: schoolsError } = await supabase.rpc('get_schools');
  if (schoolsError) {
    console.error('Erro ao buscar escolas:', schoolsError.message);
    process.exit(1);
  }
  const school = Array.isArray(schools) && schools.length > 0 ? schools[0] : null;

  if (!school?.id) {
    console.error('Nenhuma escola encontrada. Aplique as migrations (supabase db push).');
    process.exit(1);
  }

  const { data: studentId, error: createError } = await supabase.rpc('create_student', {
    p_nome: 'Aluno Smoke',
    p_school_id: school.id,
    p_serie: '3o Ano',
    p_turno: 'manha',
    p_categoria_necessidade: 'TEA',
  });

  if (createError) {
    console.error('Erro ao criar aluno:', createError.message);
    process.exit(1);
  }

  console.log(`  ✓ Aluno Smoke criado (id: ${studentId})`);
}

main();

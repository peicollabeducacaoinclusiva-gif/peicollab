#!/usr/bin/env node
/**
 * Seed de usuários para smoke E2E.
 * Cria gestor, professores e família via Supabase Auth (admin já existe).
 *
 * Uso: pnpm run seed:users (a partir da raiz) ou node scripts/seed-users.mjs (a partir de apps/pei-collab)
 * Requer: .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const monorepoRoot = resolve(appRoot, '../..');

function loadEnv() {
  const paths = [resolve(monorepoRoot, '.env.local'), resolve(appRoot, '.env.local')];
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

const usuarios = [
  { email: 'admin@pei.demo', nome: 'Admin Demo', role: 'admin_rede' },
  { email: 'gestor@pei.demo', nome: 'Gestor Demo', role: 'gestor_escolar' },
  { email: 'coordenador@pei.demo', nome: 'Coordenador Demo', role: 'coordenador' },
  { email: 'prof.regente@pei.demo', nome: 'Prof. Regente', role: 'professor_regente' },
  { email: 'prof.aee@pei.demo', nome: 'Prof. AEE', role: 'professor_aee' },
  { email: 'familia@pei.demo', nome: 'Família Demo', role: 'familia' },
];

async function main() {
  console.log('Criando usuários de smoke...\n');
  for (const u of usuarios) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: SENHA,
      options: { data: { name: u.nome, role: u.role } },
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('exist') || msg.includes('registered')) {
        console.log(`  ⏭ ${u.email} — já existe, ignorando`);
      } else {
        console.error(`  ✗ ${u.email} — ${error.message}`);
      }
    } else {
      console.log(`  ✓ ${u.email} — criado`);
    }
  }
  console.log('\nConcluído. Execute: pnpm test:e2e -- e2e/smoke-mvp.spec.ts');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

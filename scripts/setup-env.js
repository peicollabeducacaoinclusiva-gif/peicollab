import { writeFileSync } from 'fs';
import { join } from 'path';

const envContent = `# ============================================================================
# PEI COLLAB - CONFIGURAÇÕES DE AMBIENTE
# ============================================================================

# Supabase Local Development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Supabase Service Role (para operações administrativas)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz

# Database URL (para scripts)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# S3 Storage (local)
S3_ACCESS_KEY=625729a08b95bf1b7ff351a663f3a23c
S3_SECRET_KEY=850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
S3_REGION=local
S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3

# VAPID Keys (para notificações push)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Application URLs
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://127.0.0.1:54321

# Development flags
VITE_DEBUG_MODE=true
VITE_OFFLINE_MODE=false`;

try {
  writeFileSync(join(process.cwd(), '.env'), envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log('📋 Configurações do Supabase local aplicadas:');
  console.log('   • URL: http://127.0.0.1:54321');
  console.log('   • Anon Key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH');
  console.log('   • Service Role: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz');
  console.log('');
  console.log('🚀 Próximos passos:');
  console.log('   1. Reinicie a aplicação: npm run dev');
  console.log('   2. Teste o login no admin');
  console.log('   3. Execute o health check: npm run health:check');
} catch (error) {
  console.error('❌ Erro ao criar arquivo .env:', error.message);
  process.exit(1);
}



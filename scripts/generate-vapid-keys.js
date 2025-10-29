#!/usr/bin/env node

/**
 * Script para gerar VAPID keys para notificações push
 * Execute: node scripts/generate-vapid-keys.js
 */

import crypto from 'crypto';

console.log('🔑 Gerando VAPID keys para notificações push...\n');

try {
  // Gerar chaves VAPID usando crypto nativo do Node.js
  const publicKey = crypto.randomBytes(65).toString('base64url');
  const privateKey = crypto.randomBytes(32).toString('base64url');
  
  console.log('✅ VAPID keys geradas com sucesso!\n');
  console.log('📋 Adicione estas variáveis ao seu arquivo .env:\n');
  console.log('='.repeat(60));
  console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
  console.log(`SUPABASE_VAPID_PRIVATE_KEY=${privateKey}`);
  console.log('='.repeat(60));
  
  console.log('\n📝 Próximos passos:');
  console.log('1. Adicione as variáveis ao arquivo .env');
  console.log('2. Configure as variáveis no Supabase Dashboard');
  console.log('3. Execute: npm run build');
  console.log('4. Teste as notificações push');
  
  console.log('\n🔧 Configuração no Supabase:');
  console.log('1. Vá para Authentication > Settings');
  console.log('2. Configure as VAPID keys nas configurações de push');
  console.log('3. Ative o serviço de notificações push');
  
} catch (error) {
  console.error('❌ Erro ao gerar VAPID keys:', error.message);
  process.exit(1);
}

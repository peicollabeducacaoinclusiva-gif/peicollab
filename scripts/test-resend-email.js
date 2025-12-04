#!/usr/bin/env node

/**
 * Script para testar o envio de email via Resend API
 * Use este script para verificar se o Resend está configurado corretamente
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Carregar variáveis de ambiente
let resendApiKey;

try {
  const envPath = join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (key === 'RESEND_API_KEY') {
        resendApiKey = value;
      }
    }
  });
} catch (error) {
  log('⚠️  Arquivo .env não encontrado, usando variáveis do sistema', 'yellow');
}

resendApiKey = resendApiKey || process.env.RESEND_API_KEY || '';

if (!resendApiKey) {
  log('❌ RESEND_API_KEY não configurada!', 'red');
  log('   Configure no arquivo .env ou como variável de ambiente', 'yellow');
  log('   Exemplo: RESEND_API_KEY=re_xxxxxxxxxxxxx', 'yellow');
  process.exit(1);
}

async function testResendEmail() {
  log('\n🧪 Testando envio de email via Resend API\n', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // Testar verificação de domínio
    log('\n1️⃣  Verificando domínios no Resend...', 'blue');
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!domainsResponse.ok) {
      const errorData = await domainsResponse.json();
      log(`   ❌ Erro ao verificar domínios: ${errorData.message || domainsResponse.statusText}`, 'red');
      if (domainsResponse.status === 401) {
        log('   ⚠️  API Key inválida ou expirada!', 'yellow');
      }
      return;
    }

    const domainsData = await domainsResponse.json();
    log(`   ✅ Conexão com Resend OK!`, 'green');
    
    if (domainsData.data && domainsData.data.length > 0) {
      log(`   📋 Domínios encontrados:`, 'cyan');
      domainsData.data.forEach((domain, index) => {
        const status = domain.status === 'verified' ? '✅ Verificado' : '❌ Não verificado';
        log(`      ${index + 1}. ${domain.name} - ${status}`, domain.status === 'verified' ? 'green' : 'yellow');
        
        if (domain.status !== 'verified') {
          log(`         ⚠️  Este domínio precisa ser verificado antes de enviar emails!`, 'yellow');
        }
      });
    } else {
      log(`   ⚠️  Nenhum domínio encontrado!`, 'yellow');
      log(`   💡 Você precisa adicionar e verificar o domínio peicollab.com.br no Resend`, 'yellow');
    }

    // Testar envio de email
    log('\n2️⃣  Testando envio de email...', 'blue');
    const testEmail = process.argv[2] || 'danielbruno84@gmail.com';
    
    log(`   📧 Enviando email de teste para: ${testEmail}`, 'cyan');
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'team@peicollab.com.br',
        to: testEmail,
        subject: 'Teste de Email - PEI Collab',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Teste de Email</title>
          </head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #3b82f6;">Teste de Email - PEI Collab</h2>
            <p>Este é um email de teste para verificar se o Resend está funcionando corretamente.</p>
            <p>Se você recebeu este email, a configuração está OK! ✅</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">
              Enviado via Resend API - PEI Collab
            </p>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      log(`   ❌ Erro ao enviar email: ${errorData.message || emailResponse.statusText}`, 'red');
      
      if (errorData.message?.includes('domain')) {
        log(`   ⚠️  O domínio peicollab.com.br não está verificado!`, 'yellow');
        log(`   💡 Verifique o domínio no Resend Dashboard`, 'yellow');
      } else if (errorData.message?.includes('sender')) {
        log(`   ⚠️  O sender email team@peicollab.com.br não está aprovado!`, 'yellow');
        log(`   💡 Verifique o sender email no Resend Dashboard`, 'yellow');
      } else if (errorData.message?.includes('rate limit')) {
        log(`   ⚠️  Rate limit atingido!`, 'yellow');
        log(`   💡 Aguarde alguns minutos antes de tentar novamente`, 'yellow');
      }
      
      log(`   📋 Detalhes do erro:`, 'cyan');
      console.log(JSON.stringify(errorData, null, 2));
      return;
    }

    const emailData = await emailResponse.json();
    log(`   ✅ Email enviado com sucesso!`, 'green');
    log(`   📧 ID do email: ${emailData.id}`, 'cyan');
    log(`   💡 Verifique a caixa de entrada de ${testEmail}`, 'cyan');

    // Resumo
    log('\n' + '='.repeat(60), 'cyan');
    log('\n📊 RESUMO:', 'cyan');
    log(`   ✅ API Key: Válida`, 'green');
    log(`   ✅ Conexão: OK`, 'green');
    log(`   ✅ Envio de email: OK`, 'green');
    log(`\n💡 Se o teste funcionou, o problema está na configuração do Supabase`, 'yellow');
    log(`   Verifique: Supabase Dashboard → Authentication → Settings → SMTP Settings\n`, 'yellow');

  } catch (error) {
    log(`\n❌ Erro geral: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Executar teste
testResendEmail();


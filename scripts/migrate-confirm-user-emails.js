/**
 * Script de Migração: Confirmar emails de usuários existentes
 * 
 * Este script confirma os emails de todos os usuários que ainda não têm email confirmado.
 * Isso garante consistência após remover a necessidade de confirmação por email.
 * 
 * Uso:
 *   node scripts/migrate-confirm-user-emails.js
 * 
 * Requer variáveis de ambiente:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUserEmails() {
  console.log('🔄 Iniciando migração de confirmação de emails...\n');

  try {
    // Buscar usuários sem email confirmado
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();

    if (fetchError) {
      throw new Error(`Erro ao buscar usuários: ${fetchError.message}`);
    }

    if (!users || users.users.length === 0) {
      console.log('✅ Nenhum usuário encontrado.');
      return;
    }

    console.log(`📊 Total de usuários encontrados: ${users.users.length}`);

    // Filtrar usuários que precisam de confirmação
    const usersToConfirm = users.users.filter(
      user => 
        user.email && 
        user.email !== '' && 
        (!user.email_confirmed_at || user.email_confirmed_at < user.created_at)
    );

    console.log(`📧 Usuários que precisam de confirmação: ${usersToConfirm.length}\n`);

    if (usersToConfirm.length === 0) {
      console.log('✅ Todos os usuários já têm email confirmado.');
      return;
    }

    // Confirmar emails
    let confirmed = 0;
    let errors = 0;

    for (const user of usersToConfirm) {
      try {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true
          }
        );

        if (updateError) {
          console.error(`❌ Erro ao confirmar email de ${user.email}: ${updateError.message}`);
          errors++;
        } else {
          console.log(`✅ Email confirmado: ${user.email}`);
          confirmed++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✅ Confirmados: ${confirmed}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📧 Total processado: ${usersToConfirm.length}`);

    if (errors === 0) {
      console.log('\n✅ Migração concluída com sucesso!');
    } else {
      console.log(`\n⚠️  Migração concluída com ${errors} erro(s).`);
    }

  } catch (error) {
    console.error('\n❌ Erro fatal na migração:', error.message);
    process.exit(1);
  }
}

// Executar migração
migrateUserEmails()
  .then(() => {
    console.log('\n✨ Processo finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro inesperado:', error);
    process.exit(1);
  });


// Script para corrigir RLS da tabela profiles
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfilesRLS() {
  console.log('🔧 Corrigindo RLS da tabela profiles...\n');

  try {
    // 1. Desabilitar RLS temporariamente
    console.log('1. Desabilitando RLS na tabela profiles...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.error('❌ Erro ao desabilitar RLS:', disableError);
      return;
    }

    console.log('✅ RLS desabilitado com sucesso');

    // 2. Remover todas as políticas existentes
    console.log('\n2. Removendo políticas existentes...');
    const policies = [
      'profiles_select_policy',
      'profiles_insert_policy', 
      'profiles_update_policy',
      'profiles_delete_policy',
      'education_secretary_can_view_profiles',
      'school_director_can_view_profiles',
      'school_director_can_manage_profiles'
    ];

    for (const policy of policies) {
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON public.profiles;`
      });
      
      if (dropError) {
        console.log(`⚠️ Aviso ao remover política ${policy}:`, dropError.message);
      }
    }

    console.log('✅ Políticas removidas');

    // 3. Criar política simples e segura
    console.log('\n3. Criando política simples...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "profiles_simple_policy" ON public.profiles
        FOR ALL
        USING (auth.uid() = id);
      `
    });

    if (createError) {
      console.error('❌ Erro ao criar política:', createError);
      return;
    }

    console.log('✅ Política simples criada');

    // 4. Reabilitar RLS
    console.log('\n4. Reabilitando RLS...');
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'
    });

    if (enableError) {
      console.error('❌ Erro ao reabilitar RLS:', enableError);
      return;
    }

    console.log('✅ RLS reabilitado com sucesso');

    console.log('\n🎉 Correção do RLS concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  fixProfilesRLS();
}

export { fixProfilesRLS };


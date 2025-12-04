import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter token de autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter parâmetros da requisição
    const { tenantId, schoolId, academicYear } = await req.json();

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'tenantId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar dados antes de gerar
    const { data: validation, error: validationError } = await supabase.rpc(
      'validate_educacenso_data',
      {
        p_tenant_id: tenantId,
        p_school_id: schoolId || null,
        p_academic_year: academicYear || null,
      }
    );

    if (validationError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao validar dados', details: validationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se houver erros críticos, retornar
    if (!validation.valid && validation.total_errors > 0) {
      return new Response(
        JSON.stringify({
          error: 'Dados inválidos para exportação',
          validation,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar arquivo
    const { data: fileContent, error: generateError } = await supabase.rpc(
      'generate_educacenso_file',
      {
        p_tenant_id: tenantId,
        p_school_id: schoolId || null,
        p_academic_year: academicYear || null,
      }
    );

    if (generateError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar arquivo', details: generateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar arquivo para download
    const fileName = `educacenso_${academicYear || new Date().getFullYear()}_${Date.now()}.txt`;

    return new Response(fileContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain;charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


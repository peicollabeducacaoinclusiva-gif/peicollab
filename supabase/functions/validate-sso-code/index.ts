import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidateSSOCodeRequest {
  code: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar request body
    const { code }: ValidateSSOCodeRequest = await req.json()

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'code is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente com service role para validar código
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Usar função RPC para validar e marcar código como usado
    const { data: validationResult, error: validationError } = await supabaseServiceClient
      .rpc('validate_sso_code', { p_code: code })

    if (validationError) {
      console.error('Erro ao validar código SSO:', validationError)
      return new Response(
        JSON.stringify({ error: 'Failed to validate SSO code', details: validationError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se código foi encontrado e validado
    if (!validationResult || validationResult === null) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired SSO code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const codeData = validationResult as {
      id: string
      user_id: string
      session_data: {
        access_token: string
        refresh_token: string
        expires_at: number
      }
      target_app: string
    }

    // Extrair dados da sessão do JSONB
    const sessionData = codeData.session_data

    // Retornar dados da sessão
    return new Response(
      JSON.stringify({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        expires_at: sessionData.expires_at,
        user_id: codeData.user_id,
        target_app: codeData.target_app
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro inesperado ao validar código SSO:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


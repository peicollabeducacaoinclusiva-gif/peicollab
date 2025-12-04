import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSSOCodeRequest {
  target_app: string
  access_token: string
  refresh_token: string
  expires_at?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Obter token de autenticação do header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar request body
    const body: CreateSSOCodeRequest = await req.json()
    const { target_app, access_token, refresh_token, expires_at } = body

    if (!target_app || typeof target_app !== 'string') {
      return new Response(
        JSON.stringify({ error: 'target_app is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!access_token || !refresh_token) {
      return new Response(
        JSON.stringify({ error: 'access_token and refresh_token are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar token do header (deve corresponder ao access_token do body)
    const headerToken = authHeader.replace('Bearer ', '')
    if (headerToken !== access_token) {
      return new Response(
        JSON.stringify({ error: 'Token mismatch between header and body' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Criar cliente com service role para validar usuário
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Validar token e obter usuário
    const { data: { user }, error: authError } = await supabaseServiceClient.auth.getUser(access_token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular expires_at se não fornecido (decodificar JWT)
    let sessionExpiresAt = expires_at
    if (!sessionExpiresAt) {
      try {
        const payload = JSON.parse(atob(access_token.split('.')[1]))
        sessionExpiresAt = payload.exp || Math.floor(Date.now() / 1000) + 3600
      } catch {
        sessionExpiresAt = Math.floor(Date.now() / 1000) + 3600 // Default 1 hora
      }
    }

    // Preparar dados da sessão
    const sessionData = {
      access_token,
      refresh_token,
      expires_at: sessionExpiresAt
    }

    // Gerar código único (UUID v4)
    const code = crypto.randomUUID()

    // Calcular expiração do código SSO (5 minutos a partir de agora)
    const codeExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // Inserir código na tabela sso_codes
    const { data: ssoCode, error: insertError } = await supabaseServiceClient
      .from('sso_codes')
      .insert({
        code,
        user_id: user.id,
        session_data: sessionData,
        target_app,
        expires_at: codeExpiresAt
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar código SSO:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create SSO code', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Retornar código e expiração
    return new Response(
      JSON.stringify({
        code: ssoCode.code,
        expires_at: ssoCode.expires_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro inesperado ao criar código SSO:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


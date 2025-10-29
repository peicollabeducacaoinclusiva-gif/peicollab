import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

// Schema de validação para entrada de dados
const validateAccessSchema = z.object({
  code: z.string()
    .min(1, "Código é obrigatório")
    .max(50, "Código muito longo")
    .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
    .refine((date) => {
      const parsedDate = new Date(date);
      const now = new Date();
      const minDate = new Date('1900-01-01');
      return parsedDate <= now && parsedDate >= minDate;
    }, "Data de nascimento inválida"),
  clientIp: z.string()
    .ip()
    .optional()
    .or(z.literal('unknown'))
});

// Configuração segura de CORS
const getAllowedOrigins = () => {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://pei-collab.vercel.app',
    'https://pei-collab.netlify.app'
  ];
  return allowedOrigins.map(origin => origin.trim());
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 horas
  };
};

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validar e sanitizar entrada de dados
    const rawData = await req.json();
    const validationResult = validateAccessSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.warn('Dados de entrada inválidos:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Dados de entrada inválidos',
          details: validationResult.error.issues.map(issue => issue.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { code, dateOfBirth, clientIp } = validationResult.data;

    // Derive client IP from headers, fallback to provided body and then 'unknown'
    const ipFromHeaders = req.headers.get('x-real-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
    const ip = ipFromHeaders || clientIp || 'unknown'

    console.info('Iniciando validação de acesso familiar')

    // Use Deno.env instead of process.env
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Service role client for secure operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Limpar tentativas antigas (using service role)
    await supabase.rpc('clean_old_access_attempts')

    // Rate limiting configurável via variáveis de ambiente
    const recentMinutes = parseInt(Deno.env.get('RATE_LIMIT_RECENT_MINUTES') || '15');
    const recentLimit = parseInt(Deno.env.get('RATE_LIMIT_RECENT_ATTEMPTS') || '3');
    const hourlyLimit = parseInt(Deno.env.get('RATE_LIMIT_HOURLY_ATTEMPTS') || '10');
    
    const recentWindow = new Date(Date.now() - recentMinutes * 60 * 1000).toISOString()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    // Verificar tentativas na janela de tempo configurável
    const { data: recentAttempts, error: recentError } = await supabase
      .from('pei_access_attempts')
      .select('id, attempted_at')
      .eq('ip_address', ip)
      .gte('attempted_at', recentWindow)
      .order('attempted_at', { ascending: false })

    // Verificar tentativas na última hora
    const { data: hourlyAttempts, error: hourlyError } = await supabase
      .from('pei_access_attempts')
      .select('id')
      .eq('ip_address', ip)
      .gte('attempted_at', oneHourAgo)

    if (recentError || hourlyError) {
      console.error('Erro ao verificar rate limiting:', recentError || hourlyError)
    }

    // Rate limiting configurável
    const recentCount = recentAttempts?.length || 0
    const hourlyCount = hourlyAttempts?.length || 0

    if (recentCount >= recentLimit) {
      console.warn(`Rate limit excedido: ${recentCount} tentativas em ${recentMinutes} minutos para IP: ${ip.substring(0, 8)}...`)
      return new Response(
        JSON.stringify({ 
          error: `Muitas tentativas recentes. Aguarde ${recentMinutes} minutos e tente novamente.`,
          blocked: true,
          retryAfter: recentMinutes * 60
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': (recentMinutes * 60).toString()
          } 
        }
      )
    }

    if (hourlyCount >= hourlyLimit) {
      console.warn(`Rate limit excedido: ${hourlyCount} tentativas em 1 hora para IP: ${ip.substring(0, 8)}...`)
      return new Response(
        JSON.stringify({ 
          error: 'Limite de tentativas excedido. Aguarde 1 hora e tente novamente.',
          blocked: true,
          retryAfter: 3600 // 1 hora em segundos
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          } 
        }
      )
    }

    // Registrar tentativa (using service role for secure logging)
    const { data: attemptRecord } = await supabase
      .from('pei_access_attempts')
      .insert({
        ip_address: ip,
        success: false
      })
      .select()
      .single()

    // Hash the provided code
    const { data: tokenHash, error: hashError } = await supabase
      .rpc('hash_token', { token_value: code })

    if (hashError || !tokenHash) {
      console.error('Erro ao hash token:', hashError)
      return new Response(
        JSON.stringify({ error: 'Erro ao validar código' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar token válido usando hash (NEVER select plaintext token)
    console.info('Buscando token de acesso')
    const { data: tokenData, error: tokenError } = await supabase
      .from('family_access_tokens')
      .select(`
        id,
        pei_id,
        student_id,
        expires_at,
        access_count,
        pei:peis (
          id,
          student:students (
            name,
            date_of_birth
          )
        )
      `)
      .eq('token_hash', tokenHash)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle()

    console.info('Resultado da busca de token:', tokenData ? 'encontrado' : 'não encontrado')

    if (tokenError) {
      console.error('Erro ao buscar token:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Erro ao validar código' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokenData) {
      console.warn('Tentativa de acesso com token inválido ou expirado')
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar data de nascimento do aluno (duplo fator contextual)
    const student = (tokenData.pei as any)?.student
    console.info('Verificando credenciais do aluno')
    
    const dbDateOfBirth = student?.date_of_birth
    const dateMatch = dbDateOfBirth === dateOfBirth

    if (!dateMatch) {
      console.warn('Falha na verificação de credenciais do aluno')
      return new Response(
        JSON.stringify({ error: 'Data de nascimento não corresponde. Verifique os dados.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar tentativa como sucesso
    if (attemptRecord) {
      await supabase
        .from('pei_access_attempts')
        .update({ success: true })
        .eq('id', attemptRecord.id)
    }

    // Registrar acesso (using service role for secure logging)
    await supabase.from('pei_access_logs').insert({
      pei_id: tokenData.pei_id,
      token_used: code.toUpperCase(),
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
      verified: true
    })

    // Atualizar último acesso e contador
    await supabase
      .from('family_access_tokens')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: (tokenData.access_count || 0) + 1
      })
      .eq('id', tokenData.id)

    console.info('Acesso familiar validado com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true,
        peiId: tokenData.pei_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro na validação de acesso:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
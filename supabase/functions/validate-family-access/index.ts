import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { code, dateOfBirth, clientIp } = await req.json()

    // Derive client IP from headers, fallback to provided body and then 'unknown'
    const ipFromHeaders = req.headers.get('x-real-ip')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
    const ip = ipFromHeaders || clientIp || 'unknown'

    console.log('Validando código de acesso')

    if (!code || !dateOfBirth) {
      console.error('Dados incompletos')
      return new Response(
        JSON.stringify({ error: 'Código e data de nascimento do aluno são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use Deno.env instead of process.env
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Service role client for secure operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Limpar tentativas antigas (using service role)
    await supabase.rpc('clean_old_access_attempts')

    // Verificar rate limiting (5 tentativas em 15 minutos)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { data: attempts, error: attemptsError } = await supabase
      .from('pei_access_attempts')
      .select('id')
      .eq('ip_address', ip)
      .gte('attempted_at', fifteenMinutesAgo)

    if (attemptsError) {
      console.error('Erro ao verificar tentativas:', attemptsError)
    }

    if (attempts && attempts.length >= 5) {
      console.log('Rate limit excedido para IP:', ip)
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
          blocked: true
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    console.log('Buscando token com hash')
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

    console.log('Token encontrado:', !!tokenData)

    if (tokenError) {
      console.error('Erro ao buscar token:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Erro ao validar código' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokenData) {
      console.log('Token não encontrado ou expirado')
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar data de nascimento do aluno (duplo fator contextual)
    const student = (tokenData.pei as any)?.student
    console.log('Verificando data de nascimento do aluno')
    
    const dbDateOfBirth = student?.date_of_birth
    const dateMatch = dbDateOfBirth === dateOfBirth

    if (!dateMatch) {
      console.log('Data de nascimento não corresponde')
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

    console.log('Acesso validado com sucesso')

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
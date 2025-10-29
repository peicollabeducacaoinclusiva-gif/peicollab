import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestSchool {
  name: string
  network_name: string
  is_active: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Require superadmin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'superadmin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only superadmins can create test schools' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const testSchools: TestSchool[] = [
      { name: 'Escola Municipal ABC', network_name: 'Rede Municipal de Educação', is_active: true },
      { name: 'Escola Estadual XYZ', network_name: 'Rede Estadual de Educação', is_active: true },
      { name: 'Colégio Particular DEF', network_name: 'Rede Particular de Ensino', is_active: true },
      { name: 'Escola Rural GHI', network_name: 'Rede Rural de Educação', is_active: true },
    ]

    const created: any[] = []
    const errors: any[] = []

    for (const school of testSchools) {
      try {
        // Check if school already exists
        const { data: existing } = await supabase
          .from('schools')
          .select('id')
          .eq('name', school.name)
          .maybeSingle()

        if (existing) {
          continue // Skip if already exists
        }

        // Create new school
        const { data: newSchool, error: crtErr } = await supabase
          .from('schools')
          .insert([school])
          .select()
          .single()

        if (crtErr) {
          errors.push({ name: school.name, error: crtErr.message })
        } else {
          created.push({ id: newSchool.id, name: newSchool.name, network: newSchool.network_name })
        }
      } catch (e) {
        errors.push({ name: school.name, error: e instanceof Error ? e.message : 'Unknown error' })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created, 
        errors, 
        message: `Created: ${created.length} schools, Errors: ${errors.length}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})





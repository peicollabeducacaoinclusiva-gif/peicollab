import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Role = 'superadmin' | 'coordinator' | 'teacher' | 'aee_teacher' | 'school_manager' | 'specialist' | 'family'

interface TestUser {
  email: string
  fullName: string
  role: Role
  password: string
}

async function findUserByEmail(supabase: any, email: string) {
  // Iterate through pages to find the user by email (small user base expected)
  const perPage = 1000
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found
    if (data.users.length < perPage) break // no more pages
  }
  return null
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
      return new Response(JSON.stringify({ error: 'Forbidden: Only superadmins can create/reset test users' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Pick first active school (optional)
    const { data: school } = await supabase
      .from('schools')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    const schoolId = school?.id ?? null

    const testUsers: TestUser[] = [
      { email: 'superadmin@teste.com', fullName: 'Admin Sistema', role: 'superadmin', password: 'Teste123' },
      { email: 'coordenador@teste.com', fullName: 'Maria Coordenadora', role: 'coordinator', password: 'Teste123' },
      { email: 'professor@teste.com', fullName: 'João Professor', role: 'teacher', password: 'Teste123' },
      { email: 'aee@teste.com', fullName: 'Ana Professora AEE', role: 'aee_teacher', password: 'Teste123' },
      { email: 'gestor@teste.com', fullName: 'Carlos Gestor Escolar', role: 'school_manager', password: 'Teste123' },
      { email: 'especialista@teste.com', fullName: 'Dr. Pedro Especialista', role: 'specialist', password: 'Teste123' },
      { email: 'familia@teste.com', fullName: 'Pedro Família', role: 'family', password: 'Teste123' },
    ]

    const created: any[] = []
    const updated: any[] = []
    const errors: any[] = []

    for (const t of testUsers) {
      try {
        const existing = await findUserByEmail(supabase, t.email)
        if (existing) {
          // Update password + metadata
          const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
            password: t.password,
            email_confirm: true,
            user_metadata: {
              full_name: t.fullName,
              role: t.role,
              school_id: schoolId,
            },
          })
          if (updErr) {
            errors.push({ email: t.email, error: updErr.message })
          } else {
            updated.push({ email: t.email, role: t.role })
          }
        } else {
          // Create new user
          const { data: newUser, error: crtErr } = await supabase.auth.admin.createUser({
            email: t.email,
            password: t.password,
            email_confirm: true,
            user_metadata: {
              full_name: t.fullName,
              role: t.role,
              school_id: schoolId,
            },
          })
          if (crtErr) {
            errors.push({ email: t.email, error: crtErr.message })
          } else {
            created.push({ email: t.email, role: t.role })
          }
        }
      } catch (e) {
        errors.push({ email: t.email, error: e instanceof Error ? e.message : 'Unknown error' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, created, updated, errors, message: `Created: ${created.length}, Updated: ${updated.length}, Errors: ${errors.length}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

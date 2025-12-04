import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  fullName: string
  role: 'teacher' | 'coordinator' | 'family' | 'education_secretary' | 'school_manager' | 'aee_teacher' | 'specialist' | 'school_director' | 'support_professional'
  tenantId: string | null
  schoolId?: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is a superadmin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is superadmin or education_secretary
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user roles from user_roles table separately to avoid relationship issues
    const { data: userRolesData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const userRoles = userRolesData || []
    const roles = Array.isArray(userRoles) ? userRoles.map((ur: any) => ur.role) : []
    const isSuperadmin = roles.includes('superadmin')
    const isEducationSecretary = roles.includes('education_secretary')

    if (!isSuperadmin && !isEducationSecretary) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only superadmins and education secretaries can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If user is education_secretary, ensure they can only create users for their tenant
    const requestingUserTenantId = profile.tenant_id

    // Get request body
    const { email, fullName, role, tenantId: rawTenantId, schoolId: rawSchoolId }: CreateUserRequest = await req.json()
    
    // Convert empty string to null
    let tenantId = rawTenantId && rawTenantId !== '' ? rawTenantId : null
    let schoolId = rawSchoolId && rawSchoolId !== '' ? rawSchoolId : null

    // If user is education_secretary, they can only create users for their tenant
    if (isEducationSecretary) {
      if (!requestingUserTenantId) {
        return new Response(
          JSON.stringify({ error: 'Secretário de educação deve estar associado a uma rede de ensino' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Force tenantId to be the secretary's tenant
      tenantId = requestingUserTenantId

      // Verify school belongs to secretary's tenant if provided
      if (schoolId) {
        const { data: school, error: schoolError } = await supabaseClient
          .from('schools')
          .select('id, tenant_id')
          .eq('id', schoolId)
          .single()

        if (schoolError || !school || school.tenant_id !== requestingUserTenantId) {
          return new Response(
            JSON.stringify({ error: 'Escola não pertence à rede do secretário' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the user WITHOUT password - will send password recovery email
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      email_confirm: true, // Email already confirmed since admin is creating
      user_metadata: {
        full_name: fullName,
        role,
        tenant_id: tenantId,
      },
    })

    if (createError) {
      // Check if it's a rate limit error
      if (createError.message.includes('For security purposes')) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit atingido. Por favor, aguarde 30 segundos antes de criar outro usuário.',
            rateLimitError: true 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create profile in profiles table
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        full_name: fullName,
        role: role,
        tenant_id: tenantId,
        school_id: schoolId, // School ID if provided
        is_active: true
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Try to delete the auth user if profile creation fails
      await supabaseClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user_roles entry
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role
      })

    if (roleError) {
      console.error('Error creating user_roles:', roleError)
      // Continue anyway - role is already in profile
    }

    // Try to send password recovery email with retry logic
    let resetError = null
    let retries = 3
    
    for (let i = 0; i < retries; i++) {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/auth`,
        }
      )
      
      if (!error) {
        resetError = null
        break
      }
      
      // If it's a rate limit error, wait and retry
      if (error.message.includes('For security purposes') && i < retries - 1) {
        console.log(`Rate limit hit, waiting before retry ${i + 1}/${retries}...`)
        await new Promise(resolve => setTimeout(resolve, 10000)) // Wait 10 seconds
        continue
      }
      
      resetError = error
    }

    if (resetError) {
      console.error('Error sending password setup email after retries:', resetError)
      // User was created, but email failed - return success with warning
      return new Response(
        JSON.stringify({ 
          user: newUser,
          warning: 'Usuário criado com sucesso, mas o email de configuração de senha não pôde ser enviado. Por favor, use a função "Resetar Senha" manualmente.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ user: newUser }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

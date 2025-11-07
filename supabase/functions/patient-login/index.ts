import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { cpf, password } = await req.json()

    // Find patient by CPF
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("cpf", cpf)
      .single()

    if (patientError || !patient) {
      throw new Error("Paciente não encontrado")
    }

    // Check password
    const isValidPassword = 
      password === patient.temporary_password || 
      password === patient.fixed_password

    if (!isValidPassword) {
      throw new Error("Senha inválida")
    }

    // Check if user exists in auth.users
    let userId = patient.id
    
    // If patient doesn't have auth user, create one
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === patient.email)
    
    if (!existingUser && patient.email) {
      // Create auth user for patient
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: patient.email,
        password: patient.fixed_password || patient.temporary_password,
        email_confirm: true,
        user_metadata: {
          full_name: patient.full_name,
          cpf: patient.cpf,
        },
      })

      if (authError) throw authError
      
      userId = authData.user.id

      // Create patient role
      await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "patient",
          active: true,
        })
    } else if (existingUser) {
      userId = existingUser.id
    }

    // Generate session token by signing in
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: patient.email || '',
      password: patient.fixed_password || patient.temporary_password || '',
    })

    if (sessionError) throw sessionError

    return new Response(
      JSON.stringify({ 
        success: true, 
        session: sessionData.session,
        patient: {
          id: patient.id,
          full_name: patient.full_name,
          cpf: patient.cpf,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

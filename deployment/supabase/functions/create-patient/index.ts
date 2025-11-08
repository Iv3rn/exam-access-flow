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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await req.json()
    const { cpf, full_name, email, phone, password, created_by } = body

    if (!cpf || !full_name || !password) {
      throw new Error('CPF, nome completo e senha são obrigatórios')
    }

    // Normalize CPF
    const digits = cpf.replace(/\D/g, '')
    const formatted = digits.length === 11
      ? `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`
      : cpf

    // Check if patient already exists
    const { data: existing } = await supabaseAdmin
      .from('patients')
      .select('id')
      .or(`cpf.eq.${digits},cpf.eq.${formatted}`)
      .single()

    if (existing) {
      throw new Error('Paciente com este CPF já existe')
    }

    // Create auth user with deterministic email
    const authEmail = `patient+${digits}@patients.local`
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
      },
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('Erro ao criar usuário')
    }

    // Create patient record
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({
        cpf: formatted,
        full_name,
        email,
        phone,
        user_id: authData.user.id,
        created_by: created_by || authData.user.id,
      })
      .select()
      .single()

    if (patientError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw patientError
    }

    // Assign patient role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'patient',
        active: true,
      })

    if (roleError) throw roleError

    return new Response(
      JSON.stringify({ success: true, patient, user_id: authData.user.id }),
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

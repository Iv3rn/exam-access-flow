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

    const body = await req.json()
    const { cpf, full_name, email, phone, gender, password, created_by } = body

    // Validate inputs
    if (!cpf || !full_name || !password) {
      throw new Error('CPF, nome completo e senha são obrigatórios')
    }

    // Normalize CPF
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) {
      throw new Error('CPF inválido')
    }

    // Check if patient already exists
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('cpf', cpf)
      .maybeSingle()

    if (existingPatient) {
      throw new Error('Paciente já cadastrado com este CPF')
    }

    // Create deterministic auth email based on CPF
    const authEmail = `patient+${digits}@patients.local`

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name, cpf },
    })

    if (authError) {
      throw new Error(`Erro ao criar autenticação: ${authError.message}`)
    }

    if (!authUser.user) {
      throw new Error('Erro ao criar usuário')
    }

    // Create patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        cpf,
        full_name,
        email,
        phone,
        gender,
        user_id: authUser.user.id,
        created_by,
      })
      .select()
      .single()

    if (patientError) {
      // Rollback: delete auth user if patient creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Erro ao criar paciente: ${patientError.message}`)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: created_by,
      action: 'create',
      entity_type: 'patient',
      entity_id: patient.id,
      details: {
        patient_name: full_name,
        patient_cpf: cpf,
      },
    })

    // Assign patient role
    await supabase
      .from('user_roles')
      .insert({ user_id: authUser.user.id, role: 'patient', active: true })

    return new Response(
      JSON.stringify({ success: true, user_id: authUser.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
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
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
    const cpfInput: string = (body?.cpf ?? '').toString()
    const password: string = (body?.password ?? '').toString()

    // Normalize CPF (digits only) and build formatted version 000.000.000-00
    const digits = cpfInput.replace(/\D/g, '')
    const formatted = digits.length === 11
      ? `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`
      : cpfInput

    // Find patient by CPF (accept formatted or unformatted)
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .or(`cpf.eq.${digits},cpf.eq.${formatted}`)
      .single()

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado')
    }

    // Check password
    const isValidPassword =
      password === (patient.temporary_password || '') ||
      password === (patient.fixed_password || '')

    if (!isValidPassword) {
      throw new Error('Senha inválida')
    }

    // Build deterministic auth email for patient based on CPF
    const authEmail = `patient+${digits}@patients.local`

    // Try to create or update auth user with current password
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: patient.full_name, cpf: patient.cpf },
    })

    let userId = createdUser?.user?.id || ''

    if (createError) {
      // If already exists, fetch and update password
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users?.users.find(u => u.email === authEmail)
      if (existingUser) {
        userId = existingUser.id
        await supabase.auth.admin.updateUserById(existingUser.id, { password })
      } else {
        throw createError
      }
    }

    // Map auth user to patient record
    if (userId) {
      await supabase
        .from('patients')
        .update({ user_id: userId })
        .or(`cpf.eq.${digits},cpf.eq.${formatted}`)

      await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'patient', active: true })
        
    }

    return new Response(
      JSON.stringify({ success: true, email: authEmail }),
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

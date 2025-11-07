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
      .or(`cpf.eq.${cpfInput},cpf.eq.${formatted}`)
      .single()

    if (patientError || !patient) {
      throw new Error('Paciente não encontrado')
    }

    // Check password
    const isValidPassword =
      password === patient.temporary_password ||
      password === patient.fixed_password

    if (!isValidPassword) {
      throw new Error('Senha inválida')
    }

    // Ensure auth user exists (create if missing). Ignore error if already exists
    if (patient.email) {
      const created = await supabase.auth.admin.createUser({
        email: patient.email,
        password: password, // use the password the patient typed
        email_confirm: true,
        user_metadata: { full_name: patient.full_name, cpf: patient.cpf },
      })
      if (created.error && !`${created.error.message}`.toLowerCase().includes('already')) {
        // If it's not the "user already exists" case, throw
        throw created.error
      }
    }

    return new Response(
      JSON.stringify({ success: true, email: patient.email }),
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

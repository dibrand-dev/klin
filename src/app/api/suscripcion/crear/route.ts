import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { preApproval, PLANES_KLIA, getMonto, type PlanKlia, type Modalidad } from '@/lib/mercadopago'
import type { Database } from '@/types/database'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { plan, modalidad } = body as {
    plan: PlanKlia
    modalidad: Modalidad
  }

  if (!PLANES_KLIA[plan]) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  const monto = getMonto(plan, modalidad)
  const planInfo = PLANES_KLIA[plan]

  const result = await preApproval.create({
    body: {
      reason: `${planInfo.nombre} - ${modalidad === 'mensual' ? 'Mensual' : 'Anual'}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: monto,
        currency_id: 'ARS',
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.klia.com.ar'}/suscripcion/resultado`,
      payer_email: user.email!,
      status: 'pending',
    },
  })

  if (!result.id || !result.init_point) {
    return NextResponse.json({ error: 'Error al crear suscripción en Mercado Pago' }, { status: 500 })
  }

  const { error: dbError } = await serviceClient()
    .from('suscripciones')
    .insert({
      terapeuta_id: user.id,
      plan,
      modalidad,
      mp_preapproval_id: result.id,
      estado: 'pending',
      monto,
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ init_point: result.init_point })
}

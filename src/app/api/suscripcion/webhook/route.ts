import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { preApproval } from '@/lib/mercadopago'
import type { Database } from '@/types/database'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== 'subscription_preapproval') {
      return NextResponse.json({ ok: true })
    }

    const preapprovalId: string = body.data?.id
    if (!preapprovalId) return NextResponse.json({ ok: true })

    const detail = await preApproval.get({ id: preapprovalId })
    const status = detail.status

    const db = serviceClient()

    if (status === 'authorized') {
      await db
        .from('suscripciones')
        .update({
          estado: 'authorized',
          suscripcion_inicio: new Date().toISOString(),
          suscripcion_fin: detail.next_payment_date ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('mp_preapproval_id', preapprovalId)

      const { data: sub } = await db
        .from('suscripciones')
        .select('terapeuta_id, plan')
        .eq('mp_preapproval_id', preapprovalId)
        .single()

      if (sub) {
        await db
          .from('profiles')
          .update({
            estado_cuenta: 'activa',
            plan: sub.plan as 'esencial' | 'profesional' | 'premium',
            suscripcion_inicio: new Date().toISOString(),
            suscripcion_fin: detail.next_payment_date ?? null,
            mp_subscription_id: preapprovalId,
          })
          .eq('id', sub.terapeuta_id)
      }
    } else if (status === 'paused') {
      await db
        .from('suscripciones')
        .update({ estado: 'paused', updated_at: new Date().toISOString() })
        .eq('mp_preapproval_id', preapprovalId)

      const { data: sub } = await db
        .from('suscripciones')
        .select('terapeuta_id')
        .eq('mp_preapproval_id', preapprovalId)
        .single()

      if (sub) {
        await db
          .from('profiles')
          .update({ estado_cuenta: 'bloqueada' })
          .eq('id', sub.terapeuta_id)
      }
    } else if (status === 'cancelled') {
      await db
        .from('suscripciones')
        .update({ estado: 'cancelled', updated_at: new Date().toISOString() })
        .eq('mp_preapproval_id', preapprovalId)

      const { data: sub } = await db
        .from('suscripciones')
        .select('terapeuta_id')
        .eq('mp_preapproval_id', preapprovalId)
        .single()

      if (sub) {
        await db
          .from('profiles')
          .update({ estado_cuenta: 'cancelada' })
          .eq('id', sub.terapeuta_id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { preApproval } from '@/lib/mercadopago'
import type { Database } from '@/types/database'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: sub, error: subError } = await supabase
    .from('suscripciones')
    .select('id, mp_preapproval_id, suscripcion_fin')
    .eq('terapeuta_id', user.id)
    .eq('estado', 'authorized')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subError || !sub) {
    return NextResponse.json({ error: 'No se encontró suscripción activa' }, { status: 404 })
  }

  if (sub.mp_preapproval_id) {
    try {
      await preApproval.update({
        id: sub.mp_preapproval_id,
        body: { status: 'cancelled' },
      })
    } catch {
      // Continuar aunque MP falle — actualizamos la DB de todas formas
    }
  }

  const db = serviceClient()

  await db
    .from('suscripciones')
    .update({ estado: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', sub.id)

  await db
    .from('profiles')
    .update({ estado_cuenta: 'cancelada' })
    .eq('id', user.id)

  return NextResponse.json({ ok: true, acceso_hasta: sub.suscripcion_fin })
}

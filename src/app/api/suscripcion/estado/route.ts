import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('suscripciones')
    .select('estado, plan, modalidad, suscripcion_fin, mp_preapproval_id, monto')
    .eq('terapeuta_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return NextResponse.json({ estado: null })
  }

  return NextResponse.json(data)
}

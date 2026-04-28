import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { sync_enabled } = await req.json() as { sync_enabled: boolean }

  const { error } = await supabase
    .from('google_calendar_tokens')
    .update({ sync_enabled, updated_at: new Date().toISOString() })
    .eq('terapeuta_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, sync_enabled })
}

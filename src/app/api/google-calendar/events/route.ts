import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedClient, obtenerEventosGoogle } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!start || !end) return NextResponse.json([])

  const { data: tokens } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('terapeuta_id', user.id)
    .eq('sync_enabled', true)
    .single()

  if (!tokens) return NextResponse.json([])

  try {
    const calendarClient = await getAuthenticatedClient(tokens)
    const eventos = await obtenerEventosGoogle(
      calendarClient,
      new Date(start),
      new Date(end),
      tokens.calendar_id || 'primary',
    )
    return NextResponse.json(eventos.map((e) => ({
      ...e,
      inicio: e.inicio.toISOString(),
      fin: e.fin.toISOString(),
    })))
  } catch {
    return NextResponse.json([])
  }
}

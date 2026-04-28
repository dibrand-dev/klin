import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgendaSemanal from '@/components/agenda/AgendaSemanal'
import { startOfWeek, endOfWeek } from 'date-fns'
import type { Turno } from '@/types/database'
import { getAuthenticatedClient, obtenerEventosGoogle } from '@/lib/google-calendar'

export const metadata = { title: 'Agenda — KLIA' }

export default async function AgendaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const ahora = new Date()
  const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 })
  const finSemana = endOfWeek(ahora, { weekStartsOn: 1 })

  const [{ data: turnos }, { data: pacientes }, { data: googleTokens }] = await Promise.all([
    supabase
      .from('turnos')
      .select('*, paciente:pacientes(*)')
      .eq('terapeuta_id', user.id)
      .gte('fecha_hora', inicioSemana.toISOString())
      .lte('fecha_hora', finSemana.toISOString())
      .order('fecha_hora'),
    supabase
      .from('pacientes')
      .select('*')
      .eq('terapeuta_id', user.id)
      .eq('activo', true)
      .order('apellido'),
    supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('terapeuta_id', user.id)
      .eq('sync_enabled', true)
      .maybeSingle(),
  ])

  let googleEventsIniciales: { id: string; titulo: string; inicio: string; fin: string }[] = []
  if (googleTokens) {
    try {
      const calendarClient = await getAuthenticatedClient(googleTokens)
      const eventos = await obtenerEventosGoogle(calendarClient, inicioSemana, finSemana, googleTokens.calendar_id || 'primary')
      googleEventsIniciales = eventos.map((e) => ({
        ...e,
        inicio: e.inicio.toISOString(),
        fin: e.fin.toISOString(),
      }))
    } catch {
      // Google Calendar fetch errors are non-fatal
    }
  }

  return (
    <div className="pt-4 md:pt-8">
      <AgendaSemanal
        turnosIniciales={(turnos ?? []) as unknown as Turno[]}
        pacientes={pacientes ?? []}
        terapeutaId={user.id}
        googleConnected={!!googleTokens}
        googleEventsIniciales={googleEventsIniciales}
      />
    </div>
  )
}

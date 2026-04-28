import { createClient as createServiceClient } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import {
  getAuthenticatedClient,
  crearEventoCalendario,
  eliminarEventoCalendario,
} from './google-calendar'
import type { Database } from '@/types/database'

function db() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function sincronizarTurnoCreado(turnoId: string, terapeutaId: string) {
  const supabase = db()

  const { data: tokens } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('terapeuta_id', terapeutaId)
    .eq('sync_enabled', true)
    .single()

  if (!tokens) return

  const { data: turno } = await supabase
    .from('turnos')
    .select('*, paciente:pacientes(nombre, apellido)')
    .eq('id', turnoId)
    .single()

  if (!turno) return
  const paciente = turno.paciente as { nombre: string; apellido: string } | null
  if (!paciente) return

  const calendarClient = await getAuthenticatedClient(tokens)
  const fecha = format(parseISO(turno.fecha_hora), 'yyyy-MM-dd')
  const hora = format(parseISO(turno.fecha_hora), 'HH:mm')

  const eventId = await crearEventoCalendario(
    calendarClient,
    {
      paciente_nombre: paciente.nombre,
      paciente_apellido: paciente.apellido,
      fecha,
      hora,
      duracion: turno.duracion_min,
      modalidad: turno.modalidad,
    },
    tokens.calendar_id || 'primary',
  )

  await supabase.from('turnos').update({ google_event_id: eventId }).eq('id', turnoId)
}

export async function sincronizarTurnoCancelado(turnoId: string, terapeutaId: string) {
  const supabase = db()

  const { data: tokens } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('terapeuta_id', terapeutaId)
    .single()

  if (!tokens) return

  const { data: turno } = await supabase
    .from('turnos')
    .select('google_event_id')
    .eq('id', turnoId)
    .single()

  if (!turno?.google_event_id) return

  const calendarClient = await getAuthenticatedClient(tokens)
  await eliminarEventoCalendario(calendarClient, turno.google_event_id, tokens.calendar_id || 'primary')
  await supabase.from('turnos').update({ google_event_id: null }).eq('id', turnoId)
}

export async function sincronizarSerieRecurrente(serieId: string, terapeutaId: string) {
  const supabase = db()

  const { data: tokens } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('terapeuta_id', terapeutaId)
    .eq('sync_enabled', true)
    .single()

  if (!tokens) return

  const { data: turnos } = await supabase
    .from('turnos')
    .select('id')
    .eq('serie_recurrente_id', serieId)
    .eq('terapeuta_id', terapeutaId)
    .gte('fecha_hora', new Date().toISOString())
    .in('estado', ['pendiente', 'confirmado'])

  if (!turnos || turnos.length === 0) return

  await Promise.all(turnos.map((t) => sincronizarTurnoCreado(t.id, terapeutaId)))
}

export async function sincronizarSerieCancelada(
  serieId: string,
  terapeutaId: string,
  desdeFecha: string,
) {
  const supabase = db()

  const { data: tokens } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('terapeuta_id', terapeutaId)
    .single()

  if (!tokens) return

  const { data: turnos } = await supabase
    .from('turnos')
    .select('id, google_event_id')
    .eq('serie_recurrente_id', serieId)
    .gte('fecha_hora', desdeFecha)
    .in('estado', ['pendiente', 'confirmado'])
    .not('google_event_id', 'is', null)

  if (!turnos || turnos.length === 0) return

  const calendarClient = await getAuthenticatedClient(tokens)
  await Promise.all(
    turnos
      .filter((t) => t.google_event_id)
      .map((t) => eliminarEventoCalendario(calendarClient, t.google_event_id!, tokens.calendar_id || 'primary')),
  )
}

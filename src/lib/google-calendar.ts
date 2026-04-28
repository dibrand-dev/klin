import { google, calendar_v3 } from 'googleapis'

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

export function getAuthUrl(terapeutaId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: terapeutaId,
  })
}

export async function getAuthenticatedClient(tokens: {
  access_token: string
  refresh_token: string
  token_expiry: string
}): Promise<calendar_v3.Calendar> {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.token_expiry).getTime(),
  })
  return google.calendar({ version: 'v3', auth: client })
}

export async function crearEventoCalendario(
  calendarClient: calendar_v3.Calendar,
  turno: {
    paciente_nombre: string
    paciente_apellido: string
    fecha: string
    hora: string
    duracion: number
    modalidad: string
  },
  calendarId = 'primary',
): Promise<string> {
  const inicio = new Date(`${turno.fecha}T${turno.hora}`)
  const fin = new Date(inicio.getTime() + turno.duracion * 60000)

  const evento = await calendarClient.events.insert({
    calendarId,
    requestBody: {
      summary: `${turno.paciente_apellido}, ${turno.paciente_nombre} | Sesión`,
      start: {
        dateTime: inicio.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: fin.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      description: 'Sesión registrada en KLIA',
      source: { title: 'KLIA', url: 'https://app.klia.com.ar' },
    },
  })
  return evento.data.id!
}

export async function eliminarEventoCalendario(
  calendarClient: calendar_v3.Calendar,
  eventId: string,
  calendarId = 'primary',
): Promise<void> {
  try {
    await calendarClient.events.delete({ calendarId, eventId })
  } catch {
    // Ignorar si el evento ya no existe en Google
  }
}

export type GoogleEventItem = {
  id: string
  titulo: string
  inicio: Date
  fin: Date
}

export async function obtenerEventosGoogle(
  calendarClient: calendar_v3.Calendar,
  fechaInicio: Date,
  fechaFin: Date,
  calendarId = 'primary',
): Promise<GoogleEventItem[]> {
  const response = await calendarClient.events.list({
    calendarId,
    timeMin: fechaInicio.toISOString(),
    timeMax: fechaFin.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (response.data.items ?? [])
    .filter((e) => e.id && (e.start?.dateTime || e.start?.date))
    .map((e) => ({
      id: e.id!,
      titulo: e.summary || 'Ocupado',
      inicio: new Date(e.start!.dateTime ?? e.start!.date!),
      fin: new Date(e.end!.dateTime ?? e.end!.date!),
    }))
}

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import PacienteHeader, { type SummaryData } from '@/components/pacientes/PacienteHeader'
import PacienteTabs from '@/components/pacientes/PacienteTabs'
import type { NotaClinica, TurnoRow } from '@/types/database'

export const metadata = { title: 'Historial clínico — ConsultorioApp' }

function limpiarMarkdown(texto: string): string {
  return texto
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[completar\]/g, '')
    .trim()
}

function previewContenido(texto: string): string {
  return limpiarMarkdown(texto.split('\n').filter((l) => l.trim()).join(' '))
}

function primeraLinea(texto: string): string {
  const clean = limpiarMarkdown(texto)
  const firstLine = clean.split('\n').find((l) => l.trim()) || clean
  return firstLine.trim()
}

function extraerTags(texto: string): string[] {
  const clean = limpiarMarkdown(texto)
  const matches = clean.match(/#[a-zA-Z0-9_-]+/g)
  if (!matches) return []
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase()))).slice(0, 4)
}

const MONTH_FULL: Record<string, string> = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
}

export default async function HistorialPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: paciente }, { data: notas }, { data: turnos }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*')
      .eq('id', params.id)
      .eq('terapeuta_id', user.id)
      .single(),
    supabase
      .from('notas_clinicas')
      .select('*')
      .eq('paciente_id', params.id)
      .eq('terapeuta_id', user.id)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('turnos')
      .select('*')
      .eq('paciente_id', params.id)
      .eq('terapeuta_id', user.id)
      .order('fecha_hora', { ascending: true }),
  ])

  if (!paciente) notFound()

  const turnosList = turnos || []
  const now = new Date()
  const sesionesRealizadas = turnosList.filter((t) => t.estado === 'realizado').length
  const proximaSesion = turnosList.find((t) => new Date(t.fecha_hora) >= now && t.estado !== 'cancelado' && t.estado !== 'no_asistio') || null
  const tratamientoDesde = turnosList[0]?.fecha_hora ?? paciente.created_at
  const impagosTurnos = turnosList.filter((t) => t.estado === 'realizado' && !t.pagado)
  const impagos = impagosTurnos.length
  const montoImpago = impagosTurnos.reduce((sum, t) => sum + (t.monto ?? 0), 0)

  const summary: SummaryData = {
    sesionesRealizadas,
    proximaSesion,
    tratamientoDesde,
    impagos,
    montoImpago,
  }

  const turnosById = new Map<string, TurnoRow>()
  for (const t of turnosList) turnosById.set(t.id, t)

  const notasList = notas || []
  const totalNotas = notasList.length
  const turnosCount = turnosList.filter((t) => t.estado !== 'cancelado').length

  const grouped: Record<string, NotaClinica[]> = {}
  for (const nota of notasList) {
    const key = format(parseISO(nota.fecha), 'yyyy-MM')
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(nota)
  }
  const sortedMonths = Object.keys(grouped).sort().reverse()

  const chronological = [...notasList].sort((a, b) => (a.fecha + a.created_at).localeCompare(b.fecha + b.created_at))
  const sessionNoMap = new Map<string, number>()
  chronological.forEach((n, idx) => sessionNoMap.set(n.id, idx + 1))

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 md:px-7 pb-20">
      <PacienteHeader paciente={paciente} summary={summary} />
      <PacienteTabs
        pacienteId={paciente.id}
        active="historial"
        historialCount={totalNotas}
        turnosCount={turnosCount}
      />

      {totalNotas === 0 ? (
        <div className="mt-6 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest p-10 text-center">
          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 28 }}>clinical_notes</span>
          </div>
          <h3 className="text-[15px] font-bold text-on-surface mb-1 tracking-tight">Todavía no hay notas para este paciente</h3>
          <p className="text-[13px] text-on-surface-variant mb-5">Las notas aparecen al marcar un turno como realizado o podés crearlas manualmente.</p>
          <Link
            href={`/pacientes/${params.id}/historial/nueva`}
            className="btn-primary inline-flex"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Crear primera nota
          </Link>
        </div>
      ) : (
        <div className="pt-5 flex flex-col gap-7">
          {sortedMonths.map((monthKey) => {
            const [year, mm] = monthKey.split('-')
            const monthLabel = `${MONTH_FULL[mm]} ${year}`
            const monthNotas = grouped[monthKey]
            return (
              <div key={monthKey}>
                {/* Sticky month header */}
                <div className="sticky top-0 z-[5] -mx-4 md:-mx-7 px-4 md:px-7 py-2 mb-3 flex items-center gap-3 bg-surface/90 backdrop-blur-sm border-b border-outline-variant/20">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-widest">
                    {monthLabel}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {monthNotas.length} {monthNotas.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                  <span className="flex-1 h-px bg-outline-variant/30" />
                </div>

                <div className="flex flex-col gap-3">
                  {monthNotas.map((nota) => {
                    const fecha = parseISO(nota.fecha)
                    const day = format(fecha, 'd')
                    const monthShort = format(fecha, 'MMM', { locale: es }).replace('.', '')
                    const dow = format(fecha, 'EEEE', { locale: es })
                    const time = format(parseISO(nota.created_at), 'HH:mm')
                    const title = primeraLinea(nota.contenido)
                    const excerpt = previewContenido(nota.contenido)
                    const tags = extraerTags(nota.contenido)
                    const sessionNo = sessionNoMap.get(nota.id) ?? 0

                    const turno = nota.turno_id ? turnosById.get(nota.turno_id) : null
                    const modalidad = turno?.modalidad
                    const modalidadLabel =
                      modalidad === 'videollamada' ? 'Virtual'
                      : modalidad === 'telefonica' ? 'Telefónica'
                      : modalidad === 'presencial' ? 'Presencial'
                      : null
                    const duracionLabel = turno?.duracion_min ? `${turno.duracion_min} min` : null
                    const estadoLabel =
                      turno?.estado === 'realizado' ? 'Realizada'
                      : turno?.estado === 'cancelado' ? 'Cancelada'
                      : turno?.estado === 'no_asistio' ? 'No asistió'
                      : null
                    const estadoColor =
                      turno?.estado === 'realizado' ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                      : turno?.estado === 'cancelado' ? 'bg-error-container text-on-error-container'
                      : turno?.estado === 'no_asistio' ? 'bg-surface-container text-on-surface-variant'
                      : ''

                    return (
                      <Link
                        key={nota.id}
                        href={`/pacientes/${params.id}/historial/${nota.id}`}
                        className="block group"
                      >
                        <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col md:flex-row transition-all duration-150 group-hover:shadow-card group-hover:border-outline-variant/30">
                          {/* Date column */}
                          <div className="md:w-32 bg-surface-container-low/40 p-5 flex-none flex flex-row md:flex-col items-center md:items-center justify-start md:justify-center gap-3 md:gap-0 md:text-center border-b md:border-b-0 md:border-r border-outline-variant/10">
                            <div className="md:mb-1">
                              <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 hidden md:block">{monthShort}</div>
                              <div className="text-4xl font-extrabold text-primary leading-none">{day}</div>
                              <div className="text-[10px] font-medium text-slate-400 capitalize mt-1 hidden md:block">{dow}</div>
                            </div>
                            <div className="md:mt-2">
                              <span className="text-xs font-bold text-primary/60">{time}</span>
                              <span className="md:hidden text-[10px] text-slate-400 ml-2 capitalize">{dow} {monthShort}</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 md:p-6 min-w-0">
                            <div className="flex items-start gap-2 mb-2 flex-wrap">
                              <span className="text-[15px] font-extrabold text-primary tracking-tight leading-snug flex-1 min-w-0">
                                {title}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {sessionNo > 0 && (
                                <span className="bg-primary-fixed text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  Sesión #{String(sessionNo).padStart(3, '0')}
                                </span>
                              )}
                              {modalidadLabel && (
                                <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                  {modalidadLabel}
                                </span>
                              )}
                              {duracionLabel && (
                                <span className="bg-surface-container text-on-surface-variant text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                  {duracionLabel}
                                </span>
                              )}
                              {estadoLabel && (
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${estadoColor}`}>
                                  {estadoLabel}
                                </span>
                              )}
                            </div>

                            <p
                              className="text-[13px] text-slate-500 leading-relaxed border-l-4 border-primary/20 pl-3 mb-3 overflow-hidden"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                textWrap: 'pretty',
                              } as React.CSSProperties}
                            >
                              {excerpt}
                            </p>

                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right panel */}
                          <div className="md:w-44 bg-surface-container-lowest/50 border-t md:border-t-0 md:border-l border-outline-variant/10 p-5 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-3 flex-none">
                            <div className="hidden md:flex flex-col gap-1">
                              {turno?.estado === 'realizado' && (
                                <span className="flex items-center gap-1.5 text-[11px] font-bold text-on-tertiary-container">
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                                  Sesión realizada
                                </span>
                              )}
                              {turno?.monto && (
                                <span className="text-[11px] text-on-surface-variant font-medium">
                                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(turno.monto)}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-primary bg-primary-fixed/30 hover:bg-primary-fixed rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap group-hover:bg-primary-fixed">
                              Ver nota completa
                            </span>
                          </div>
                        </article>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

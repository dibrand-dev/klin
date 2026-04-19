import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

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

export default async function HistorialPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: paciente }, { data: notas }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('nombre, apellido')
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
  ])

  if (!paciente) notFound()

  // Group notes by month key 'yyyy-MM'
  const grouped: Record<string, NonNullable<typeof notas>> = {}
  if (notas) {
    for (const nota of notas) {
      const key = format(parseISO(nota.fecha), 'yyyy-MM')
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(nota)
    }
  }
  const sortedMonths = Object.keys(grouped).sort().reverse()

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/pacientes/${params.id}`}
            className="p-2 -ml-2 text-[#8A93A1] hover:text-[#1F2937] rounded-lg hover:bg-[#F6F7F9] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-[#0B1220]">Historial clínico</h1>
            <p className="text-sm text-[#5B6472] capitalize">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>
        <Link
          href={`/pacientes/${params.id}/historial/nueva`}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva nota
        </Link>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-xl bg-[#F6F7F9] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#AEB5C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-medium text-[#1F2937] text-sm">Todavía no hay notas para este paciente</p>
          <p className="text-xs text-[#8A93A1] mt-1.5">Las notas aparecen después de marcar un turno como realizado</p>
          <Link
            href={`/pacientes/${params.id}/historial/nueva`}
            className="inline-block mt-5 text-sm font-medium px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Nueva nota
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((monthKey) => {
            const monthLabel = format(parseISO(monthKey + '-01'), 'MMMM yyyy', { locale: es })
            const monthNotas = grouped[monthKey]
            return (
              <div key={monthKey}>
                {/* Month header */}
                <div className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-3"
                  style={{ background: 'linear-gradient(to bottom, #F9FAFB 70%, transparent)' }}>
                  <h2 className="text-xs font-semibold text-[#5B6472] uppercase tracking-widest capitalize">
                    {monthLabel}
                  </h2>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {monthNotas.map((nota) => {
                    const fecha = parseISO(nota.fecha)
                    const dia = format(fecha, 'd')
                    const mesAnio = format(fecha, 'MMM. yyyy', { locale: es })
                    const hora = format(parseISO(nota.created_at), 'HH:mm')
                    const preview = previewContenido(nota.contenido)

                    return (
                      <Link key={nota.id} href={`/pacientes/${params.id}/historial/${nota.id}`} className="block group">
                        <div className="bg-white border border-[#E7E9EE] rounded-xl overflow-hidden group-hover:border-[#D6DAE1] group-hover:shadow-sm transition-all duration-150">
                          <div className="flex">
                            {/* Date column */}
                            <div className="flex flex-col items-center justify-center px-4 py-4 border-r border-[#E7E9EE] text-center flex-shrink-0 w-[78px]">
                              <span className="text-[26px] font-semibold leading-none text-[#0B1220]">{dia}</span>
                              <span className="text-[11px] uppercase tracking-wide text-[#5B6472] mt-1 capitalize leading-none">{mesAnio}</span>
                              <span className="font-mono text-[12px] text-[#8A93A1] mt-1.5">{hora}</span>
                            </div>

                            {/* Body */}
                            <div className="flex-1 p-4 min-w-0">
                              <p className="text-sm text-[#1F2937] line-clamp-2 leading-relaxed">{preview}</p>
                              <div className="flex items-center justify-end mt-3">
                                <span className="text-xs font-medium text-primary-600 group-hover:text-primary-700 transition-colors">
                                  Ver nota →
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
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

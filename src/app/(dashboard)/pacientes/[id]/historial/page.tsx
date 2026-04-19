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
      .order('created_at', { ascending: false }),
  ])

  if (!paciente) notFound()

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/pacientes/${params.id}`}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Historial clínico</h1>
            <p className="text-sm text-gray-500 capitalize">{paciente.nombre} {paciente.apellido}</p>
          </div>
        </div>
        <Link
          href={`/pacientes/${params.id}/historial/nueva`}
          className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva nota
        </Link>
      </div>

      {!notas || notas.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium text-gray-700 text-sm">Todavía no hay notas para este paciente</p>
          <p className="text-xs text-gray-400 mt-1.5">Las notas aparecen después de marcar un turno como realizado</p>
          <Link
            href={`/pacientes/${params.id}/historial/nueva`}
            className="btn-primary inline-block mt-5 text-sm"
          >
            Nueva nota
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notas.map((nota) => {
            const fechaStr = format(parseISO(nota.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
            const horaStr = format(parseISO(nota.created_at), 'HH:mm')
            return (
              <Link key={nota.id} href={`/pacientes/${params.id}/historial/${nota.id}`} className="block group">
                <div className="bg-white border border-gray-100 border-l-4 border-l-primary-500 rounded-xl p-4 shadow-sm group-hover:shadow-md group-hover:border-l-primary-600 transition-all duration-200 cursor-pointer">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide capitalize mb-0.5">
                    {fechaStr} · {horaStr}hs
                  </p>
                  <hr className="border-gray-100 my-2" />
                  <p className="text-sm text-gray-700 line-clamp-3">{previewContenido(nota.contenido)}</p>
                  <p className="text-xs font-medium text-primary-600 mt-2.5 text-right">Ver →</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

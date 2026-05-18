'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

type Props = {
  turnoId: string
  pacienteId: string
  pacienteNombre: string
  pacienteAge: string
  pacienteOS: string
  turnoHora: string
  modalidad: string
  initialSummary: string | null
  onClose: () => void
}

export default function ResumenIA({
  turnoId,
  pacienteId,
  pacienteNombre,
  pacienteAge,
  pacienteOS,
  turnoHora,
  modalidad,
  initialSummary,
  onClose,
}: Props) {
  const [summary, setSummary] = useState<string | null>(initialSummary)
  const [loading, setLoading] = useState(false)
  const [cached, setCached] = useState(!!initialSummary)
  const [error, setError] = useState<string | null>(null)

  const initials = pacienteNombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function generarResumen() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/atenciones/resumen-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turnoId, paciente_id: pacienteId }),
      })
      if (!res.ok) throw new Error('Error al generar resumen')
      const data = await res.json() as { summary: string; cached: boolean }
      setSummary(data.summary)
      setCached(data.cached)
    } catch {
      setError('No se pudo generar el resumen. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* SlideOver */}
      <aside className="fixed top-0 right-0 bottom-0 w-[520px] max-w-full bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div
          className="px-5 py-4 border-b border-gray-100 flex items-start gap-3"
          style={{ background: 'linear-gradient(180deg,#f0f4ff 0%,transparent 100%)' }}
        >
          <div
            className="w-11 h-11 rounded-xl flex-none grid place-items-center font-semibold text-base"
            style={{ background: 'linear-gradient(145deg,#E3E9F6,#C9D3E9)', color: '#16389F' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-[15px] leading-tight">{pacienteNombre}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-1.5 items-center">
              <span>{pacienteAge}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{pacienteOS || 'Particular'}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{turnoHora} · {modalidad === 'videollamada' ? 'Virtual' : 'Presencial'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center hover:bg-gray-100 transition-colors flex-none"
          >
            <span className="material-symbols-outlined text-[18px] text-gray-500">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* State 1 — not generated */}
          {!summary && !loading && (
            <>
              <div
                className="rounded-xl p-6 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#F4F0FE 0%,#EAF0FE 100%)', border: '1px solid #d4c9f5' }}
              >
                <div
                  className="w-11 h-11 rounded-xl mx-auto mb-3 grid place-items-center"
                  style={{ background: 'linear-gradient(135deg,#5B3DC9 0%,#1F4FD9 100%)', boxShadow: '0 8px 18px rgba(91,61,201,.32)' }}
                >
                  <span className="material-symbols-outlined text-white text-[20px]">auto_awesome</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-[15px] mb-1.5">¿Querés preparar la sesión?</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Generá un resumen con IA basado en el historial clínico, medicamentos actuales e interconsultas de este paciente.
                </p>
                {error && (
                  <p className="text-xs text-red-600 mb-3">{error}</p>
                )}
                <button
                  onClick={generarResumen}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#5B3DC9 0%,#1F4FD9 100%)', boxShadow: '0 4px 12px rgba(31,79,217,.32)' }}
                >
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  Generar Resumen Inteligente
                </button>
              </div>
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex gap-2.5 text-xs text-gray-500">
                <span className="material-symbols-outlined text-[14px] flex-none mt-0.5">info</span>
                <span>El resumen se genera <strong>una sola vez por sesión</strong> y se guarda en la ficha. Usa el motor <strong>Gemini Fast</strong> para optimizar tiempo y costo.</span>
              </div>
            </>
          )}

          {/* State 2 — loading */}
          {loading && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100 mb-5 text-sm text-indigo-700">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin flex-none" />
                Analizando historial clínico, medicación y notas previas…
              </div>
              {/* Skeleton */}
              <div className="space-y-5">
                {['Último estado clínico', 'Medicación e interconsultas', 'Foco sugerido para hoy'].map((sec) => (
                  <div key={sec}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-3.5 bg-gray-200 rounded animate-pulse w-40" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-[90%]" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-[70%]" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-[80%]" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* State 3 — generated */}
          {summary && !loading && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-medium mb-4">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {cached ? 'Resumen guardado · Costo $0' : 'Resumen generado · Gemini Fast'}
                <button
                  onClick={generarResumen}
                  className="ml-auto text-green-600 hover:text-green-800 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">refresh</span>
                  Regenerar
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:mt-1.5 [&_li]:my-1 [&_strong]:text-gray-900">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
              <p className="mt-4 flex items-start gap-2 text-[11px] text-gray-400 border-t border-gray-100 pt-4">
                <span className="material-symbols-outlined text-[13px] mt-0.5">info</span>
                El resumen es una herramienta de apoyo. La decisión clínica corresponde al profesional.
              </p>
            </>
          )}
        </div>

        {/* Footer — fixed */}
        <div className="border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
          <Link
            href={`/pacientes/${pacienteId}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            Ver Ficha Completa
          </Link>
          <Link
            href={`/pacientes/${pacienteId}/historial/nueva?turno_id=${turnoId}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg,#001a48 0%,#1F4FD9 100%)' }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Iniciar Evolución de Hoy
          </Link>
        </div>
      </aside>
    </>
  )
}

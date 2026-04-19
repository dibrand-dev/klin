'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn, formatNombreCompleto } from '@/lib/utils'
import type { Paciente } from '@/types/database'

const OBRAS_SOCIALES_COMUNES = [
  'OSDE', 'Swiss Medical', 'Galeno', 'IOMA', 'PAMI', 'OMINT',
  'Medicus', 'Sancor Salud', 'Accord Salud', 'Particular',
]

export default function PacienteDetalle({ paciente }: { paciente: Paciente }) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nombre: paciente.nombre,
    apellido: paciente.apellido,
    dni: paciente.dni ?? '',
    fecha_nacimiento: paciente.fecha_nacimiento ?? '',
    telefono: paciente.telefono ?? '',
    email: paciente.email ?? '',
    obra_social: paciente.obra_social ?? '',
    numero_afiliado: paciente.numero_afiliado ?? '',
    notas: paciente.notas ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleCancelar() {
    setForm({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni ?? '',
      fecha_nacimiento: paciente.fecha_nacimiento ?? '',
      telefono: paciente.telefono ?? '',
      email: paciente.email ?? '',
      obra_social: paciente.obra_social ?? '',
      numero_afiliado: paciente.numero_afiliado ?? '',
      notas: paciente.notas ?? '',
    })
    setError(null)
    setEditando(false)
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('pacientes')
      .update({
        nombre: form.nombre,
        apellido: form.apellido,
        dni: form.dni || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        telefono: form.telefono || null,
        email: form.email || null,
        obra_social: form.obra_social || null,
        numero_afiliado: form.numero_afiliado || null,
        notas: form.notas || null,
      })
      .eq('id', paciente.id)
    if (dbError) { setError('Error al guardar los cambios. Intentá de nuevo.'); setLoading(false); return }
    setEditando(false)
    setLoading(false)
    router.refresh()
  }

  const iniciales = `${paciente.nombre[0] ?? ''}${paciente.apellido[0] ?? ''}`.toUpperCase()
  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento))
    : null

  const metaItems = [
    edad ? `${edad} años` : null,
    paciente.obra_social,
    paciente.telefono,
  ].filter(Boolean) as string[]

  return (
    <div>
      {/* Patient header */}
      <div className="bg-white border border-[#E7E9EE] rounded-xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Gradient avatar */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-[22px] font-semibold select-none"
            style={{ background: 'linear-gradient(135deg, #E3E9F6 0%, #C9D3E9 100%)', color: '#16389F' }}
          >
            {iniciales}
          </div>

          <div className="flex-1 min-w-0">
            {/* Status pill */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#E7F5EE', color: '#0E8A5F' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0E8A5F] flex-shrink-0" />
                En tratamiento
              </span>
            </div>

            {/* Name */}
            <h1
              className="text-2xl sm:text-[28px] font-semibold leading-tight text-[#0B1220]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {formatNombreCompleto(paciente.nombre, paciente.apellido)}
            </h1>

            {/* Meta row */}
            {metaItems.length > 0 && (
              <p className="mt-1.5 text-sm text-[#5B6472] flex flex-wrap items-center gap-x-0">
                {metaItems.map((item, i) => (
                  <span key={i} className="flex items-center">
                    {i > 0 && <span className="mx-1.5 text-[#AEB5C0]">·</span>}
                    <span>{item}</span>
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Edit button */}
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="p-2 text-[#8A93A1] hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
              title="Editar datos"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>

        {/* Summary strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-[#E7E9EE] overflow-hidden">
          <SummaryCell label="Obra social" value={paciente.obra_social} className="border-r border-b sm:border-b-0 border-[#E7E9EE]" />
          <SummaryCell label="N° afiliado" value={paciente.numero_afiliado} className="border-b sm:border-b-0 sm:border-r border-[#E7E9EE]" />
          <SummaryCell label="DNI" value={paciente.dni} className="border-r border-[#E7E9EE]" />
          <SummaryCell label="Email" value={paciente.email} className="" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center mt-4 border-b border-[#E7E9EE]">
        <button
          onClick={() => setEditando(false)}
          className="px-4 py-2.5 text-sm font-medium text-primary-600 border-b-2 border-primary-600 transition-colors"
        >
          Datos
        </button>
        <Link
          href={`/pacientes/${paciente.id}/historial`}
          className="px-4 py-2.5 text-sm font-medium text-[#5B6472] hover:text-[#1F2937] border-b-2 border-transparent transition-colors"
        >
          Historial clínico
        </Link>
        <div className="flex-1" />
        <Link
          href={`/pacientes/${paciente.id}/historial/nueva`}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 mb-px mr-0.5 rounded-lg border border-[#E7E9EE] text-[#1F2937] hover:bg-[#F6F7F9] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva nota
        </Link>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-3">
        {!editando ? (
          <>
            <div className="card p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Datos personales</p>
              <InfoRow label="DNI" value={form.dni} />
              <InfoRow
                label="Fecha de nacimiento"
                value={form.fecha_nacimiento
                  ? format(parseISO(form.fecha_nacimiento), "d 'de' MMMM yyyy", { locale: es })
                  : null}
              />
            </div>
            <div className="card p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Contacto</p>
              <InfoRow label="Teléfono" value={form.telefono} />
              <InfoRow label="Email" value={form.email} />
            </div>
            <div className="card p-4 space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Cobertura médica</p>
              <InfoRow label="Obra social / Prepaga" value={form.obra_social} />
              <InfoRow label="N° de afiliado" value={form.numero_afiliado} />
            </div>
            {form.notas && (
              <div className="card p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Notas internas</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.notas}</p>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
            )}
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Datos personales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input name="nombre" type="text" value={form.nombre} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input name="apellido" type="text" value={form.apellido} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                  <input name="dni" type="text" value={form.dni} onChange={handleChange} placeholder="12.345.678" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                  <input name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} className="input-field" />
                </div>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Contacto</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input name="telefono" type="tel" value={form.telefono} onChange={handleChange} placeholder="+54 11 1234-5678" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="paciente@email.com" className="input-field" />
                </div>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Cobertura médica</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Obra social / Prepaga</label>
                  <input name="obra_social" type="text" value={form.obra_social} onChange={handleChange}
                    placeholder="OSDE, IOMA, Particular..." list="obras-sociales" className="input-field" />
                  <datalist id="obras-sociales">
                    {OBRAS_SOCIALES_COMUNES.map((os) => <option key={os} value={os} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">N° de afiliado</label>
                  <input name="numero_afiliado" type="text" value={form.numero_afiliado} onChange={handleChange} placeholder="123456789" className="input-field" />
                </div>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Notas internas</p>
              <textarea name="notas" value={form.notas} onChange={handleChange}
                rows={3} placeholder="Motivo de consulta, derivación, observaciones..."
                className="input-field resize-none" />
              <p className="text-xs text-gray-400 mt-1">Solo visible para vos.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleCancelar} className="btn-secondary flex-1 py-3">Cancelar</button>
              <button type="submit" disabled={loading} className={cn('btn-primary flex-1 py-3', loading && 'opacity-70')}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function SummaryCell({ label, value, className }: { label: string; value: string | null | undefined; className: string }) {
  return (
    <div className={cn('px-4 py-3 bg-[#F6F7F9]', className)}>
      <p className="text-[11px] font-medium text-[#8A93A1] uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[#0B1220] truncate">{value || '—'}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{value}</span>
    </div>
  )
}

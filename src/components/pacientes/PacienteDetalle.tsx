'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn, formatNombreCompleto } from '@/lib/utils'
import type { Paciente, NotaClinica } from '@/types/database'

const OBRAS_SOCIALES_COMUNES = [
  'OSDE', 'Swiss Medical', 'Galeno', 'IOMA', 'PAMI', 'OMINT',
  'Medicus', 'Sancor Salud', 'Accord Salud', 'Particular',
]

type Tab = 'datos' | 'historial'

interface PacienteDetalleProps {
  paciente: Paciente
  notasIniciales: NotaClinica[]
  terapeutaId: string
}

export default function PacienteDetalle({ paciente, notasIniciales, terapeutaId }: PacienteDetalleProps) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('datos')
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

  const [notas, setNotas] = useState<NotaClinica[]>(notasIniciales)
  const [nuevaNota, setNuevaNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)

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

  async function agregarNota() {
    if (!nuevaNota.trim()) return
    setGuardandoNota(true)
    const supabase = createClient()
    const { data, error: dbError } = await supabase
      .from('notas_clinicas')
      .insert({
        terapeuta_id: terapeutaId,
        paciente_id: paciente.id,
        turno_id: null,
        fecha: format(new Date(), 'yyyy-MM-dd'),
        contenido: nuevaNota.trim(),
      })
      .select()
      .single()
    if (!dbError && data) {
      setNotas((prev) => [data, ...prev])
      setNuevaNota('')
    }
    setGuardandoNota(false)
  }

  const iniciales = `${paciente.nombre[0] ?? ''}${paciente.apellido[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-4">
      {/* Cabecera con avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-700">{iniciales}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatNombreCompleto(form.nombre, form.apellido)}
          </h2>
          {form.obra_social && (
            <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {form.obra_social}
            </span>
          )}
        </div>
        {!editando && tab === 'datos' && (
          <button
            onClick={() => setEditando(true)}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setTab('datos'); setEditando(false) }}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            tab === 'datos'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Datos
        </button>
        <button
          onClick={() => setTab('historial')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
            tab === 'historial'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Historial clínico
          {notas.length > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full leading-none">
              {notas.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab Datos ── */}
      {tab === 'datos' && !editando && (
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
      )}

      {/* ── Tab Datos en modo edición ── */}
      {tab === 'datos' && editando && (
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

      {/* ── Tab Historial ── */}
      {tab === 'historial' && (
        <div className="space-y-4">
          {/* Nueva nota manual */}
          <div className="card p-4 space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Agregar nota</p>
            <textarea
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              rows={3}
              placeholder="Escribí una nota de sesión o anotación clínica..."
              className="input-field resize-none"
            />
            <button
              onClick={agregarNota}
              disabled={guardandoNota || !nuevaNota.trim()}
              className={cn('btn-primary w-full py-2.5', (guardandoNota || !nuevaNota.trim()) && 'opacity-50')}
            >
              {guardandoNota ? 'Guardando...' : 'Guardar nota'}
            </button>
          </div>

          {/* Lista de notas */}
          {notas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Todavía no hay notas de sesión para este paciente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notas.map((nota) => (
                <div key={nota.id} className="card p-4 space-y-1.5">
                  <p className="text-xs text-gray-500 font-medium capitalize">
                    {format(parseISO(nota.fecha), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{nota.contenido}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

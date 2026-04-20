'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn, formatNombreCompleto } from '@/lib/utils'
import type { Paciente } from '@/types/database'
import type { PacienteTabKey } from './PacienteTabs'

const OBRAS_SOCIALES_COMUNES = [
  'OSDE', 'Swiss Medical', 'Galeno', 'IOMA', 'PAMI', 'OMINT',
  'Medicus', 'Sancor Salud', 'Accord Salud', 'Particular',
]

function normalizePhone(t: string | null | undefined): string | null {
  if (!t) return null
  return t.replace(/[^\d+]/g, '')
}

export default function PacienteDetalle({
  paciente,
  initialEdit = false,
  activeTab = 'datos',
}: {
  paciente: Paciente
  initialEdit?: boolean
  activeTab?: PacienteTabKey
}) {
  const router = useRouter()
  const tabParam = activeTab
  const [editando, setEditando] = useState(initialEdit)
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

  if (tabParam && tabParam !== 'datos' && !editando) {
    return <TabEmptyState tab={tabParam} />
  }

  if (editando) {
    return (
      <form onSubmit={handleGuardar} className="mt-6 space-y-5">
        {error && (
          <div className="bg-error-container border border-error/20 text-error px-3 py-2 rounded-lg text-sm">{error}</div>
        )}
        <KlinCard title="Información personal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre *" name="nombre" value={form.nombre} onChange={handleChange} required />
            <Field label="Apellido *" name="apellido" value={form.apellido} onChange={handleChange} required />
            <Field label="DNI" name="dni" value={form.dni} onChange={handleChange} placeholder="12.345.678" />
            <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} />
          </div>
        </KlinCard>
        <KlinCard title="Contacto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Teléfono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} placeholder="+54 11 1234-5678" />
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="paciente@email.com" />
          </div>
        </KlinCard>
        <KlinCard title="Obra social">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-on-surface-variant mb-1">Obra social / Prepaga</label>
              <input
                name="obra_social" type="text" value={form.obra_social} onChange={handleChange}
                placeholder="OSDE, IOMA, Particular..." list="obras-sociales"
                className="input-field"
              />
              <datalist id="obras-sociales">
                {OBRAS_SOCIALES_COMUNES.map((os) => <option key={os} value={os} />)}
              </datalist>
            </div>
            <Field label="N° de afiliado" name="numero_afiliado" value={form.numero_afiliado} onChange={handleChange} placeholder="123456789" />
          </div>
        </KlinCard>
        <KlinCard title="Motivo de consulta / Notas">
          <textarea
            name="notas" value={form.notas} onChange={handleChange}
            rows={4} placeholder="Motivo de consulta, derivación, observaciones..."
            className="input-field resize-none"
          />
          <p className="text-[11.5px] text-on-surface-variant mt-1.5">La primera línea aparece como motivo de consulta en la ficha.</p>
        </KlinCard>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleCancelar} className="btn-secondary flex-1 justify-center py-2.5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn('btn-primary flex-1 justify-center py-2.5', loading && 'opacity-70 cursor-not-allowed')}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    )
  }

  const edad = paciente.fecha_nacimiento ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento)) : null
  const fechaNacimiento = paciente.fecha_nacimiento
    ? format(parseISO(paciente.fecha_nacimiento), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null
  const telHref = normalizePhone(paciente.telefono)

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
      <KlinCard title="Información personal" action={
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-[11.5px] font-bold text-primary hover:text-primary-container transition-colors"
        >
          Editar
        </button>
      }>
        <Kv rows={[
          ['Nombre completo', formatNombreCompleto(paciente.nombre, paciente.apellido)],
          ['DNI', paciente.dni],
          ['Fecha de nacimiento', fechaNacimiento ? `${fechaNacimiento}${edad ? ` (${edad} años)` : ''}` : null],
        ]} />
      </KlinCard>

      <KlinCard title="Contacto">
        <Kv rows={[
          ['Email', paciente.email],
          ['Teléfono', telHref ? (
            <a href={`tel:${telHref}`} className="tel">
              {paciente.telefono}
            </a>
          ) : null],
        ]} />
      </KlinCard>

      <KlinCard title="Obra social">
        <Kv rows={[
          ['Obra social', paciente.obra_social],
          ['Credencial', paciente.numero_afiliado],
        ]} />
      </KlinCard>

      <KlinCard title="Notas">
        {paciente.notas ? (
          <p className="text-[14px] text-on-surface leading-[1.6] whitespace-pre-wrap" style={{ textWrap: 'pretty' } as React.CSSProperties}>
            {paciente.notas}
          </p>
        ) : (
          <p className="text-[13px] text-on-surface-variant">Sin notas registradas. Usá &quot;Editar&quot; para agregar motivo de consulta u observaciones.</p>
        )}
      </KlinCard>
    </div>
  )
}

function KlinCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest m-0">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Kv({ rows }: { rows: [string, React.ReactNode][] }) {
  const filtered = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (filtered.length === 0) {
    return <p className="text-[13px] text-on-surface-variant">Sin datos cargados.</p>
  }
  return (
    <dl className="grid gap-y-2 gap-x-4 text-[13.5px]" style={{ gridTemplateColumns: '140px 1fr' }}>
      {filtered.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-on-surface-variant font-normal">
            {k}
          </dt>
          <dd className="text-on-surface font-medium m-0">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-on-surface-variant mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
      />
    </div>
  )
}

function TabEmptyState({ tab }: { tab: PacienteTabKey }) {
  const config: Record<PacienteTabKey, { title: string; body: string }> = {
    resumen: {
      title: 'Resumen del paciente',
      body: 'Evolución del tratamiento, objetivos y diagnóstico. Próximamente.',
    },
    datos: { title: 'Datos personales', body: '' },
    historial: { title: 'Historial clínico', body: '' },
    turnos: {
      title: 'Turnos',
      body: 'Ver los turnos agendados para este paciente. Próximamente vas a ver la grilla completa.',
    },
    documentos: {
      title: 'Documentos y adjuntos',
      body: 'Consentimientos informados, estudios, informes. Próximamente.',
    },
    notas: {
      title: 'Notas privadas',
      body: 'Notas del terapeuta que no forman parte de la historia clínica. Próximamente.',
    },
  }
  const c = config[tab]
  return (
    <div className="mt-6 border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest p-10 text-center">
      <h3 className="text-[22px] font-bold text-on-surface mb-1.5 tracking-tight">{c.title}</h3>
      <p className="text-[13.5px] text-on-surface-variant m-0">{c.body}</p>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { parseISO, differenceInYears, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatNombreCompleto } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Paciente, Turno } from '@/types/database'

export interface SummaryData {
  sesionesRealizadas: number
  proximaSesion: Turno | null
  tratamientoDesde: string | null
  impagos: number
  montoImpago: number
}

export default function PacienteHeader({
  paciente,
  summary,
}: {
  paciente: Paciente
  summary: SummaryData
}) {
  const router = useRouter()

  const iniciales = `${paciente.nombre[0] ?? ''}${paciente.apellido[0] ?? ''}`.toUpperCase()
  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), parseISO(paciente.fecha_nacimiento))
    : null

  async function handleEliminar() {
    if (!confirm('¿Eliminar este paciente? Esta acción no se puede deshacer.')) return
    const supabase = createClient()
    const { error } = await supabase.from('pacientes').delete().eq('id', paciente.id)
    if (error) { alert('Error al eliminar: ' + error.message); return }
    router.push('/pacientes')
  }

  // Summary strip values
  const motivo = paciente.notas?.split('\n')[0]?.trim() || null

  const proximaSesionLabel = (() => {
    if (!summary.proximaSesion) return null
    const d = parseISO(summary.proximaSesion.fecha_hora)
    return format(d, "EEEE d MMM '·' HH:mm", { locale: es })
  })()

  const cuentaLabel = (() => {
    if (summary.impagos === 0) return '$0 al día'
    const monto = summary.montoImpago
      ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(summary.montoImpago)
      : '—'
    return `${monto} pendiente`
  })()

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-4">
        <Link href="/pacientes" className="hover:text-primary transition-colors">
          Pacientes
        </Link>
        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
        <span className="text-primary/60 capitalize">
          {formatNombreCompleto(paciente.nombre, paciente.apellido)}
        </span>
      </nav>

      {/* Patient header card */}
      <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 mb-8 shadow-card border border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary-fixed border-4 border-white shadow-lg flex items-center justify-center flex-none select-none">
            <span className="text-2xl md:text-3xl font-black text-primary">{iniciales}</span>
          </div>

          <div>
            {/* Name + status */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tighter">
                {formatNombreCompleto(paciente.nombre, paciente.apellido)}
              </h1>
              {paciente.activo ? (
                <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit">
                  En tratamiento
                </span>
              ) : (
                <span className="bg-surface-container text-on-surface-variant px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit">
                  Inactivo
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fingerprint</span>
                PAC-{paciente.id.slice(0, 8).toUpperCase()}
              </span>
              {edad !== null && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cake</span>
                  {edad} años
                </span>
              )}
              {paciente.obra_social && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>medical_services</span>
                  {paciente.obra_social}
                </span>
              )}
              {paciente.telefono && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>phone</span>
                  <a href={`tel:${paciente.telefono.replace(/[^\d+]/g, '')}`} className="tel">
                    {paciente.telefono}
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/turnos/nuevo"
            className="flex-1 md:flex-none px-5 py-2.5 bg-primary-fixed text-on-primary-fixed rounded-lg font-bold text-sm hover:bg-secondary-fixed transition-colors text-center"
          >
            Nueva sesión
          </Link>
          <Link
            href={`/pacientes/${paciente.id}/historial/nueva`}
            className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white rounded-lg font-bold text-sm shadow-primary hover:bg-primary-container transition-colors text-center"
          >
            Nota clínica
          </Link>
          <button
            type="button"
            onClick={handleEliminar}
            className="flex-none p-2.5 text-error hover:bg-error-container/20 rounded-lg transition-colors flex items-center justify-center border border-error/20"
            title="Eliminar paciente"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
          </button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <SummaryTile
          label="MOTIVO"
          value={motivo || '—'}
          className="text-primary"
        />
        <SummaryTile
          label="INICIO TRATAMIENTO"
          value={summary.tratamientoDesde
            ? format(parseISO(summary.tratamientoDesde), 'MMMM yyyy', { locale: es })
            : '—'}
          sub={summary.sesionesRealizadas > 0 ? `${summary.sesionesRealizadas} sesiones` : undefined}
          className="text-primary capitalize"
        />
        <SummaryTile
          label="PRÓXIMA SESIÓN"
          value={proximaSesionLabel || 'Sin turno próximo'}
          className={proximaSesionLabel ? 'text-on-tertiary-container capitalize' : 'text-slate-400'}
        />
        <SummaryTile
          label="ESTADO DE CUENTA"
          value={cuentaLabel}
          className={summary.impagos === 0 ? 'text-primary' : 'text-error'}
        />
      </div>
    </>
  )
}

function SummaryTile({
  label,
  value,
  sub,
  className,
}: {
  label: string
  value: string
  sub?: string
  className?: string
}) {
  return (
    <div className="bg-surface-container-low/50 border border-outline-variant/10 p-5 rounded-xl">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-sm font-bold ${className ?? 'text-primary'}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export type PacienteTabKey = 'resumen' | 'datos' | 'historial' | 'turnos' | 'documentos' | 'notas'

interface TabDef {
  key: PacienteTabKey
  label: string
  badge?: number
}

export default function PacienteTabs({
  pacienteId,
  active,
  historialCount,
  turnosCount,
  documentosCount,
}: {
  pacienteId: string
  active: PacienteTabKey
  historialCount?: number
  turnosCount?: number
  documentosCount?: number
}) {
  const tabs: TabDef[] = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'datos', label: 'Datos personales' },
    { key: 'historial', label: 'Historial clínico', badge: historialCount },
    { key: 'turnos', label: 'Turnos', badge: turnosCount },
    { key: 'documentos', label: 'Documentos', badge: documentosCount },
    { key: 'notas', label: 'Notas privadas' },
  ]

  return (
    <div className="flex items-center gap-0.5 border-b border-outline-variant/20 mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap whitespace-nowrap">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        const href =
          tab.key === 'datos' ? `/pacientes/${pacienteId}`
          : tab.key === 'historial' ? `/pacientes/${pacienteId}/historial`
          : tab.key === 'resumen' ? `/pacientes/${pacienteId}?tab=resumen`
          : tab.key === 'turnos' ? `/pacientes/${pacienteId}?tab=turnos`
          : tab.key === 'documentos' ? `/pacientes/${pacienteId}?tab=documentos`
          : `/pacientes/${pacienteId}?tab=notas`

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              'inline-flex items-center gap-[7px] px-3.5 py-2.5 text-[13px] font-bold border-b-2 -mb-px transition-colors select-none flex-shrink-0',
              isActive
                ? 'text-primary border-primary'
                : 'text-slate-400 border-transparent hover:text-slate-600',
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-bold',
                  isActive
                    ? 'bg-primary-container text-white'
                    : 'bg-surface-container text-on-surface-variant',
                )}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

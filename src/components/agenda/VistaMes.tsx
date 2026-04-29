'use client'

import {
  addMonths, subMonths, format, isToday, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { Turno, Entrevista } from '@/types/database'
import { cn } from '@/lib/utils'

type GoogleEventSerialized = { id: string; titulo: string; inicio: string; fin: string }

interface VistaMesProps {
  mes: Date
  turnos: Turno[]
  entrevistas: Entrevista[]
  googleEvents: GoogleEventSerialized[]
  onMesChange: (mes: Date) => void
  onDiaClick: (dia: Date) => void
  onNuevoTurno: (fecha: Date) => void
  vistaSelector: React.ReactNode
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function VistaMes({
  mes, turnos, entrevistas, googleEvents,
  onMesChange, onDiaClick, onNuevoTurno, vistaSelector,
}: VistaMesProps) {
  const inicioMes = startOfMonth(mes)
  const finMes = endOfMonth(mes)
  const inicioGrid = startOfWeek(inicioMes, { weekStartsOn: 1 })
  const finGrid = endOfWeek(finMes, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicioGrid, end: finGrid })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => onMesChange(subMonths(mes, 1))} className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm md:text-base font-semibold text-gray-900 capitalize">
            {format(mes, 'MMMM yyyy', { locale: es })}
          </p>
        </div>

        <button onClick={() => onMesChange(addMonths(mes, 1))} className="p-2 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* View selector + actions row */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-4 text-xs">
        {vistaSelector}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onMesChange(new Date())}
            className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            Hoy
          </button>
          <button
            onClick={() => onNuevoTurno(new Date())}
            className="btn-primary flex items-center gap-1 px-3 py-1.5 text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 bg-white border-b border-gray-200">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(80px, 1fr)' }}>
          {dias.map((dia) => {
            const esHoy = isToday(dia)
            const esMes = isSameMonth(dia, mes)

            const turnosDia = turnos.filter((t) => isSameDay(parseISO(t.fecha_hora), dia))
            const entrevistasDia = entrevistas.filter(
              (e) => isSameDay(parseISO(e.fecha + 'T12:00:00'), dia) && e.estado !== 'cancelada'
            )
            const gEventsDia = googleEvents.filter((e) => isSameDay(new Date(e.inicio), dia))

            type Pill = { key: string; label: string; kind: 'turno' | 'entrevista' | 'google' }
            const pills: Pill[] = [
              ...turnosDia.map((t) => ({
                key: t.id,
                label: t.paciente ? t.paciente.apellido : 'Turno',
                kind: 'turno' as const,
              })),
              ...entrevistasDia.map((e) => ({
                key: e.id,
                label: e.apellido,
                kind: 'entrevista' as const,
              })),
              ...gEventsDia.map((e) => ({
                key: e.id,
                label: e.titulo,
                kind: 'google' as const,
              })),
            ]
            const visibles = pills.slice(0, 3)
            const resto = pills.length - visibles.length

            return (
              <div
                key={dia.toISOString()}
                className={cn(
                  'border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-gray-50 transition-colors',
                  !esMes && 'bg-gray-50/60'
                )}
                onClick={() => onDiaClick(dia)}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1">
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    esHoy
                      ? 'bg-primary text-white'
                      : esMes
                        ? 'text-gray-700'
                        : 'text-gray-300'
                  )}>
                    {format(dia, 'd')}
                  </span>
                </div>

                {/* Pills — desktop */}
                <div className="hidden sm:block space-y-0.5">
                  {visibles.map((p) => (
                    <div
                      key={p.key}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded truncate font-medium leading-tight',
                        p.kind === 'turno' && 'bg-primary/10 text-primary',
                        p.kind === 'entrevista' && 'bg-amber-100 text-amber-800',
                        p.kind === 'google' && 'bg-gray-100 text-gray-500 border border-dashed border-gray-300',
                      )}
                    >
                      {p.label}
                    </div>
                  ))}
                  {resto > 0 && (
                    <div className="text-[10px] text-gray-400 px-1">+{resto} más</div>
                  )}
                </div>

                {/* Dots — mobile */}
                <div className="sm:hidden flex flex-wrap gap-0.5 justify-center mt-0.5">
                  {turnosDia.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  {entrevistasDia.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                  {gEventsDia.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

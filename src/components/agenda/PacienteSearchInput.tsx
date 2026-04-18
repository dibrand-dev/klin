'use client'

import { useState, useRef, useEffect } from 'react'
import { cn, formatNombreCompleto } from '@/lib/utils'
import type { Paciente } from '@/types/database'

interface PacienteSearchInputProps {
  pacientes: Paciente[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export default function PacienteSearchInput({ pacientes, value, onChange, className }: PacienteSearchInputProps) {
  const selected = pacientes.find((p) => p.id === value)
  const [query, setQuery] = useState(selected ? formatNombreCompleto(selected.nombre, selected.apellido) : '')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = pacientes
    .filter((p) => {
      if (!query) return true
      const texto = `${p.nombre} ${p.apellido} ${p.obra_social ?? ''}`.toLowerCase()
      return texto.includes(query.toLowerCase())
    })
    .slice(0, 8)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (!value) setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [value])

  function select(p: Paciente) {
    onChange(p.id)
    setQuery(formatNombreCompleto(p.nombre, p.apellido))
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); return }
      return
    }
    if (e.key === 'ArrowDown') { setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setHighlighted((h) => Math.max(h - 1, 0)); e.preventDefault() }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[highlighted]) select(filtered[highlighted]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange('')
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar paciente..."
        autoComplete="off"
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-primary-50',
                i === highlighted && 'bg-primary-50'
              )}
              onMouseDown={(e) => { e.preventDefault(); select(p) }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="font-medium text-gray-900 truncate">
                {formatNombreCompleto(p.nombre, p.apellido)}
              </span>
              {p.obra_social && (
                <span className="text-xs text-gray-400 flex-shrink-0">{p.obra_social}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2.5 text-sm text-gray-400">
          No se encontraron pacientes
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Template = Database['public']['Tables']['planilla_templates']['Row']

const TIPOS_COL = ['texto_centrado', 'texto_izquierda', 'imagen'] as const
const VARS_SESION = ['fecha', 'diaSemana', 'horaInicio', 'horaFin', 'horario', 'cantidadSesiones', 'firmaProfesional', 'firmaPaciente']
const VARS_HEADER = ['prestador', 'domicilio', 'afiliado', 'numeroSocio', 'tratamiento', 'mesAnio', 'numeroAutorizacion', 'emailTel', 'dni']

interface ColForm { header: string; variable: string; ancho: number; tipo: string; punteado: boolean }
interface CampoForm { label: string; variable: string; y: number; align: string }

export default function PlantillaEditor({ template }: { template: Template | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cfg = (template?.config ?? {}) as Record<string, unknown>
  const cfgTabla = (cfg.tabla ?? {}) as Record<string, unknown>
  const cfgHeader = (cfg.header ?? {}) as Record<string, unknown>

  const [nombre, setNombre] = useState(template?.nombre_os ?? '')
  const [slug, setSlug] = useState(template?.slug ?? '')
  const [firmaOlografa, setFirmaOlografa] = useState(template?.requiere_firma_olografa ?? false)
  const [avisoFirma, setAvisoFirma] = useState(template?.aviso_firma ?? '')
  const [activa, setActiva] = useState(template?.activa ?? true)
  const [columnas, setColumnas] = useState<ColForm[]>(() =>
    ((cfgTabla.columnas ?? []) as ColForm[]).map(c => ({
      header: c.header ?? '',
      variable: c.variable ?? '',
      ancho: c.ancho ?? 100,
      tipo: c.tipo ?? 'texto_centrado',
      punteado: c.punteado ?? false,
    }))
  )
  const [campos, setCampos] = useState<CampoForm[]>(() =>
    ((cfgHeader.campos ?? []) as CampoForm[]).map(c => ({
      label: c.label ?? '',
      variable: c.variable ?? '',
      y: c.y ?? 100,
      align: c.align ?? 'right',
    }))
  )
  const [alturaFila, setAlturaFila] = useState<number>((cfgTabla.altura_fila as number) ?? 40)
  const [filasPag1, setFilasPag1] = useState<number>((cfgTabla.filas_pagina_1 as number) ?? 12)
  const [filasPag2, setFilasPag2] = useState<number>((cfgTabla.filas_pagina_2 as number) ?? 18)

  function addColumna() {
    setColumnas(prev => [...prev, { header: '', variable: 'fecha', ancho: 80, tipo: 'texto_centrado', punteado: false }])
  }
  function removeColumna(idx: number) { setColumnas(prev => prev.filter((_, i) => i !== idx)) }
  function updateColumna(idx: number, field: keyof ColForm, val: string | number | boolean) {
    setColumnas(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  function addCampo() { setCampos(prev => [...prev, { label: '', variable: 'prestador', y: 100, align: 'left' }]) }
  function removeCampo(idx: number) { setCampos(prev => prev.filter((_, i) => i !== idx)) }
  function updateCampo(idx: number, field: keyof CampoForm, val: string | number) {
    setCampos(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  async function handleSave() {
    if (!nombre || !slug) { setError('Nombre y slug son requeridos'); return }
    setSaving(true); setError(null)
    const config = {
      pagina: (cfg.pagina ?? { ancho: 595, alto: 842, margen: 40 }),
      header: { ...cfgHeader, campos },
      tabla: { ...cfgTabla, altura_fila: alturaFila, filas_pagina_1: filasPag1, filas_pagina_2: filasPag2, columnas },
    }
    const supabase = createClient()
    const payload = {
      nombre_os: nombre,
      slug,
      requiere_firma_olografa: firmaOlografa,
      aviso_firma: avisoFirma || null,
      activa,
      config,
      updated_at: new Date().toISOString(),
    }
    const { error: dbErr } = template
      ? await supabase.from('planilla_templates').update(payload).eq('id', template.id)
      : await supabase.from('planilla_templates').insert({ ...payload })
    if (dbErr) { setError(dbErr.message); setSaving(false); return }
    router.push('/ops/planillas')
    router.refresh()
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors'
  const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1'

  return (
    <div className="px-6 md:px-8 pt-8 pb-20 max-w-[900px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ops/planillas" className="text-gray-400 hover:text-gray-700 transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold text-on-surface">
          {template ? `Editar: ${template.nombre_os}` : 'Nueva plantilla'}
        </h1>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">{error}</p>}

      <div className="space-y-6">
        {/* General */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold text-on-surface">Información general</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Nombre OS *</label><input value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Slug *</label><input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g,'-'))} className={inputCls} placeholder="ej: hospital-italiano" /></div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={firmaOlografa} onChange={e => setFirmaOlografa(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium">Requiere firma ológrafa</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={activa} onChange={e => setActiva(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium">Activa</span>
            </label>
          </div>
          {firmaOlografa && (
            <div>
              <label className={labelCls}>Aviso para el profesional</label>
              <textarea value={avisoFirma} onChange={e => setAvisoFirma(e.target.value)} rows={2} className={inputCls} />
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold text-on-surface">Tabla de sesiones</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelCls}>Altura fila (pts)</label><input type="number" value={alturaFila} onChange={e => setAlturaFila(+e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Filas pág. 1</label><input type="number" value={filasPag1} onChange={e => setFilasPag1(+e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Filas pág. 2</label><input type="number" value={filasPag2} onChange={e => setFilasPag2(+e.target.value)} className={inputCls} /></div>
          </div>

          <div className="space-y-2">
            {columnas.map((col, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-lg p-3">
                <div className="col-span-3"><label className={labelCls}>Header</label><input value={col.header} onChange={e => updateColumna(i,'header',e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Variable</label>
                  <select value={col.variable} onChange={e => updateColumna(i,'variable',e.target.value)} className={inputCls}>
                    {VARS_SESION.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className={labelCls}>Tipo</label>
                  <select value={col.tipo} onChange={e => updateColumna(i,'tipo',e.target.value)} className={inputCls}>
                    {TIPOS_COL.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-1"><label className={labelCls}>Ancho</label><input type="number" value={col.ancho} onChange={e => updateColumna(i,'ancho',+e.target.value)} className={inputCls} /></div>
                <div className="col-span-2 flex items-center gap-2 pt-4">
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={col.punteado} onChange={e => updateColumna(i,'punteado',e.target.checked)} />Punteado</label>
                </div>
                <div className="col-span-2 flex justify-end pt-4">
                  <button onClick={() => removeColumna(i)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
            <button onClick={addColumna} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Agregar columna
            </button>
          </div>
        </div>

        {/* Campos header */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold text-on-surface">Campos del header</h2>
          <div className="space-y-2">
            {campos.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end bg-gray-50 rounded-lg p-3">
                <div className="col-span-4"><label className={labelCls}>Label</label><input value={c.label} onChange={e => updateCampo(i,'label',e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Variable</label>
                  <select value={c.variable} onChange={e => updateCampo(i,'variable',e.target.value)} className={inputCls}>
                    {VARS_HEADER.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-1"><label className={labelCls}>Y (pts)</label><input type="number" value={c.y} onChange={e => updateCampo(i,'y',+e.target.value)} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Alineación</label>
                  <select value={c.align} onChange={e => updateCampo(i,'align',e.target.value)} className={inputCls}>
                    <option value="left">Izquierda</option>
                    <option value="right">Derecha</option>
                  </select>
                </div>
                <div className="col-span-3 flex justify-end pt-4">
                  <button onClick={() => removeCampo(i)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
            <button onClick={addCampo} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Agregar campo
            </button>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/ops/planillas" className="px-4 py-2 text-sm font-medium text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}

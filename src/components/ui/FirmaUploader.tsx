'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  label: string
  descripcion: string
  instrucciones: string
  firmaUrl: string | null
  onUpload: (url: string) => void
  onDelete: () => void
  bucket: 'firmas-profesionales' | 'firmas-pacientes'
  storagePath: string
}

type Estado = 'idle' | 'uploading' | 'error'

const MAX_BYTES = 2 * 1024 * 1024

export default function FirmaUploader({
  label,
  descripcion,
  instrucciones,
  firmaUrl,
  onUpload,
  onDelete,
  bucket,
  storagePath,
}: Props) {
  const [estado, setEstado] = useState<Estado>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setEstado('error')
      setErrorMsg('Solo se aceptan imágenes (JPG, PNG).')
      return
    }
    if (file.size > MAX_BYTES) {
      setEstado('error')
      setErrorMsg('La imagen supera el límite de 2 MB.')
      return
    }

    setEstado('uploading')
    setErrorMsg(null)
    const supabase = createClient()
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, { upsert: true, contentType: file.type })

    if (upErr) {
      setEstado('error')
      setErrorMsg(upErr.message)
      return
    }

    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 315360000)

    if (!data?.signedUrl) {
      setEstado('error')
      setErrorMsg('No se pudo obtener la URL firmada.')
      return
    }

    setEstado('idle')
    onUpload(data.signedUrl)
  }

  async function handleDelete() {
    const supabase = createClient()
    await supabase.storage.from(bucket).remove([storagePath])
    setConfirmando(false)
    onDelete()
  }

  if (firmaUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div
            className="rounded-lg border border-outline-variant/20 overflow-hidden flex items-center justify-center"
            style={{
              background: 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 0 0 / 16px 16px',
              minWidth: 120,
              minHeight: 60,
              maxWidth: 200,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firmaUrl}
              alt={label}
              style={{ maxHeight: 80, maxWidth: 180, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-on-surface flex items-center gap-1.5">
              <span className="text-emerald-500">✅</span>
              {label}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">{descripcion}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high transition-colors font-medium text-on-surface-variant"
          >
            Cambiar
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors font-medium text-red-600"
          >
            Eliminar
          </button>
        </div>

        {confirmando && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <p className="text-xs text-red-700 flex-1">¿Eliminar esta firma?</p>
            <button onClick={handleDelete} className="text-xs font-semibold text-red-700 hover:underline">
              Confirmar
            </button>
            <button onClick={() => setConfirmando(false)} className="text-xs text-on-surface-variant hover:underline">
              Cancelar
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={estado === 'uploading'}
        className="w-full border-2 border-dashed border-outline-variant/40 rounded-xl px-6 py-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-surface-container/50 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">
          {estado === 'uploading' ? 'progress_activity' : 'draw'}
        </span>
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <span className="text-xs text-on-surface-variant">{descripcion}</span>
        <span className="text-xs text-primary font-medium mt-1">
          {estado === 'uploading' ? 'Subiendo...' : 'Seleccionar imagen'}
        </span>
      </button>

      <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span className="text-xs mt-0.5">⚠️</span>
        <p className="text-xs text-amber-800">{instrucciones}</p>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
      )}
    </div>
  )
}

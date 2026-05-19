'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { ESPECIALIDADES } from '@/lib/especialidades'
import { PAISES, PAISES_PROVINCIAS } from '@/lib/geografica'

const inputCls =
  'w-full bg-surface-container-high border border-outline-variant/15 text-on-surface rounded-lg px-4 py-3 text-sm focus:bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none'
const labelCls =
  'block text-[10px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-2'

export default function PerfilProfesional({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    especialidad: profile?.especialidad ?? '',
    matricula: profile?.matricula ?? '',
    telefono: profile?.telefono ?? '',
    pais: profile?.pais ?? 'Argentina',
    provincia: profile?.provincia ?? '',
    localidad: profile?.localidad ?? '',
    direccion: profile?.direccion ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => {
      if (name === 'pais') return { ...prev, pais: value, provincia: '', localidad: '' }
      return { ...prev, [name]: value }
    })
    setSaved(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB')
      return
    }

    setUploading(true)
    setError(null)
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Error al subir la imagen. Intentá de nuevo.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)

    setAvatarUrl(publicUrl)
    setUploading(false)
    router.refresh()

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteAvatar() {
    if (!profile?.id || !avatarUrl) return
    setUploading(true)
    const supabase = createClient()

    const path = avatarUrl.split('/object/public/avatars/')[1]
    if (path) await supabase.storage.from('avatars').remove([path])

    await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)

    setAvatarUrl(null)
    setUploading(false)
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        especialidad: form.especialidad || null,
        matricula: form.matricula || null,
        telefono: form.telefono || null,
        pais: form.pais || null,
        provincia: form.provincia || null,
        localidad: form.localidad || null,
        direccion: form.direccion || null,
      })
      .eq('id', profile?.id ?? '')

    if (dbError) {
      setError('Error al guardar los cambios. Intentá de nuevo.')
      setLoading(false)
      return
    }
    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  const initials = `${profile?.nombre?.[0] ?? ''}${profile?.apellido?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_8px_24px_rgba(0,26,72,0.06)]">
      <h2 className="font-semibold text-on-surface mb-5 flex items-center gap-2 text-sm">
        <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
        Perfil profesional
      </h2>

      {/* Avatar uploader */}
      <div className="flex items-center gap-5 mb-6 p-4 bg-surface-container-high/40 rounded-lg border border-outline-variant/10">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-outline-variant/20">
            {avatarUrl
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              : initials}
          </div>
          <label className={cn(
            'absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors',
            uploading && 'opacity-50 pointer-events-none'
          )}>
            {uploading
              ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
              : <span className="material-symbols-outlined text-gray-600 block" style={{ fontSize: 16 }}>photo_camera</span>
            }
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">{profile?.nombre} {profile?.apellido}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">JPG, PNG o WebP · Máx 2MB</p>
          {avatarUrl && (
            <button
              type="button"
              onClick={handleDeleteAvatar}
              disabled={uploading}
              className="text-xs text-red-500 hover:text-red-700 mt-1.5 transition-colors disabled:opacity-50"
            >
              Eliminar foto
            </button>
          )}
        </div>
      </div>

      {/* Datos de identidad (solo lectura) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-surface-container-high/40 rounded-lg border border-outline-variant/10">
        <div>
          <p className={labelCls}>Nombre completo</p>
          <p className="text-sm text-on-surface font-medium">
            {profile?.nombre} {profile?.apellido}
          </p>
        </div>
        <div>
          <p className={labelCls}>Email</p>
          <p className="text-sm text-on-surface">{profile?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            Cambios guardados correctamente.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="especialidad" className={labelCls}>Especialidad</label>
            <select
              id="especialidad"
              name="especialidad"
              value={form.especialidad}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="">Sin especificar</option>
              {ESPECIALIDADES.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="matricula" className={labelCls}>Matrícula profesional</label>
            <input
              id="matricula"
              name="matricula"
              type="text"
              value={form.matricula}
              onChange={handleChange}
              placeholder="MP 12345"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="telefono" className={labelCls}>Teléfono de contacto</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={handleChange}
              placeholder="+54 11 1234-5678"
              className={inputCls}
            />
            <p className="text-[11px] text-on-surface-variant mt-1.5">
              Visible para otros profesionales en interconsultas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="pais" className={labelCls}>País</label>
            <select
              id="pais"
              name="pais"
              value={form.pais}
              onChange={handleChange}
              className={inputCls}
            >
              {PAISES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="provincia" className={labelCls}>Provincia / Estado</label>
            <select
              id="provincia"
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="">Sin especificar</option>
              {(PAISES_PROVINCIAS[form.pais] ?? []).map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="localidad" className={labelCls}>Localidad / Ciudad</label>
            <input
              id="localidad"
              name="localidad"
              type="text"
              value={form.localidad}
              onChange={handleChange}
              placeholder="Ej: Buenos Aires"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="direccion" className={labelCls}>Dirección donde realiza la prestación</label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Av. Corrientes 1234, Piso 3"
              className={inputCls}
            />
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant -mt-2">
          Se usa en las planillas de asistencia para obras sociales.
        </p>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'btn-primary px-6 py-2.5',
              loading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { requireAdminUser } from '@/lib/ops/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PrestadoresTable from '@/components/ops/PrestadoresTable'

export const metadata = { title: 'Prestadores — Klia Ops' }

export default async function PrestadoresPage({
  searchParams,
}: {
  searchParams: { q?: string; plan?: string; estado?: string }
}) {
  await requireAdminUser()
  const supabase = createClient()

  const { data: prestadores } = await supabase.rpc('admin_get_profiles', {
    p_search: searchParams.q ?? null,
  })

  return (
    <div className="px-6 md:px-8 pt-8 pb-20 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Prestadores</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {prestadores?.length ?? 0} profesionales registrados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <form method="GET" className="flex flex-wrap gap-3 w-full">
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Buscar por nombre o email..."
            className="input-field flex-1 min-w-[200px] max-w-sm"
          />
          <select name="plan" defaultValue={searchParams.plan ?? ''} className="input-field w-40">
            <option value="">Todos los planes</option>
            <option value="esencial">Esencial</option>
            <option value="profesional">Profesional</option>
            <option value="premium">Premium</option>
          </select>
          <select name="estado" defaultValue={searchParams.estado ?? ''} className="input-field w-40">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="prueba">En prueba</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
          <button type="submit" className="btn-primary px-5 py-2">
            Buscar
          </button>
          {(searchParams.q || searchParams.plan || searchParams.estado) && (
            <Link href="/ops/prestadores" className="btn-secondary px-5 py-2">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <PrestadoresTable prestadores={prestadores ?? []} />
      </div>
    </div>
  )
}

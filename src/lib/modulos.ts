import type { SupabaseClient } from '@supabase/supabase-js'
import type { ModuloConfig } from '@/types/database'

export async function getModulosConfig(supabase: SupabaseClient): Promise<ModuloConfig[]> {
  const { data } = await supabase
    .from('modulos_config')
    .select('modulo_id, nombre, descripcion, icono, ruta, planes, activo')
    .eq('activo', true)
    .order('modulo_id')
  return (data ?? []) as ModuloConfig[]
}

export function puedeAcceder(moduloId: string, plan: string, modulos: ModuloConfig[]): boolean {
  const m = modulos.find(m => m.modulo_id === moduloId)
  if (!m) return true
  return m.planes.includes(plan)
}

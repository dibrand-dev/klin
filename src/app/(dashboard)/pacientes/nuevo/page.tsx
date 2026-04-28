import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NuevoPacienteForm from '@/components/pacientes/NuevoPacienteForm'

export const metadata = { title: 'Alta de Paciente — KLIA' }

export default async function NuevoPacientePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [obrasSocialesRes, profOSRes] = await Promise.all([
    supabase.from('obras_sociales').select('nombre').eq('validada', true).order('nombre'),
    supabase.from('profesional_obras_sociales').select('*').eq('terapeuta_id', user.id).eq('activa', true).order('nombre'),
  ])

  const obrasSociales = (obrasSocialesRes.data ?? []).map((o) => o.nombre)
  const profObrasSociales = profOSRes.data ?? []

  return <NuevoPacienteForm terapeutaId={user.id} obrasSociales={obrasSociales} profObrasSociales={profObrasSociales} />
}

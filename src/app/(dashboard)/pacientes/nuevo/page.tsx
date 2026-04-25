import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NuevoPacienteForm from '@/components/pacientes/NuevoPacienteForm'

export const metadata = { title: 'Alta de Paciente — ConsultorioApp' }

export default async function NuevoPacientePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: obrasSocialesDB } = await supabase
    .from('obras_sociales')
    .select('nombre')
    .eq('validada', true)
    .order('nombre')

  const obrasSociales = (obrasSocialesDB ?? []).map((o) => o.nombre)

  return <NuevoPacienteForm terapeutaId={user.id} obrasSociales={obrasSociales} />
}

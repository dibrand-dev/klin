import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Auto-bloquear si el trial venció
  if (profile.estado_cuenta === 'trial' && new Date(profile.trial_fin) < new Date()) {
    await supabase.from('profiles').update({ estado_cuenta: 'bloqueada' }).eq('id', user.id)
    redirect('/cuenta-bloqueada')
  }

  if (profile.estado_cuenta === 'bloqueada' || profile.estado_cuenta === 'cancelada') {
    redirect('/cuenta-bloqueada')
  }

  return <AppShell profile={profile}>{children}</AppShell>
}

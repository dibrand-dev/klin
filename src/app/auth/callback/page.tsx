'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const handleCallback = async () => {
      console.log('🔵 CALLBACK: iniciando')
      console.log('🔵 CALLBACK: hash:', window.location.hash.substring(0, 100))
      console.log('🔵 CALLBACK: search:', window.location.search)

      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      console.log('🔵 CALLBACK: code presente:', !!code)
      console.log('🔵 CALLBACK: hash tiene access_token:', hash.includes('access_token'))

      if (code) {
        console.log('🔵 CALLBACK: usando flujo PKCE')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('🔵 CALLBACK: exchangeCodeForSession error:', error?.message ?? 'ninguno')
        if (error) {
          router.replace('https://www.klia.com.ar/login?error=auth_callback_error')
          return
        }
      } else if (hash && hash.includes('access_token')) {
        console.log('🔵 CALLBACK: usando flujo implícito')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔵 CALLBACK: getSession error:', error?.message ?? 'ninguno')
        console.log('🔵 CALLBACK: session presente:', !!session)
        if (error || !session) {
          router.replace('https://www.klia.com.ar/login?error=auth_callback_error')
          return
        }
      } else {
        console.log('🔵 CALLBACK: ni code ni access_token → redirigiendo a login')
        router.replace('https://www.klia.com.ar/login?error=auth_callback_error')
        return
      }

      // Session established — check if admin or new user
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔵 CALLBACK: session final presente:', !!session)
      if (!session) {
        router.replace('https://www.klia.com.ar/login?error=auth_callback_error')
        return
      }

      console.log('🔵 CALLBACK: user email:', session.user.email)

      // Check if admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', session.user.email ?? '')
        .eq('activo', true)
        .maybeSingle()

      console.log('🔵 CALLBACK: es admin:', !!adminUser)
      if (adminUser) {
        router.replace('/ops/dashboard')
        return
      }

      // Check if new user (no trial_fin set)
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_fin, nombre, apellido')
        .eq('id', session.user.id)
        .single()

      console.log('🔵 CALLBACK: profile trial_fin:', profile?.trial_fin ?? 'null')

      if (!profile?.trial_fin) {
        console.log('🔵 CALLBACK: usuario nuevo → inicializando trial')
        const trialFin = new Date()
        trialFin.setDate(trialFin.getDate() + 21)

        const meta = session.user.user_metadata ?? {}
        const googleFullName: string = meta.full_name || meta.name || ''
        const googleGivenName: string = meta.given_name || googleFullName.split(' ')[0] || ''
        const googleFamilyName: string = meta.family_name || googleFullName.split(' ').slice(1).join(' ') || ''
        const googleAvatar: string | null = meta.avatar_url || meta.picture || null

        const { error: updateError } = await supabase.from('profiles').update({
          plan: 'premium',
          estado_cuenta: 'trial',
          trial_inicio: new Date().toISOString(),
          trial_fin: trialFin.toISOString(),
          ...(googleGivenName && !profile?.nombre && { nombre: googleGivenName }),
          ...(googleFamilyName && !profile?.apellido && { apellido: googleFamilyName }),
          ...(googleAvatar && { avatar_url: googleAvatar }),
        }).eq('id', session.user.id)

        console.log('🔵 CALLBACK: update profile error:', updateError?.message ?? 'ninguno')

        // Send welcome email
        fetch('/api/emails/bienvenida', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id }),
        }).catch(() => {})

        console.log('🔵 CALLBACK: redirigiendo a /bienvenida')
        router.replace('/bienvenida')
        return
      }

      console.log('🔵 CALLBACK: usuario existente → redirigiendo a /dashboard')
      router.replace('/dashboard')
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #001a48',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ color: '#444651', fontSize: 14 }}>Verificando tu cuenta...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

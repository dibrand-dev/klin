import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import IntegracionesClient from '@/components/ajustes/IntegracionesClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Integraciones — KLIA' }

export default async function IntegracionesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: googleTokens } = await supabase
    .from('google_calendar_tokens')
    .select('sync_enabled')
    .eq('terapeuta_id', user.id)
    .maybeSingle()

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 md:px-7 pt-6 md:pt-8 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/ajustes"
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Ajustes
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-on-surface mb-2">Integraciones</h1>
      <p className="text-sm text-on-surface-variant mb-8">
        Conectá KLIA con tus herramientas externas.
      </p>

      <Suspense>
        <IntegracionesClient
          conectado={!!googleTokens}
          syncEnabled={googleTokens?.sync_enabled ?? false}
        />
      </Suspense>
    </div>
  )
}

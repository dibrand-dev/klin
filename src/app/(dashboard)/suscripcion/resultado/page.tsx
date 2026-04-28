'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type EstadoSuscripcion = {
  estado: 'pending' | 'authorized' | 'paused' | 'cancelled' | null
  plan: string | null
  modalidad: 'mensual' | 'anual' | null
  suscripcion_fin: string | null
  mp_preapproval_id: string | null
  monto: number | null
}

const NOMBRE_PLAN: Record<string, string> = {
  esencial: 'Esencial',
  profesional: 'Profesional',
  premium: 'Premium',
}

export default function ResultadoSuscripcionPage() {
  const [estado, setEstado] = useState<EstadoSuscripcion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/suscripcion/estado')
      .then((r) => r.json())
      .then((d) => { setEstado(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const exitoso = estado?.estado === 'authorized'
  const proximoCobro = estado?.suscripcion_fin
    ? format(parseISO(estado.suscripcion_fin), "d 'de' MMMM 'de' yyyy", { locale: es })
    : null

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-outline-variant/10 p-10 max-w-md w-full text-center space-y-6">
        {exitoso ? (
          <>
            <div className="flex justify-center">
              <span
                className="material-symbols-outlined text-6xl text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-primary mb-2">
                ¡Suscripción activada!
              </h1>
              {estado?.plan && (
                <p className="text-on-surface-variant text-sm">
                  Tu plan <strong>{NOMBRE_PLAN[estado.plan] ?? estado.plan}</strong> está activo.
                </p>
              )}
              {proximoCobro && (
                <p className="text-on-surface-variant text-sm mt-1">
                  Próximo cobro: <strong>{proximoCobro}</strong>
                </p>
              )}
            </div>
            <Link
              href="/"
              className="inline-block w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Ir a mi consultorio
            </Link>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <span
                className="material-symbols-outlined text-6xl text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cancel
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface mb-2">
                No pudimos procesar el pago
              </h1>
              <p className="text-on-surface-variant text-sm">
                Podés intentarlo nuevamente o contactarnos a{' '}
                <a href="mailto:hola@klia.com.ar" className="text-primary underline">
                  hola@klia.com.ar
                </a>
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/planes"
                className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-container transition-colors"
              >
                Ver planes
              </Link>
              <a
                href="mailto:hola@klia.com.ar"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Contactar soporte
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

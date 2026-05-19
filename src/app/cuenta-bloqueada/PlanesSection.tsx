'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLANES_KLIA } from '@/lib/mercadopago'

function fmt(n: number) {
  return n.toLocaleString('es-AR')
}

const CHECK = (
  <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="3" fill="none">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export default function PlanesSection() {
  const [ciclo, setCiclo] = useState<'mensual' | 'anual'>('mensual')

  const p = (plan: keyof typeof PLANES_KLIA) =>
    ciclo === 'mensual' ? PLANES_KLIA[plan].precio_mensual : PLANES_KLIA[plan].precio_anual_mensual

  return (
    <>
      {/* Billing toggle */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#8A93A1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Elegí tu plan
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 100, background: '#fff', border: '1px solid #E7E9EE', boxShadow: '0 1px 2px rgba(16,24,40,.04)' }}>
          <button
            onClick={() => setCiclo('mensual')}
            style={{
              padding: '9px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 500,
              background: ciclo === 'mensual' ? '#0B1220' : 'transparent',
              color: ciclo === 'mensual' ? 'white' : '#5B6472',
              transition: 'all .2s',
            }}
          >
            Mensual
          </button>
          <button
            onClick={() => setCiclo('anual')}
            style={{
              padding: '9px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: ciclo === 'anual' ? '#0B1220' : 'transparent',
              color: ciclo === 'anual' ? 'white' : '#5B6472',
              transition: 'all .2s',
            }}
          >
            Anual
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 100,
              background: ciclo === 'anual' ? 'rgba(255,255,255,0.18)' : '#E7F5EE',
              color: ciclo === 'anual' ? 'white' : '#0E8A5F',
              fontSize: 10.5, fontWeight: 700,
            }}>
              2 meses gratis
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 1080, margin: '0 auto' }}
        className="plans-grid">
        {/* ESENCIAL */}
        <article style={{ background: '#fff', border: '1px solid #E7E9EE', borderRadius: 18, padding: '24px 22px 22px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#AEB5C0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Para empezar</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Esencial</h3>
          <p style={{ fontSize: 13, color: '#5B6472', marginBottom: 18, minHeight: 36 }}>Para profesionales independientes que recién empiezan a digitalizar.</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>$</span>
            <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', color: '#0B1220', lineHeight: 1 }}>{fmt(p('esencial'))}</span>
            <span style={{ fontSize: 13.5, color: '#5B6472', fontWeight: 500 }}>/mes</span>
          </div>
          <div style={{ fontSize: 12, color: '#AEB5C0', marginBottom: 20, minHeight: 18 }}>
            {ciclo === 'anual' ? <><b style={{ color: '#0E8A5F' }}>Ahorrás 2 meses</b></> : 'Facturación mensual'}
          </div>
          <div style={{ marginBottom: 22 }}>
            <Link href="/planes" style={{ display: 'block', width: '100%', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid #E7E9EE', background: '#fff', color: '#1F2937', textAlign: 'center', textDecoration: 'none' }}>
              Elegir Esencial
            </Link>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #E7E9EE', paddingTop: 20, flex: 1 }}>
            {[
              <><b>Hasta 30 pacientes</b> activos</>,
              'Agenda + recordatorios por email',
              'Historia clínica básica',
              'Facturación manual',
              'Soporte por email',
            ].map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: '#1F2937', lineHeight: 1.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{CHECK}</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* PROFESIONAL (featured) */}
        <article style={{ background: 'radial-gradient(circle at 100% 0%, rgba(79,70,229,0.06) 0%, transparent 50%), #fff', border: '1px solid #4F46E5', borderRadius: 18, padding: '24px 22px 22px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 18px 38px rgba(79,70,229,0.10)', transform: 'translateY(-4px)' }}>
          <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', color: 'white', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 100, whiteSpace: 'nowrap', boxShadow: '0 12px 28px rgba(79,70,229,.18)' }}>
            ★ Más popular
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>El más elegido</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Profesional</h3>
          <p style={{ fontSize: 13, color: '#5B6472', marginBottom: 18, minHeight: 36 }}>Para consultorios que necesitan IA, facturación y reportes clínicos.</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>$</span>
            <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', color: '#0B1220', lineHeight: 1 }}>{fmt(p('profesional'))}</span>
            <span style={{ fontSize: 13.5, color: '#5B6472', fontWeight: 500 }}>/mes</span>
          </div>
          <div style={{ fontSize: 12, color: '#AEB5C0', marginBottom: 20, minHeight: 18 }}>
            {ciclo === 'anual' ? <><b style={{ color: '#0E8A5F' }}>Ahorrás 2 meses</b></> : 'Facturación mensual'}
          </div>
          <div style={{ marginBottom: 22 }}>
            <Link href="/planes" style={{ display: 'flex', width: '100%', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', color: 'white', textAlign: 'center', textDecoration: 'none', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 28px rgba(79,70,229,.18)' }}>
              Elegir Profesional
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" strokeWidth="2" fill="none"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </Link>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #E7E9EE', paddingTop: 20, flex: 1 }}>
            {[
              <><b>Hasta 150 pacientes</b> activos</>,
              'Agenda + WhatsApp + email',
              'Historia clínica completa',
              <><b>Resumen IA</b> por sesión (Gemini)</>,
              'Facturación AFIP integrada',
              'Informes clínicos exportables',
              'Soporte prioritario',
            ].map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: '#1F2937', lineHeight: 1.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{CHECK}</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* PREMIUM */}
        <article style={{ background: '#fff', border: '1px solid #E7E9EE', borderRadius: 18, padding: '24px 22px 22px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#AEB5C0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Para centros y equipos</div>
          <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Premium</h3>
          <p style={{ fontSize: 13, color: '#5B6472', marginBottom: 18, minHeight: 36 }}>Para centros de salud con varios profesionales y altas exigencias.</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>$</span>
            <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', color: '#0B1220', lineHeight: 1 }}>{fmt(p('premium'))}</span>
            <span style={{ fontSize: 13.5, color: '#5B6472', fontWeight: 500 }}>/mes</span>
          </div>
          <div style={{ fontSize: 12, color: '#AEB5C0', marginBottom: 20, minHeight: 18 }}>
            {ciclo === 'anual' ? <><b style={{ color: '#0E8A5F' }}>Ahorrás 2 meses</b></> : 'Facturación mensual'}
          </div>
          <div style={{ marginBottom: 22 }}>
            <Link href="/planes" style={{ display: 'block', width: '100%', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid #E7E9EE', background: '#fff', color: '#1F2937', textAlign: 'center', textDecoration: 'none' }}>
              Elegir Premium
            </Link>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #E7E9EE', paddingTop: 20, flex: 1 }}>
            {[
              <><b>Pacientes ilimitados</b></>,
              <><b>Multi-profesional</b> (5 cuentas)</>,
              'Todo lo del plan Profesional',
              <><b>IA avanzada</b> + interconsultas</>,
              'API y integraciones',
              'Backup en la nube cifrado',
              'Soporte 24/7 + onboarding',
            ].map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: '#1F2937', lineHeight: 1.5 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{CHECK}</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .plans-grid { grid-template-columns: 1fr !important; max-width: 480px !important; }
        }
      `}</style>
    </>
  )
}

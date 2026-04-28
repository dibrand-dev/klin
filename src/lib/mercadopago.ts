import { MercadoPagoConfig, PreApprovalPlan, PreApproval } from 'mercadopago'

const isProduction =
  process.env.NODE_ENV === 'production' && process.env.MP_USE_PRODUCTION === 'true'

export const mpClient = new MercadoPagoConfig({
  accessToken: isProduction
    ? process.env.MP_ACCESS_TOKEN_PROD!
    : process.env.MP_ACCESS_TOKEN_TEST!,
  options: { timeout: 5000 },
})

export const preApprovalPlan = new PreApprovalPlan(mpClient)
export const preApproval = new PreApproval(mpClient)

export const PLANES_KLIA = {
  esencial: {
    nombre: 'Plan Esencial KLIA',
    precio_mensual: 15000,
    precio_anual_mensual: 13750,
  },
  profesional: {
    nombre: 'Plan Profesional KLIA',
    precio_mensual: 28000,
    precio_anual_mensual: 25667,
  },
  premium: {
    nombre: 'Plan Premium KLIA',
    precio_mensual: 42000,
    precio_anual_mensual: 38500,
  },
} as const

export type PlanKlia = keyof typeof PLANES_KLIA
export type Modalidad = 'mensual' | 'anual'

export function getMonto(plan: PlanKlia, modalidad: Modalidad): number {
  const p = PLANES_KLIA[plan]
  return modalidad === 'mensual' ? p.precio_mensual : p.precio_anual_mensual
}

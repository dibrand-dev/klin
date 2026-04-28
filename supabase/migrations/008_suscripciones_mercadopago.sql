-- Tabla de suscripciones Mercado Pago
CREATE TABLE IF NOT EXISTS suscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terapeuta_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('esencial', 'profesional', 'premium')),
  modalidad text NOT NULL CHECK (modalidad IN ('mensual', 'anual')),
  mp_preapproval_id text,
  mp_preapproval_plan_id text,
  estado text DEFAULT 'pending' CHECK (estado IN ('pending', 'authorized', 'paused', 'cancelled')),
  monto numeric(10,2) NOT NULL,
  suscripcion_inicio timestamptz,
  suscripcion_fin timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "terapeuta accede a su suscripcion" ON suscripciones
  FOR ALL USING (auth.uid() = terapeuta_id);

-- Referencia rápida en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mp_preapproval_id text;

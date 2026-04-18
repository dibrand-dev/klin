-- Flag de pago en turnos
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS pagado boolean DEFAULT false;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS motivo_cancelacion text;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS recordatorio_enviado boolean DEFAULT false;

-- Tabla de notas clínicas
CREATE TABLE IF NOT EXISTS notas_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terapeuta_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  paciente_id uuid REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  turno_id uuid REFERENCES turnos(id) ON DELETE SET NULL,
  fecha date NOT NULL,
  contenido text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notas_clinicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terapeuta accede a sus notas" ON notas_clinicas
  FOR ALL USING (auth.uid() = terapeuta_id);

CREATE INDEX IF NOT EXISTS notas_clinicas_paciente_id_idx ON notas_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS notas_clinicas_terapeuta_id_idx ON notas_clinicas(terapeuta_id);

CREATE TRIGGER handle_updated_at_notas_clinicas
  BEFORE UPDATE ON notas_clinicas
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

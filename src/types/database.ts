export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nombre: string
          apellido: string
          matricula: string | null
          especialidad: string | null
          telefono: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nombre: string
          apellido: string
          matricula?: string | null
          especialidad?: string | null
          telefono?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string
          apellido?: string
          matricula?: string | null
          especialidad?: string | null
          telefono?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          id: string
          terapeuta_id: string
          nombre: string
          apellido: string
          dni: string | null
          fecha_nacimiento: string | null
          telefono: string | null
          email: string | null
          obra_social: string | null
          numero_afiliado: string | null
          notas: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          terapeuta_id: string
          nombre: string
          apellido: string
          dni?: string | null
          fecha_nacimiento?: string | null
          telefono?: string | null
          email?: string | null
          obra_social?: string | null
          numero_afiliado?: string | null
          notas?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          terapeuta_id?: string
          nombre?: string
          apellido?: string
          dni?: string | null
          fecha_nacimiento?: string | null
          telefono?: string | null
          email?: string | null
          obra_social?: string | null
          numero_afiliado?: string | null
          notas?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pacientes_terapeuta_id_fkey'
            columns: ['terapeuta_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      turnos: {
        Row: {
          id: string
          terapeuta_id: string
          paciente_id: string
          fecha_hora: string
          duracion_min: number
          modalidad: 'presencial' | 'videollamada' | 'telefonica'
          estado: 'pendiente' | 'confirmado' | 'cancelado' | 'realizado' | 'no_asistio'
          monto: number | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          terapeuta_id: string
          paciente_id: string
          fecha_hora: string
          duracion_min?: number
          modalidad?: 'presencial' | 'videollamada' | 'telefonica'
          estado?: 'pendiente' | 'confirmado' | 'cancelado' | 'realizado' | 'no_asistio'
          monto?: number | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          terapeuta_id?: string
          paciente_id?: string
          fecha_hora?: string
          duracion_min?: number
          modalidad?: 'presencial' | 'videollamada' | 'telefonica'
          estado?: 'pendiente' | 'confirmado' | 'cancelado' | 'realizado' | 'no_asistio'
          monto?: number | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'turnos_paciente_id_fkey'
            columns: ['paciente_id']
            isOneToOne: false
            referencedRelation: 'pacientes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'turnos_terapeuta_id_fkey'
            columns: ['terapeuta_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_turno: 'cancelado' | 'confirmado' | 'no_asistio' | 'pendiente' | 'realizado'
      modalidad_turno: 'presencial' | 'telefonica' | 'videollamada'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos derivados del Database (fuente de verdad)
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Paciente = Database['public']['Tables']['pacientes']['Row']
export type TurnoRow = Database['public']['Tables']['turnos']['Row']
export type EstadoTurno = Database['public']['Enums']['estado_turno']
export type ModalidadTurno = Database['public']['Enums']['modalidad_turno']

// Turno con join de paciente para uso en componentes
export interface Turno extends TurnoRow {
  paciente?: Paciente
}

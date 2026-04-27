import * as XLSX from 'xlsx'
import type { ProfesionalObraSocial, Paciente } from '@/types/database'

export type ItemLiquidacion = {
  paciente: Pick<Paciente, 'nombre' | 'apellido' | 'numero_afiliado' | 'numero_autorizacion'>
  cantidad_sesiones: number
  honorario_unitario: number
  importe_total: number
}

function excelDateSerial(date: Date): number {
  // Excel serial date: days since 1900-01-01 (with leap year bug compatibility)
  const epoch = new Date(Date.UTC(1900, 0, 0))
  const days = Math.floor((date.getTime() - epoch.getTime()) / 86400000) + 1
  return days
}

function lastDayOfMonth(mes: number, anio: number): Date {
  return new Date(Date.UTC(anio, mes, 0)) // day 0 of next month = last day of this month
}

function mesLabel(mes: number): string {
  return [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ][mes - 1]
}

export function generarExcelOS(
  items: ItemLiquidacion[],
  os: ProfesionalObraSocial,
  mes: number,
  anio: number,
): void {
  const fechaUltimoDia = lastDayOfMonth(mes, anio)
  const fechaSerial = excelDateSerial(fechaUltimoDia)
  const observacion = mesLabel(mes)

  const filas = items.map(item => ({
    FECHA: fechaSerial,
    AFILIADO: item.paciente.numero_afiliado ?? '',
    PACIENTE: `${item.paciente.apellido.toUpperCase()}, ${item.paciente.nombre.toUpperCase()}`,
    PRACTICA: os.codigo_practica ?? '',
    DESCRIPCION: os.descripcion_practica ?? '',
    CANTIDAD: item.cantidad_sesiones,
    IMPORTE: item.importe_total,
    AUTORIZACION: item.paciente.numero_autorizacion ?? '',
    OBSERVACIONES: observacion,
  }))

  const ws = XLSX.utils.json_to_sheet(filas, {
    header: ['FECHA', 'AFILIADO', 'PACIENTE', 'PRACTICA', 'DESCRIPCION', 'CANTIDAD', 'IMPORTE', 'AUTORIZACION', 'OBSERVACIONES'],
  })

  // Formato de número para columna FECHA (tipo fecha Excel)
  const fechaCol = 'A'
  for (let r = 2; r <= filas.length + 1; r++) {
    const cell = ws[`${fechaCol}${r}`]
    if (cell) {
      cell.t = 'n'
      cell.z = 'dd/mm/yyyy'
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Planilla')

  const nombreMes = observacion.charAt(0) + observacion.slice(1).toLowerCase()
  const nombreOS = os.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  const fileName = `Planilla_${nombreMes}_${nombreOS}.xlsx`

  XLSX.writeFile(wb, fileName)
}

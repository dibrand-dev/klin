import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFImage } from 'pdf-lib'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ColConfig {
  header: string
  variable: string
  ancho: number
  tipo: 'texto_centrado' | 'texto_izquierda' | 'imagen'
  punteado?: boolean
}

export interface CampoConfig {
  label: string
  variable: string
  y: number
  align?: 'left' | 'right'
  inline?: Array<{ label: string; variable: string }>
}

export interface ConfigPlanilla {
  pagina: { ancho: number; alto: number; margen: number }
  header: {
    logo?: { x: number; y: number; ancho: number; alto: number }
    titulo: string
    subtitulo?: string
    campos: CampoConfig[]
  }
  tabla: {
    y_inicio: number
    altura_fila: number
    tipo_especial?: 'semanal'
    columnas: ColConfig[]
    filas_pagina_1: number
    filas_pagina_2?: number
    filas_por_semana?: number
    semanas_por_pagina?: number
  }
}

export interface SesionGenerica {
  fecha: string          // "01/05"
  diaSemana?: string     // "Lunes"
  horaInicio: string
  horaFin: string
  horario?: string       // "09:00 - 09:50"
  cantidadSesiones?: number
  firmaProfesionalUrl?: string
  firmaPacienteUrl?: string
}

export interface DatosGenericos {
  anio: string
  prestador: string
  domicilio: string
  afiliado: string
  dni?: string
  numeroSocio: string
  tratamiento: string
  mesAnio: string         // "MAYO 2026"
  numeroAutorizacion: string
  emailTel?: string
  logoUrl?: string
  sesiones: SesionGenerica[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const C_BLACK = rgb(0, 0, 0)
const C_DARK  = rgb(0.13, 0.13, 0.13)
const C_MUTED = rgb(0.6, 0.6, 0.6)
const C_LIGHT = rgb(0.8, 0.8, 0.8)

// ── Helpers ──────────────────────────────────────────────────────────────────

function yb(pageH: number, kitY: number, h = 0): number {
  return pageH - kitY - h
}

function imgFit(img: PDFImage, maxW: number, maxH: number) {
  const s = Math.min(maxW / img.width, maxH / img.height, 1)
  return { width: img.width * s, height: img.height * s }
}

async function fetchBuf(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch { return null }
}

async function embedImg(doc: PDFDocument, buf: Buffer): Promise<PDFImage | null> {
  try {
    if (buf[0] === 0x89 && buf[1] === 0x50) return await doc.embedPng(buf)
    if (buf[0] === 0xFF && buf[1] === 0xD8) return await doc.embedJpg(buf)
    return await doc.embedJpg(buf)
  } catch {
    try { return await doc.embedPng(buf) } catch { return null }
  }
}

function resolveTitulo(titulo: string, datos: DatosGenericos): string {
  return titulo.replace('{anio}', datos.anio)
}

function resolveVariable(variable: string, datos: DatosGenericos): string {
  const map: Record<string, string> = {
    prestador:         datos.prestador,
    domicilio:         datos.domicilio,
    afiliado:          datos.afiliado,
    dni:               datos.dni ?? '',
    numeroSocio:       datos.numeroSocio,
    tratamiento:       datos.tratamiento,
    mesAnio:           datos.mesAnio,
    numeroAutorizacion: datos.numeroAutorizacion,
    emailTel:          datos.emailTel ?? '',
    anio:              datos.anio,
  }
  return map[variable] ?? ''
}

function resolveSesionVar(variable: string, sesion: SesionGenerica): string {
  if (variable === 'horario') return sesion.horario ?? `${sesion.horaInicio} - ${sesion.horaFin}`
  if (variable === 'cantidadSesiones') return (sesion.cantidadSesiones ?? 1).toString()
  const map: Record<string, string | undefined> = {
    fecha:       sesion.fecha,
    diaSemana:   sesion.diaSemana ?? '',
    horaInicio:  sesion.horaInicio,
    horaFin:     sesion.horaFin,
  }
  return map[variable] ?? ''
}

// ── Header ───────────────────────────────────────────────────────────────────

function renderHeader(
  page: PDFPage,
  fonts: { reg: PDFFont; bold: PDFFont; obl: PDFFont },
  cfg: ConfigPlanilla,
  datos: DatosGenericos,
  pageH: number,
  imgCache: Record<string, PDFImage | null>,
) {
  const { header, pagina } = cfg

  // Logo
  const logoImg = datos.logoUrl ? imgCache[datos.logoUrl] : null
  if (logoImg && header.logo) {
    const { x, y, ancho, alto } = header.logo
    const dims = imgFit(logoImg, ancho, alto)
    page.drawImage(logoImg, { x, y: yb(pageH, y, dims.height), width: dims.width, height: dims.height })
  }

  // Title
  const titulo = resolveTitulo(header.titulo, datos)
  const titleFS = 12
  const titleW = fonts.bold.widthOfTextAtSize(titulo, titleFS)
  const cx = pagina.margen + (pagina.ancho - 2 * pagina.margen - titleW) / 2
  const titleKitY = header.logo ? (header.logo.y + header.logo.alto + 20) : 50
  page.drawText(titulo, { x: cx, y: yb(pageH, titleKitY, titleFS), font: fonts.bold, size: titleFS, color: C_BLACK })
  page.drawLine({
    start: { x: cx, y: yb(pageH, titleKitY, titleFS) - 2 },
    end:   { x: cx + titleW, y: yb(pageH, titleKitY, titleFS) - 2 },
    thickness: 0.5, color: C_BLACK,
  })

  // Subtitle
  if (header.subtitulo) {
    const subFS = 9
    const subW = fonts.obl.widthOfTextAtSize(header.subtitulo, subFS)
    const subKitY = titleKitY + 18
    page.drawText(header.subtitulo, {
      x: pagina.margen + (pagina.ancho - 2 * pagina.margen - subW) / 2,
      y: yb(pageH, subKitY, subFS),
      font: fonts.obl, size: subFS, color: C_DARK,
    })
  }

  // Fields
  const FS = 9
  const W = pagina.ancho - 2 * pagina.margen
  for (const campo of header.campos) {
    const baseY = yb(pageH, campo.y, FS)
    const labelText = campo.label
    const value = resolveVariable(campo.variable, datos)

    if (campo.align === 'left') {
      // Label then value immediately
      page.drawText(labelText, { x: pagina.margen, y: baseY, font: fonts.reg, size: FS, color: C_DARK })
      const labelW = fonts.reg.widthOfTextAtSize(labelText, FS)
      const spW = fonts.reg.widthOfTextAtSize(' ', FS)
      page.drawText(value, { x: pagina.margen + labelW + spW, y: baseY, font: fonts.bold, size: FS, color: C_BLACK })
      const valW = fonts.bold.widthOfTextAtSize(value, FS)
      const dotX1 = pagina.margen + labelW + spW + valW + 4
      const dotX2 = pagina.margen + W
      if (dotX2 > dotX1 + 6) {
        page.drawLine({ start: { x: dotX1, y: baseY + 1 }, end: { x: dotX2, y: baseY + 1 }, thickness: 0.4, color: C_MUTED, dashArray: [1, 2.5], dashPhase: 0 })
      }
    } else if (campo.inline) {
      // Inline multiple segments
      let cx2 = pagina.margen
      const segs: Array<{ text: string; bold: boolean }> = [
        { text: labelText, bold: false },
        { text: '  ' + value, bold: true },
        ...campo.inline.flatMap(seg => [
          { text: seg.label, bold: false },
          { text: '  ' + resolveVariable(seg.variable, datos), bold: true },
        ]),
      ]
      for (const seg of segs) {
        const f = seg.bold ? fonts.bold : fonts.reg
        page.drawText(seg.text, { x: cx2, y: baseY, font: f, size: FS, color: seg.bold ? C_BLACK : C_DARK })
        cx2 += f.widthOfTextAtSize(seg.text, FS)
      }
    } else {
      // Default: label left, value right, dots between
      page.drawText(labelText, { x: pagina.margen, y: baseY, font: fonts.reg, size: FS, color: C_DARK })
      const labelW = fonts.reg.widthOfTextAtSize(labelText, FS)
      const valW = fonts.bold.widthOfTextAtSize(value, FS)
      page.drawText(value, { x: pagina.margen + W - valW, y: baseY, font: fonts.bold, size: FS, color: C_BLACK })
      const dotX1 = pagina.margen + labelW + 4
      const dotX2 = pagina.margen + W - valW - 4
      if (dotX2 > dotX1 + 6) {
        page.drawLine({ start: { x: dotX1, y: baseY + 1 }, end: { x: dotX2, y: baseY + 1 }, thickness: 0.4, color: C_MUTED, dashArray: [1, 2.5], dashPhase: 0 })
      }
    }
  }
}

// ── Table ────────────────────────────────────────────────────────────────────

function colXOffsets(cols: ColConfig[], margen: number): number[] {
  const xs: number[] = []
  let x = margen
  for (const col of cols) { xs.push(x); x += col.ancho }
  return xs
}

function drawTableHeader(
  page: PDFPage,
  fonts: { bold: PDFFont },
  cols: ColConfig[],
  colXs: number[],
  kitY: number,
  hdrH: number,
  pageH: number,
) {
  const FS = 8
  cols.forEach((col, i) => {
    page.drawRectangle({ x: colXs[i], y: yb(pageH, kitY, hdrH), width: col.ancho, height: hdrH, borderColor: C_BLACK, borderWidth: 0.5 })
    const lines = col.header.split('\n')
    const lineH = FS + 3
    const totalH = lines.length * lineH
    const startY = kitY + (hdrH - totalH) / 2
    lines.forEach((line, li) => {
      const lw = fonts.bold.widthOfTextAtSize(line, FS)
      page.drawText(line, {
        x: colXs[i] + (col.ancho - lw) / 2,
        y: yb(pageH, startY + li * lineH, FS),
        font: fonts.bold, size: FS, color: C_BLACK,
      })
    })
  })
}

function drawDataRow(
  page: PDFPage,
  fonts: { reg: PDFFont },
  cols: ColConfig[],
  colXs: number[],
  kitY: number,
  rowH: number,
  pageH: number,
  sesion: SesionGenerica | null,
  imgCache: Record<string, PDFImage | null>,
) {
  cols.forEach((col, i) => {
    page.drawRectangle({ x: colXs[i], y: yb(pageH, kitY, rowH), width: col.ancho, height: rowH, borderColor: C_BLACK, borderWidth: 0.5 })
  })

  if (!sesion) {
    if (cols[0]?.punteado) {
      const midY = kitY + rowH / 2
      page.drawLine({
        start: { x: colXs[0] + 6, y: yb(pageH, midY) },
        end:   { x: colXs[0] + cols[0].ancho - 6, y: yb(pageH, midY) },
        thickness: 0.4, color: C_LIGHT, dashArray: [1, 2.5], dashPhase: 0,
      })
    }
    return
  }

  const FS = 10
  const textKitY = kitY + rowH / 2 - FS / 2

  cols.forEach((col, i) => {
    if (col.tipo === 'texto_centrado' || col.tipo === 'texto_izquierda') {
      const text = resolveSesionVar(col.variable, sesion)
      if (!text) return
      const tw = fonts.reg.widthOfTextAtSize(text, FS)
      const textX = col.tipo === 'texto_centrado'
        ? colXs[i] + (col.ancho - tw) / 2
        : colXs[i] + 4
      page.drawText(text, { x: textX, y: yb(pageH, textKitY, FS), font: fonts.reg, size: FS, color: C_BLACK })
    } else if (col.tipo === 'imagen') {
      const url = col.variable === 'firmaProfesional' ? sesion.firmaProfesionalUrl : sesion.firmaPacienteUrl
      if (!url || !imgCache[url]) return
      const img = imgCache[url]!
      const maxW = col.ancho - 2
      const maxH = rowH - 2
      const dims = imgFit(img, maxW, maxH)
      const xC = colXs[i] + (col.ancho - dims.width) / 2
      const yOff = (rowH - dims.height) / 2
      page.drawImage(img, { x: xC, y: yb(pageH, kitY + yOff, dims.height), width: dims.width, height: dims.height })
    }
  })
}

function renderTable(
  page: PDFPage,
  fonts: { reg: PDFFont; bold: PDFFont },
  cfg: ConfigPlanilla,
  sesiones: SesionGenerica[],
  pageH: number,
  imgCache: Record<string, PDFImage | null>,
  startRow: number,
  maxRows: number,
  startKitY: number,
) {
  const { tabla } = cfg
  const cols = tabla.columnas
  const colXs = colXOffsets(cols, cfg.pagina.margen)
  const hdrH = 28
  const rowH = tabla.altura_fila

  drawTableHeader(page, fonts, cols, colXs, startKitY, hdrH, pageH)

  let rowY = startKitY + hdrH
  for (let i = 0; i < maxRows; i++) {
    const sesion = sesiones[startRow + i] ?? null
    drawDataRow(page, fonts, cols, colXs, rowY, rowH, pageH, sesion, imgCache)
    rowY += rowH
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generarPlanillaGenerica(
  config: ConfigPlanilla,
  datos: DatosGenericos,
): Promise<Buffer> {
  const pageH = config.pagina.alto
  const pageW = config.pagina.ancho

  // Collect all image URLs
  const allUrls: string[] = []
  if (datos.logoUrl) allUrls.push(datos.logoUrl)
  if (!config.requiere_firma_olografa) {
    for (const s of datos.sesiones) {
      if (s.firmaProfesionalUrl && !allUrls.includes(s.firmaProfesionalUrl)) allUrls.push(s.firmaProfesionalUrl)
      if (s.firmaPacienteUrl    && !allUrls.includes(s.firmaPacienteUrl))    allUrls.push(s.firmaPacienteUrl)
    }
  }

  const rawCache: Record<string, Buffer | null> = {}
  await Promise.all(allUrls.map(async url => { rawCache[url] = await fetchBuf(url) }))

  const pdfDoc = await PDFDocument.create()
  const fonts = {
    reg:  await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    obl:  await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  }

  const imgCache: Record<string, PDFImage | null> = {}
  await Promise.all(allUrls.map(async url => {
    imgCache[url] = rawCache[url] ? await embedImg(pdfDoc, rawCache[url]!) : null
  }))

  const p1 = pdfDoc.addPage([pageW, pageH])
  renderHeader(p1, fonts, config, datos, pageH, imgCache)
  const p1Rows = config.tabla.filas_pagina_1
  renderTable(p1, fonts, config, datos.sesiones, pageH, imgCache, 0, p1Rows, config.tabla.y_inicio)

  if (datos.sesiones.length > p1Rows) {
    const p2Rows = config.tabla.filas_pagina_2 ?? 18
    const p2 = pdfDoc.addPage([pageW, pageH])
    renderTable(p2, fonts, config, datos.sesiones, pageH, imgCache, p1Rows, p2Rows, 40)
  }

  return Buffer.from(await pdfDoc.save())
}

// Expose for type checking — config may have requiere_firma_olografa at runtime
declare module './motor-generico' {
  interface ConfigPlanilla {
    requiere_firma_olografa?: boolean
  }
}

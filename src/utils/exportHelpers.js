import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'

export function generarPDFFactura(factura) {
  try {
    const doc = new jsPDF('p', 'pt', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 36
    let y = 0

    // Header Bar
    doc.setFillColor(26, 152, 136)
    doc.rect(0, 0, pageWidth, 80, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.text('FACTURA', margin, 50)

    const factNum = factura.fact_num || factura.nro || factura.numero || ''
    doc.setFontSize(14)
    doc.text(`# ${factNum}`, pageWidth - margin, 50, { align: 'right' })

    y = 100
    doc.setTextColor(0, 0, 0)

    // Info
    const fecha = factura.fec_emis ? (String(factura.fec_emis).split('T')[0] || factura.fec_emis) : ''
    let metaY = y
    doc.text('FECHA:', pageWidth - margin - 80, metaY, { align: 'right' })
    doc.text(fecha, pageWidth - margin, metaY, { align: 'right' })

    y += 40

    // Client Box
    doc.setFillColor(248, 249, 250)
    doc.rect(margin, y, pageWidth - margin * 2, 70, 'FD')
    let clientY = y + 15
    doc.setFontSize(10)
    doc.text('DATOS DEL CLIENTE', margin + 10, clientY)
    clientY += 16

    const clientName = (factura.cli_des || factura.co_cli || '').toUpperCase()
    doc.setFontSize(11)
    doc.text(clientName, margin + 10, clientY)
    clientY += 14

    doc.setFontSize(9)
    const rif = factura.rif || factura.cedula || ''
    if (rif) doc.text(`RIF: ${rif}`, margin + 10, clientY)

    y += 90

    // Table Header
    const tableX = margin
    const tableW = pageWidth - margin * 2
    doc.setFillColor(230, 230, 230)
    doc.rect(tableX, y, tableW, 20, 'F')
    
    doc.setFontSize(9)
    doc.text('Descripción', tableX + 5, y + 14)
    doc.text('Cant.', tableX + 320, y + 14, { align: 'right' })
    doc.text('Precio', tableX + 400, y + 14, { align: 'right' })
    doc.text('Subtotal', tableX + tableW - 5, y + 14, { align: 'right' })

    y += 20

    const articulos = Array.isArray(factura.articulos) ? factura.articulos : (Array.isArray(factura.productos) ? factura.productos : [])

    articulos.forEach((p, i) => {
      if (y > pageHeight - 100) {
        doc.addPage()
        y = 40
      }

      const desc = p.art_des || p.descripcion || p.co_art || ''
      const cod = p.co_art || ''
      const cant = p.total_art ?? p.cantidad ?? ''
      const prec = p.prec_vta ?? p.precio ?? 0
      const sub = p.reng_neto ?? p.subtotal ?? (Number(cant) * Number(prec))

      const descLines = doc.splitTextToSize(`${cod ? cod + ' - ' : ''}${desc}`, 280)
      const rowHeight = Math.max(20, descLines.length * 12 + 4)

      if (i % 2 === 1) {
        doc.setFillColor(252, 252, 252)
        doc.rect(tableX, y, tableW, rowHeight, 'F')
      }

      doc.text(descLines, tableX + 5, y + 14)
      doc.text(String(cant), tableX + 320, y + 14, { align: 'right' })
      doc.text(Number(prec).toFixed(2), tableX + 400, y + 14, { align: 'right' })
      doc.text(Number(sub).toFixed(2), tableX + tableW - 5, y + 14, { align: 'right' })

      y += rowHeight
    })

    y += 20
    const totalBoxX = pageWidth - margin - 180
    
    doc.text('TOTAL GENERAL:', totalBoxX, y)
    doc.text(Number(factura.tot_neto || 0).toFixed(2), pageWidth - margin, y, { align: 'right' })

    doc.save(`factura_${factNum || 'doc'}.pdf`)
  } catch (err) {
    console.error('generarPDFFactura error:', err)
  }
}

export async function generarExcelTransferencias(facturas) {
  try {
    if (!Array.isArray(facturas) || facturas.length === 0) return

    const hoy = new Date().toISOString().split('T')[0]

    // ── Paleta de colores ──────────────────────────────────────────────────────
    const COLOR = {
      verde:        '1a9888',   // encabezado principal
      verdeClaro:   'e6f7f5',   // fila par de renglones
      grisHeader:   '334155',   // cabecera de columnas
      grisClaro:    'f1f5f9',   // fila impar de renglones
      blanco:       'FFFFFF',
      amarillo:     'fef9c3',   // descuento
      azulOscuro:   '1e3a5f',   // factura header
      azulClaro:    'dbeafe',   // factura header fondo
      verde2:       '065f46',   // totales usd
      texto:        '1e293b',
    }

    // Estilos reutilizables
    const boldWhite  = { bold: true, color: { argb: 'FF' + COLOR.blanco } }
    const boldDark   = { bold: true, color: { argb: 'FF' + COLOR.texto } }

    const fillSolid = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } })

    const borderThin = {
      top:    { style: 'thin', color: { argb: 'FFcbd5e1' } },
      bottom: { style: 'thin', color: { argb: 'FFcbd5e1' } },
      left:   { style: 'thin', color: { argb: 'FFcbd5e1' } },
      right:  { style: 'thin', color: { argb: 'FFcbd5e1' } },
    }
    const borderMedTop = {
      ...borderThin,
      top: { style: 'medium', color: { argb: 'FF' + COLOR.verde } },
    }

    const alignCenter  = { horizontal: 'center', vertical: 'middle' }
    const alignRight   = { horizontal: 'right',  vertical: 'middle' }
    const alignLeft    = { horizontal: 'left',   vertical: 'middle' }

    // ── Workbook ───────────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook()
    wb.creator = 'CTE Sistema'
    wb.created = new Date()

    const ws = wb.addWorksheet('Transferencias', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 3 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    })

    // Anchos de columna (19 cols)
    // 1:Factura 2:Pedido 3:SICM 4:Cliente 5:RIF 6:Fecha 7:Tasa 8:Total Bs 9:Total $ 10:Desc%
    // 11:Usuario 12:#Reng 13:Código 14:Cod.Barras 15:Descripción 16:Cantidad 17:Precio$ 18:PrecioBS 19:Subtotal
    ws.columns = [
      { key: 'factura',   width: 14 },
      { key: 'pedido',    width: 11 },
      { key: 'sicm',      width: 10 },
      { key: 'cliente',   width: 36 },
      { key: 'rif',       width: 15 },
      { key: 'fecha',     width: 13 },
      { key: 'tasa',      width: 11 },
      { key: 'totBs',     width: 16 },
      { key: 'totUsd',    width: 13 },
      { key: 'desc',      width: 9  },
      { key: 'usuario',   width: 24 },
      { key: 'reng',      width: 8  },
      { key: 'codigo',    width: 13 },
      { key: 'codBar',    width: 18 },
      { key: 'articulo',  width: 60 },
      { key: 'cantidad',  width: 11 },
      { key: 'precio',    width: 13 },
      { key: 'precioBs',  width: 16 },
      { key: 'subtotal',  width: 15 },
    ]

    const TOTAL_COLS = 19

    // ── Fila 1: Título ─────────────────────────────────────────────────────────
    const titleRow = ws.addRow([`REPORTE DE TRANSFERENCIAS — ${hoy}`, ...Array(TOTAL_COLS - 1).fill('')])
    ws.mergeCells(1, 1, 1, TOTAL_COLS)
    titleRow.height = 32
    const titleCell = titleRow.getCell(1)
    titleCell.fill      = fillSolid(COLOR.verde)
    titleCell.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // ── Fila 2: Sub-título con totales globales ────────────────────────────────
    const totalGlobal = facturas.reduce((s, f) =>
      s + (Number(String(f.tot_neto || '0').replace(/[^0-9.-]/g, '')) || 0), 0)
    const subRow = ws.addRow([
      `${facturas.length} facturas`,
      ...Array(7).fill(''),
      `Total general: $${totalGlobal.toFixed(2)}`,
      ...Array(TOTAL_COLS - 9).fill('')
    ])
    ws.mergeCells(2, 1, 2, 8)
    ws.mergeCells(2, 9, 2, TOTAL_COLS)
    subRow.height = 20
    ;[1, 9].forEach(col => {
      const c = subRow.getCell(col)
      c.fill      = fillSolid('0f766e')
      c.font      = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
      c.alignment = col === 1 ? alignLeft : alignRight
    })

    // ── Fila 3: Cabecera de columnas ──────────────────────────────────────────
    const headers = [
      'FACTURA', 'PEDIDO', 'SICM', 'CLIENTE', 'RIF', 'FECHA',
      'TASA', 'TOTAL BS', 'TOTAL $', 'DESC %', 'USUARIO',
      '# RENG', 'CÓDIGO', 'COD. BARRAS', 'DESCRIPCIÓN', 'CANTIDAD', 'PRECIO UNIT. $', 'PRECIO UNIT. BS', 'TOTAL RENGLÓN'
    ]
    const hdrRow = ws.addRow(headers)
    hdrRow.height = 22
    hdrRow.eachCell(cell => {
      cell.fill      = fillSolid(COLOR.grisHeader)
      cell.font      = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
      cell.alignment = alignCenter
      cell.border    = borderThin
    })

    // ── Filas de datos ─────────────────────────────────────────────────────────
    // Col:  1       2       3     4        5    6      7     8      9       10    11
    //    Factura  Pedido  SICM  Cliente  RIF  Fecha  Tasa  TotBs  TotUsd  Desc  Usuario
    // Col: 12      13      14         15           16       17      18
    //    #Reng  Código  Cod.Barras  Descripción  Cantidad  Precio  Subtotal

    // Columnas centradas
    const CENTER_COLS = new Set([1, 2, 3, 5, 6, 12, 13, 14])
    // Columnas alineadas a la derecha
    const RIGHT_COLS  = new Set([7, 8, 9, 10, 16, 17, 18, 19])

    let dataRowIndex = 0

    facturas.forEach(f => {
      const factNum = f.fact_num || f.nro || ''
      const pedido  = f.pedido_num || ''
      const sicm    = f.sicm || ''
      const cliente = (f.cli_des || f.co_cli || '').toUpperCase()
      const rif     = f.rif || ''
      const fecha   = f.fec_emis ? String(f.fec_emis).split('T')[0] : ''
      const tasa    = Number(f.tasa)      || ''
      const totBs   = Number(f.tot_bruto) || ''
      const totUsd  = Number(String(f.tot_neto || '0').replace(/[^0-9.-]/g, '')) || ''
      const pct     = f.campo6 ? String(f.campo6) : ''
      const usuario = f.co_us_in || ''

      const arts = Array.isArray(f.articulos)
        ? f.articulos
        : (Array.isArray(f.productos) ? f.productos : [])

      const rowsToAdd = arts.length > 0 ? arts : [null]

      rowsToAdd.forEach((p) => {
        dataRowIndex++
        const isEven = dataRowIndex % 2 === 0
        const bgFill = fillSolid(isEven ? COLOR.verdeClaro : COLOR.blanco)

        const row = ws.addRow([
          factNum, pedido, sicm, cliente, rif, fecha, tasa, totBs, totUsd, pct, usuario,
          p ? (p.reng_num ?? '')                                          : '',
          p ? (p.co_art || p.codigo || '')                                : '',
          p ? (p.cod_bar || p.cod_barras || '')                           : '',
          p ? (p.art_des || p.descripcion || '')                          : '',
          p ? (p.total_art ?? p.cantidad ?? p.cant_producto ?? p.cant ?? '') : '',
          p ? (p.prec_vta ?? p.precio ?? p.precio_unitario ?? '')         : '',
          p ? (() => { const pu = Number(p.prec_vta ?? p.precio ?? p.precio_unitario ?? 0); const t = Number(f.tasa) || 0; return pu && t ? Number((pu * t).toFixed(2)) : '' })() : '',
          p ? (p.reng_neto ?? p.subtotal ?? p.total_linea ?? '')          : '',
        ])
        row.height = 16

        row.eachCell((cell, colNum) => {
          cell.fill   = bgFill
          cell.border = borderThin
          cell.font   = { size: 9, color: { argb: 'FF' + COLOR.texto } }

          if (CENTER_COLS.has(colNum))     cell.alignment = alignCenter
          else if (RIGHT_COLS.has(colNum)) cell.alignment = alignRight
          else                             cell.alignment = alignLeft

          // Negrita en N° factura
          if (colNum === 1) cell.font = { ...cell.font, bold: true }

          // Verde en Total $
          if (colNum === 9) {
            cell.font = { size: 9, bold: true, color: { argb: 'FF' + COLOR.verde2 } }
          }

          // Amarillo en Desc %
          if (colNum === 10 && pct) {
            cell.fill = fillSolid('fef08a')
            cell.font = { size: 9, bold: true, color: { argb: 'FF92400e' } }
          }
        })
      })
    })

    // ── Descargar en el navegador ──────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = `transferencias_${hoy}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('generarExcelTransferencias error:', err)
  }
}

export function generarPDFCatalogo(productos, tipo) {
  try {
    if (!Array.isArray(productos) || productos.length === 0) return

    const esRegional = tipo === 'regional'
    const titulo = esRegional
      ? 'CATÁLOGO REGIONAL — Táchira · Mérida · Trujillo'
      : 'CATÁLOGO NACIONAL — Otros Estados'
    const hoy = new Date().toISOString().split('T')[0]
    const nombreArchivo = esRegional ? `catalogo_regional_${hoy}.pdf` : `catalogo_nacional_${hoy}.pdf`

    const doc = new jsPDF('l', 'pt', 'a4')
    const pageWidth  = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 36

    // Header bar
    doc.setFillColor(26, 152, 136)
    doc.rect(0, 0, pageWidth, 60, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text(titulo, margin, 38)
    doc.setFontSize(9)
    doc.text(hoy, pageWidth - margin, 38, { align: 'right' })

    let y = 80

    // Columnas: x, width, label, align
    const tableX = margin
    const tableW = pageWidth - margin * 2
    const cols = [
      { label: 'CÓDIGO',          w: 70,  align: 'center' },
      { label: 'DESCRIPCIÓN',     w: 260, align: 'left'   },
      { label: 'STOCK',           w: 55,  align: 'right'  },
      { label: 'STOCK TÁCHIRA',   w: 80,  align: 'right'  },
      { label: 'STOCK BQTO',      w: 80,  align: 'right'  },
      { label: 'PRECIO',          w: 80,  align: 'right'  },
    ]

    const drawHeader = (startY) => {
      doc.setFillColor(51, 65, 85)
      doc.rect(tableX, startY, tableW, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(8)
      let cx = tableX + 4
      cols.forEach(col => {
        const tx = col.align === 'right' ? cx + col.w - 4 : col.align === 'center' ? cx + col.w / 2 : cx + 2
        doc.text(col.label, tx, startY + 12, { align: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left' })
        cx += col.w
      })
      return startY + 18
    }

    y = drawHeader(y)

    doc.setFontSize(8)
    productos.forEach((p, i) => {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = 30
        y = drawHeader(y)
      }
      const rowH = 16
      if (i % 2 === 0) {
        doc.setFillColor(230, 247, 245)
        doc.rect(tableX, y, tableW, rowH, 'F')
      }
      doc.setTextColor(30, 41, 59)
      let cx = tableX + 4
      const vals = [
        { v: p.imagen || '',                             align: 'center' },
        { v: p.descripcion || '',                        align: 'left'   },
        { v: p.stock != null ? String(p.stock) : '',     align: 'right'  },
        { v: p.stock_tachira != null ? String(p.stock_tachira) : '',    align: 'right' },
        { v: p.stock_barquisimeto != null ? String(p.stock_barquisimeto) : '', align: 'right' },
        { v: p.Precio != null ? Number(p.Precio).toFixed(2) : '',       align: 'right' },
      ]
      cols.forEach((col, ci) => {
        const val = vals[ci]
        const text = doc.splitTextToSize(val.v, col.w - 6)
        const tx = val.align === 'right' ? cx + col.w - 4 : val.align === 'center' ? cx + col.w / 2 : cx + 2
        doc.text(text[0] || '', tx, y + 11, { align: val.align === 'center' ? 'center' : val.align })
        cx += col.w
      })
      y += rowH
    })

    doc.save(nombreArchivo)
  } catch (err) {
    console.error('generarPDFCatalogo error:', err)
  }
}

export async function generarExcelCatalogo(productos, tipo) {
  try {
    if (!Array.isArray(productos) || productos.length === 0) return

    const hoy = new Date().toISOString().split('T')[0]
    const esRegional = tipo === 'regional'
    const titulo = esRegional
      ? `CATÁLOGO REGIONAL — Táchira · Mérida · Trujillo — ${hoy}`
      : `CATÁLOGO NACIONAL — Otros Estados — ${hoy}`
    const nombreArchivo = esRegional ? `catalogo_regional_${hoy}.xlsx` : `catalogo_nacional_${hoy}.xlsx`

    const COLOR = {
      verde:      '1a9888',
      grisHeader: '334155',
      verdeClaro: 'e6f7f5',
      blanco:     'FFFFFF',
      texto:      '1e293b',
    }

    const fillSolid = (hex) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } })
    const borderThin = {
      top:    { style: 'thin', color: { argb: 'FFcbd5e1' } },
      bottom: { style: 'thin', color: { argb: 'FFcbd5e1' } },
      left:   { style: 'thin', color: { argb: 'FFcbd5e1' } },
      right:  { style: 'thin', color: { argb: 'FFcbd5e1' } },
    }
    const alignCenter = { horizontal: 'center', vertical: 'middle' }
    const alignRight  = { horizontal: 'right',  vertical: 'middle' }
    const alignLeft   = { horizontal: 'left',   vertical: 'middle' }

    const wb = new ExcelJS.Workbook()
    wb.creator = 'CTE Sistema'
    wb.created = new Date()

    const ws = wb.addWorksheet('Catálogo', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    })

    const TOTAL_COLS = 6
    ws.columns = [
      { key: 'codigo',      width: 14 },
      { key: 'descripcion', width: 50 },
      { key: 'stock',       width: 12 },
      { key: 'stTachira',   width: 14 },
      { key: 'stBqto',      width: 16 },
      { key: 'precio',      width: 16 },
    ]

    // Fila título
    const titleRow = ws.addRow([titulo, ...Array(TOTAL_COLS - 1).fill('')])
    ws.mergeCells(1, 1, 1, TOTAL_COLS)
    titleRow.height = 30
    const titleCell = titleRow.getCell(1)
    titleCell.fill      = fillSolid(COLOR.verde)
    titleCell.font      = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Fila cabecera
    const headers = [
      'CÓDIGO', 'DESCRIPCIÓN', 'STOCK TOTAL',
      'STOCK TÁCHIRA', 'STOCK BARQUISIMETO',
      'PRECIO',
    ]
    const hdrRow = ws.addRow(headers)
    hdrRow.height = 20
    hdrRow.eachCell(cell => {
      cell.fill      = fillSolid(COLOR.grisHeader)
      cell.font      = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
      cell.alignment = alignCenter
      cell.border    = borderThin
    })

    const RIGHT_COLS = new Set([3, 4, 5, 6])

    productos.forEach((p, i) => {
      const isEven = i % 2 === 0
      const row = ws.addRow([
        p.imagen || '',
        p.descripcion || '',
        p.stock ?? '',
        p.stock_tachira ?? '',
        p.stock_barquisimeto ?? '',
        p.Precio ?? '',
      ])
      row.height = 15
      row.eachCell((cell, colNum) => {
        cell.fill   = fillSolid(isEven ? COLOR.blanco : COLOR.verdeClaro)
        cell.border = borderThin
        cell.font   = { size: 9, color: { argb: 'FF' + COLOR.texto } }
        if (colNum === 1) { cell.alignment = alignCenter; cell.font = { ...cell.font, bold: true } }
        else if (RIGHT_COLS.has(colNum)) cell.alignment = alignRight
        else cell.alignment = alignLeft
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const blob   = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = nombreArchivo
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('generarExcelCatalogo error:', err)
  }
}

export function generarExcelFactura(factura) {
  try {
    const factNum = factura.fact_num || factura.nro || factura.numero || 'factura'
    const cliente = (factura.cli_des || factura.co_cli || factura.cod_cliente || '').toUpperCase()
    const rif = factura.rif || factura.cedula || ''
    const fecha = factura.fec_emis ? (factura.fec_emis.split('T')[0] || factura.fec_emis) : (factura.fecha || '')

    const rows = []
    rows.push(['DOCUMENTO', 'FACTURA #' + factNum])
    rows.push(['CLIENTE', cliente])
    rows.push(['RIF / ID', rif])
    rows.push(['FECHA EMISION', fecha])
    rows.push([])
    rows.push(['#', 'Código', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total Renglón'])

    const articulos = Array.isArray(factura.articulos) ? factura.articulos : (Array.isArray(factura.productos) ? factura.productos : [])
    
    articulos.forEach((p, i) => {
      const codigo = (p.co_art || p.codigo || '') + ''
      const descripcion = p.art_des || p.descripcion || p.co_art || ''
      const cantidad = p.total_art ?? p.cantidad ?? p.cant_producto ?? p.cant ?? ''
      const precio = p.prec_vta ?? p.precio ?? p.precio_unitario ?? ''
      const subtotal = p.reng_neto ?? p.subtotal ?? p.total_linea ?? ''
      rows.push([i + 1, codigo, descripcion, cantidad, precio, subtotal])
    })

    rows.push([])
    rows.push(['', '', '', '', 'TOTAL GENERAL', factura.tot_neto ?? factura.tot_final ?? factura.total ?? ''])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 15 }]
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Factura')
    
    XLSX.writeFile(wb, `factura_${factNum || 'doc'}.xlsx`)
  } catch (err) {
    console.error('generarExcelFactura error:', err)
  }
}

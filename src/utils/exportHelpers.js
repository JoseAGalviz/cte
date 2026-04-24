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

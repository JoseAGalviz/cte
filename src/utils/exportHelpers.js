import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

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

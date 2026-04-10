import React, { useState } from 'react'
import { X, FileText, Printer } from 'lucide-react'

import { getPedidoCliente, getPedidoDescuento } from '../../services/pedidosService'
const loadPDF = () => Promise.all([import('jspdf'), import('jspdf-autotable')])

export default function ModalProforma({ pedido, onClose }) {
  const clienteNombre = getPedidoCliente(pedido)
  const descuentoStr = getPedidoDescuento(pedido)
  const productos = pedido.productos || []
  const factura = pedido.info_profit?.factura || {}
  const clienteProfit = pedido.info_profit?.cliente || {}
  const fecha = pedido.fecha ? new Date(String(pedido.fecha).replace(' ', 'T')).toLocaleDateString('es-VE') : '-'

  const [moneda, setMoneda] = useState('usd')

  const getTasa = () => {
    const valTasa = parseFloat(factura.tasa) || Number(pedido.info_profit?.valores?.tasa) || parseFloat(pedido.tasa) || 1
    return valTasa
  }

  const tasa = getTasa()
  const sym = moneda === 'usd' ? '$' : 'Bs'

  const calc = (val) => moneda === 'usd' ? Number(val || 0) : Number(val || 0) * tasa
  const fmt = (val) => calc(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  const subtotal = parseFloat(pedido.tot_bruto || pedido.tot_brut || productos.reduce((s, p) => s + (parseFloat(p.tot_art ?? p.subtotal) || 0), 0))
  const descPct = parseFloat(pedido.porc_gdesc) || 0
  const descMonto = parseFloat(pedido.glob_desc || (subtotal * (descPct / 100)))
  const iva = parseFloat(pedido.iva || 0)
  const total = parseFloat(pedido.tot_neto) || (subtotal - descMonto + iva)
  const saldo = parseFloat(pedido.saldo || total)


  const generarPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await loadPDF()
    const doc = new jsPDF('p', 'pt', 'a4')

    const isUSD = (moneda === 'usd')
    const pdfSym = isUSD ? 'USD' : 'Bs'

    // Header data
    const cli = clienteProfit || {}
    const fac = factura || {}
    const codPedido = pedido.fact_num || '-'
    const v_tasa = getTasa()

    // TITULO PRINCIPAL
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    doc.text('CENTRO DE TRANSFERENCIAS', 40, 45)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('PROFORMA TÉCNICA DE PRODUCTOS', 40, 60)

    // Separador Linea
    doc.setDrawColor(200, 200, 200)
    doc.line(40, 70, 555, 70)

    // Cabecera - INFO CLIENTE (Izquierda)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text('DATOS DEL CLIENTE', 40, 90)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Razón Social:`, 40, 105)
    doc.setFont('helvetica', 'bold')
    doc.text(String(clienteNombre || 'N/A'), 110, 105)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`R.I.F.:`, 40, 120)
    doc.text(String(cli.rif || 'N/A'), 110, 120)
    
    doc.text(`Domicilio:`, 40, 135)
    // Wrap address
    const splitDirec = doc.splitTextToSize(cli.direc1 || 'No especificada', 280)
    doc.text(splitDirec, 110, 135)

    // Cabecera - INFO FACTURA (Derecha)
    const rigthColX = 400
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLES DEL DOCUMENTO', rigthColX, 90)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Factura N°:`, rigthColX, 105)
    doc.setFont('helvetica', 'bold')
    doc.text(String(codPedido), rigthColX + 70, 105)
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Fecha Emisión:`, rigthColX, 120)
    doc.text(String(fecha), rigthColX + 70, 120)
    
    doc.text(`Días Crédito:`, rigthColX, 135)
    doc.text(`${String(cli.tipo || '0')} (Recibido)`, rigthColX + 70, 135)

    const startYTable = 160


    // Rows mapping
    const rows = productos.map(p => ({
      articulo: p.art_des || p.co_art || '',
      lote: p.campo1 || '',
      cantidad: (parseFloat(p.cantidad) || 0).toFixed(0) + ' ' + (p.uni_venta || 'UND'),
      precio: (p.precio_unit ?? p.precio) !== undefined ? fmt(p.precio_unit ?? p.precio) : '',
      dscto: p.porc_desc || '0',
      ts: '( E )',
      total: (p.tot_art ?? p.subtotal) !== undefined ? fmt(p.tot_art ?? p.subtotal) : ''
    }))

    autoTable(doc, {
      columns: [
        { header: 'Artículo', dataKey: 'articulo' },
        { header: 'Lote', dataKey: 'lote' },
        { header: 'Cantidad', dataKey: 'cantidad' },
        { header: `Precio (${pdfSym})`, dataKey: 'precio' },
        { header: 'Dcto.%', dataKey: 'dscto' },
        { header: 'TS', dataKey: 'ts' },
        { header: `Total (${pdfSym})`, dataKey: 'total' }
      ],
      body: rows,
      startY: startYTable,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        textColor: [50, 50, 50],
        lineColor: [230, 230, 230]
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        articulo: { cellWidth: 200 },
        lote: { cellWidth: 50, halign: 'center' },
        cantidad: { halign: 'center', cellWidth: 50 },
        precio: { halign: 'right', cellWidth: 65 },
        dscto: { halign: 'center', cellWidth: 40 },
        ts: { halign: 'center', cellWidth: 35 },
        total: { halign: 'right', cellWidth: 75 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { left: 40, right: 40 }
    })


    const finalY = doc.lastAutoTable.finalY + 30

    // CAJA IZQUIERDA (Info Legal)
    doc.setDrawColor(220, 220, 220)
    doc.setFillColor(252, 252, 252)
    doc.rect(40, finalY, 240, 105, 'FD')

    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.text("A los efectos de lo previsto en el Art. 25", 45, finalY + 16)
    doc.text("de la Ley de Impuesto al Valor Agregado", 45, finalY + 28)
    doc.text("se expresan los Montos de la factura en", 45, finalY + 40)
    doc.text(`${pdfSym} calculado a la tasa de cambio establecida`, 45, finalY + 52)
    doc.text(`por BCV EN 1 USD $ por Bs.S.- ${v_tasa.toFixed(2)}`, 45, finalY + 64)

    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    doc.text(`Sub-Total (${pdfSym}):`, 45, finalY + 80)
    doc.setFont('helvetica', 'bold')
    doc.text(`${fmt(subtotal)}`, 270, finalY + 80, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.text("% Descuento:", 45, finalY + 92)
    doc.text(`${descPct.toFixed(2)} %`, 270, finalY + 92, { align: 'right' })

    doc.text(`Total Neto (${pdfSym}):`, 45, finalY + 104)
    doc.setFont('helvetica', 'bold')
    doc.text(`${fmt(total)}`, 270, finalY + 104, { align: 'right' })

    // CAJA DERECHA (Totales)
    doc.setFillColor(248, 250, 252)
    doc.rect(320, finalY, 235, 105, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.text("Sub-Total:", 330, finalY + 18)
    doc.text(`${fmt(subtotal)}`, 550, finalY + 18, { align: 'right' })

    doc.text("Descuento:", 330, finalY + 33)
    doc.text(`${descPct.toFixed(2)} %`, 550, finalY + 33, { align: 'right' })

    doc.text("Total Exento:", 330, finalY + 48)
    doc.text(`${fmt(total)}`, 550, finalY + 48, { align: 'right' })

    doc.text("Base Imp. (16%):", 330, finalY + 63)
    doc.text(`0.00`, 550, finalY + 63, { align: 'right' })

    doc.text("I.V.A.(16%):", 330, finalY + 78)
    doc.text(`0.00`, 550, finalY + 78, { align: 'right' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74) // Emerald 600
    doc.text(`Total Gral. (${pdfSym}):`, 330, finalY + 95)
    doc.text(`${fmt(total)}`, 550, finalY + 95, { align: 'right' })


    // NOTAS AL PÍE
    doc.setFontSize(10)
    doc.text("Monto a Cancelar, si el pago es realizado en moneda diferente a la del curso legal", 40, finalY + 140)

    const symInverso = isUSD ? 'Bs' : 'USD'
    const fmtInverso = isUSD ? (Number(total) * v_tasa).toFixed(2) : Number(total).toFixed(2)

    doc.text(`Subtotal:  0.00`, 40, finalY + 160)
    doc.text(`Total al cambio (${symInverso}):  ${fmtInverso}`, 130, finalY + 160)

    doc.text("Aplica 10% de Descuento por Cumplimiento de Términos y Condiciones", 40, finalY + 185)

    doc.save(`Proforma_${pedido.fact_num || 'pedido'}_${pdfSym}.pdf`)

  }

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-h-[95vh] max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center shrink-0">
          <h5 className="font-black text-base flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-2 rounded-lg"><FileText size={16} /></div>
            Proforma Técnica — {pedido.fact_num || 'Solicitud'}
          </h5>
          <div className="flex items-center gap-4">
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:bg-white focus:text-slate-800 transition-all cursor-pointer outline-none"
            >
              <option value="usd">Dólares (USD)</option>
              <option value="bs">Bolívares (Bs)</option>
            </select>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>


        {/* Content */}
        <div className="overflow-auto flex-grow p-5">
          {/* Info Principal */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'N° Solicitud', value: pedido.fact_num || '-' },
              { label: 'N° Factura', value: factura.fact_num || '-' },
              { label: 'Fecha Emisión', value: fecha },
              { label: 'Visitador', value: pedido.co_us_in || '-' },
              { label: 'Descuento', value: descuentoStr },
              { label: 'Tasa Cambio', value: tasa !== 1 ? `${tasa.toFixed(2)} Bs` : '-' },
            ].map(f => (
              <div key={f.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="font-bold text-slate-800 text-xs sm:text-sm">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="text-[0.65rem] text-emerald-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                Identificación del Cliente
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-black text-slate-800 text-base">{clienteNombre}</p>
                <div className="flex gap-4 text-xs font-semibold text-slate-600">
                  <span>RIF: <span className="text-slate-800">{clienteProfit.rif || pedido.rif || '-'}</span></span>
                  {clienteProfit.nit && <span>NIT: <span className="text-slate-800">{clienteProfit.nit}</span></span>}
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  <span className="font-bold uppercase text-[0.6rem] text-slate-400 block mb-0.5">Dirección Fiscal:</span>
                  {clienteProfit.direc1 || 'No especificada'}
                </p>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-2xl p-4 flex flex-col justify-center">
              <p className="text-[0.6rem] text-gray-400 font-black uppercase tracking-widest mb-3 text-center">Resumen Financiero</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bruto:</span>
                  <span className="font-bold font-mono">{fmt(subtotal)} {sym}</span>
                </div>

                {descPct > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Desc. ({descuentoStr}):</span>
                    <span className="font-bold font-mono">-{fmt(descMonto)} {sym}</span>
                  </div>

                )}
                {iva > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">IVA:</span>
                    <span className="font-bold font-mono">{fmt(iva)} {sym}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-gray-700">
                  <span className="text-emerald-400 font-black uppercase text-xs">Total Neto:</span>
                  <span className="font-black font-mono text-emerald-400 text-lg">{fmt(total)} {sym}</span>

                </div>
                {saldo > 0 && saldo !== total && (
                  <div className="flex justify-between pt-1 text-xs">
                    <span className="text-gray-400 italic">Saldo Pend.:</span>
                    <span className="font-bold text-gray-200">{fmt(saldo)} {sym}</span>
                  </div>

                )}
              </div>
            </div>
          </div>

          {/* Products table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-5 py-4 text-left">Descripción del Artículo</th>
                  <th className="px-5 py-4 text-center w-24">Cantidad</th>
                  <th className="px-5 py-4 text-right w-32">P. Unitario ({sym})</th>
                  <th className="px-5 py-4 text-right w-32">Monto Total ({sym})</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productos.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400 italic">No hay registros de productos para esta solicitud</td></tr>
                )}
                {productos.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-xs font-semibold text-gray-700">{p.art_des || '-'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="bg-slate-800 text-white px-2 py-1 rounded text-[0.65rem] font-black">{parseFloat(p.cantidad).toFixed(0)}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600 font-mono text-xs">
                      {fmt(p.precio_unit ?? p.precio)}
                    </td>
                    <td className="px-5 py-3 text-right font-black text-slate-800 font-mono text-xs">
                      {fmt(p.tot_art ?? p.subtotal)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8 text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold text-gray-800 w-28 text-right font-mono">{fmt(subtotal)} {sym}</span>
            </div>
            {descPct > 0 && (
              <div className="flex gap-8 text-red-600">
                <span>Descuento ({descuentoStr})</span>
                <span className="font-bold w-28 text-right font-mono">-{fmt(descMonto)} {sym}</span>
              </div>
            )}
            <div className="flex gap-8 text-emerald-600 border-t border-gray-200 pt-2 mt-1">
              <span className="font-black text-base">TOTAL</span>
              <span className="font-black text-base w-40 text-right font-mono">{fmt(total)} {sym}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            Cerrar
          </button>
          <button onClick={generarPDF} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-black text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
            <FileText size={14} /> Descargar PDF
          </button>
        </div>

      </div>
    </div>
  )
}

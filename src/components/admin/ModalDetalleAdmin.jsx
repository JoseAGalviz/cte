import { useState } from 'react'
import { X, FileText } from 'lucide-react'

export default function ModalDetalleAdmin({ detalle, onClose }) {
  const [moneda, setMoneda] = useState('bolivares')

  if (!detalle) return null

  const f = detalle.factura || {}
  const renglones = detalle.renglones || []
  const rate = Number(f.tasa) || 1
  const sym = moneda === 'dolares' ? '$' : 'Bs.'

  const apply = v => {
    const n = Number(v || 0) || 0
    return moneda === 'dolares' && rate ? n / rate : n
  }
  const fmt = v => apply(v).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText size={18} className="text-rose-500" />
            Proforma — {f.fact_num || ''}
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={moneda}
              onChange={e => setMoneda(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="bolivares">Bolívares</option>
              <option value="dolares">Dólares</option>
            </select>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50 text-sm">
          {[
            ['Factura', f.fact_num],
            ['Fecha', f.fec_emis],
            ['Cliente', f.cli_des],
            ['Tasa BCV', Number(f.tasa || 1).toLocaleString('es-ES', { minimumFractionDigits: 2 })],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-0.5">{label}</p>
              <p className="font-semibold text-slate-700 truncate">{val || '—'}</p>
            </div>
          ))}
        </div>

        {/* Renglones */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 shadow-sm">
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-2.5">#</th>
                <th className="text-left px-4 py-2.5">Descripción</th>
                <th className="text-center px-4 py-2.5">Cant.</th>
                <th className="text-right px-4 py-2.5">P. Unit. ({sym})</th>
                <th className="text-right px-4 py-2.5">Subtotal ({sym})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {renglones.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">Sin artículos</td></tr>
              ) : renglones.map((r, i) => {
                const cant = Number(r.cantidad || r.cant_producto || r.qty || r.cant || r.total_art || 0) || 0
                const subtotalRaw = Number(r.reng_neto || 0) || 0
                const precioRaw = cant ? subtotalRaw / cant : Number(r.precio || r.precio_unitario || 0) || 0
                return (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      <p className="font-medium text-sm">{(r.art_des || '').replace(/[\r\n]+/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{r.co_art || ''}</p>
                    </td>
                    <td className="px-4 py-2.5 text-center text-slate-600">{cant || ''}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{fmt(precioRaw)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700 font-mono">{fmt(subtotalRaw)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-6 text-slate-600">
              <span>Subtotal</span>
              <span className="w-36 text-right font-mono">{sym} {fmt(f.tot_neto)}</span>
            </div>
            <div className="flex gap-6 text-slate-600">
              <span>IVA</span>
              <span className="w-36 text-right font-mono">{sym} {fmt(f.iva)}</span>
            </div>
            <div className="flex gap-6 text-slate-500 text-xs">
              <span>Tasa BCV</span>
              <span className="w-36 text-right font-mono">{Number(f.tasa || 1).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex gap-6 text-slate-600">
              <span>Saldo</span>
              <span className="w-36 text-right font-mono">{sym} {fmt(f.saldo)}</span>
            </div>
            <div className="flex gap-6 text-emerald-700 font-bold border-t border-slate-200 pt-2 mt-1 text-base">
              <span>TOTAL</span>
              <span className="w-36 text-right font-mono">{sym} {fmt(f.tot_neto)}</span>
            </div>
          </div>
          {f.comentario && (
            <p className="text-xs text-slate-400 mt-3">
              <span className="font-bold text-slate-500">Obs.:</span> {String(f.comentario).replace(/[\r\n]+/g, ' ')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-slate-600 border border-slate-200 px-5 py-2 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

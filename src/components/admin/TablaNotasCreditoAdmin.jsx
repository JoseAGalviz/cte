import { useMemo } from 'react'

function fmt(n) {
  return Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TablaNotasCreditoAdmin({ notas = [], provMap = {} }) {
  const rows = useMemo(() => notas.map(n => ({
    prov: provMap[n.co_prov] || n.prov_des || n.proveedor || '',
    factura: n.factura || n.fact_num || n.fac_num || '',
    obs: n.observacion || n.obs || n.descripcion || '',
    monto: Number(n.monto || n.importe || 0) || 0,
    fecha: n.fecha ? new Date(n.fecha).toLocaleDateString('es-VE') : '',
  })), [notas, provMap])

  const total = rows.reduce((s, r) => s + r.monto, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Notas de Crédito</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Proveedor</th>
              <th className="text-left px-4 py-2.5 font-medium">N° Factura</th>
              <th className="text-left px-4 py-2.5 font-medium">Observación</th>
              <th className="text-right px-4 py-2.5 font-medium">Monto</th>
              <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-slate-400 py-8">Sin datos</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2.5 text-slate-700 font-medium">{r.prov}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.factura}</td>
                <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">{r.obs}</td>
                <td className="px-4 py-2.5 text-right text-slate-700 font-medium">{fmt(r.monto)}</td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{r.fecha}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-600 text-sm">
                TOTAL MONTO:
              </td>
              <td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

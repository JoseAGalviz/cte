import { useMemo } from 'react'

function parseNum(s) {
  if (!s) return 0
  const t = String(s).replace(/[^0-9,.-]/g, '')
  const n = t.indexOf('.') !== -1 && t.indexOf(',') !== -1
    ? t.replace(/\./g, '').replace(',', '.')
    : t.indexOf(',') !== -1 ? t.replace(',', '.') : t
  return parseFloat(n) || 0
}

function fmt(n) {
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TablaTransacciones({ filas = [], notasMap = {} }) {
  function normalize(s) {
    return String(s || '').replace(/^\s*\d+\s*[-. ]\s*/, '').replace(/\s+/g, ' ').trim().toUpperCase()
  }

  const rows = useMemo(() =>
    filas.map(item => {
      const prov = item.prov_des || item.proveedor || ''
      const monto = Number(item.tot_neto ?? item.total_desc ?? 0) || 0
      const notas = notasMap[normalize(prov)] || 0
      return { prov, monto, notas, deuda: monto - notas }
    }), [filas, notasMap])

  const totalDeuda = rows.reduce((s, r) => s + r.deuda, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Transacciones por Proveedor</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-medium">Proveedor</th>
              <th className="text-right px-4 py-2.5 font-medium">Monto</th>
              <th className="text-right px-4 py-2.5 font-medium">N. Crédito</th>
              <th className="text-right px-4 py-2.5 font-medium">Deuda Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-slate-400 py-8">Sin datos</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2.5 text-slate-700 font-medium">{r.prov}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{fmt(r.monto)}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">
                  {r.notas ? fmt(r.notas) : '—'}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${r.deuda > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {fmt(r.deuda)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-600" colSpan={3}>
                DEUDA TOTAL:
              </td>
              <td className="px-4 py-3 text-right font-bold text-rose-700 text-base">
                {fmt(totalDeuda)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

import { CreditCard } from 'lucide-react'
import { formatFecha, formatCurrency } from '../../services/pedidosService'

export default function TablaNotasCredito({ notas }) {
  const hasData = Array.isArray(notas) && notas.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
          <CreditCard size={18} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight text-muted">
          Notas de Crédito
        </h3>
      </div>

      <div className="overflow-auto max-h-[300px]">
        {!hasData ? (
          <div className="bg-slate-50 text-slate-500 p-4 rounded-lg text-center text-sm">
            Sin notas de crédito para este periodo.
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-500 uppercase text-[0.65rem] tracking-wider border-b border-slate-200">
                <th className="px-4 py-2 font-semibold">Fecha</th>
                <th className="px-4 py-2 font-semibold">Observación</th>
                <th className="px-4 py-2 font-semibold">#Fact.</th>
                <th className="px-4 py-2 font-semibold text-right">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notas.map((n, idx) => {
                const fecha = formatFecha(n.fec_emis || n.fecha || n.created_at || n.created || n.fec || '')
                const factura = n.fact_num || n.factura || n.nro_factura || n.numero || '-'
                const observacion = n.observacion || n.obs || n.descripcion || n.desc || '-'
                const netoBase = (n.tot_neto !== undefined && n.tot_neto !== null) ? n.tot_neto : (n.neto !== undefined ? n.neto : (n.monto !== undefined ? n.monto : (n.amount !== undefined ? n.amount : '')))
                const monto = formatCurrency(netoBase)

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{fecha}</td>
                    <td className="px-4 py-2 font-medium text-slate-700 max-w-[150px] truncate" title={observacion}>{observacion}</td>
                    <td className="px-4 py-2 font-bold text-slate-800">{factura}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">{monto}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

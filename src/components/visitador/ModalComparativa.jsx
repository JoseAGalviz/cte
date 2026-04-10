import { X, AlertTriangle } from 'lucide-react'

export default function ModalComparativa({ pedido, onClose }) {
  const infoProfit = pedido.info_profit || {}
  const itemsPedido = pedido.productos || []
  const itemsProfit = infoProfit.renglones_factura || []
  const maxLen = Math.max(itemsPedido.length, itemsProfit.length)

  const fechaPedido = pedido.fecha ? new Date(String(pedido.fecha).replace(' ', 'T')).toLocaleDateString('es-VE') : '-'
  const fechaFactura = infoProfit.factura?.fec_emis ? new Date(String(infoProfit.factura.fec_emis).replace(' ', 'T')).toLocaleDateString('es-VE') : '-'

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-h-[95vh] max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header Principal */}
        <div className="bg-amber-500 text-white px-5 py-4 flex justify-between items-center shrink-0">
          <h5 className="font-black text-base flex items-center gap-3">
            <AlertTriangle size={20} />
            Comparativa Detallada — Pedido vs Facturado
          </h5>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Metadata Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-amber-50 border-b border-amber-200 divide-y md:divide-y-0 md:divide-x divide-amber-200">

          {/* LADO IZQUIERDO: PEDIDO LOCAL */}
          <div className="p-4 sm:p-5">
            <h6 className="text-[0.65rem] font-black text-amber-700 uppercase tracking-[0.2em] mb-3">Datos del Pedido</h6>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-medium text-slate-600">
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">N° Pedido</span>
                <span className="font-black text-slate-800 text-sm">{pedido.fact_num || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Fecha Pedido</span>
                <span className="font-bold text-slate-800">{fechaPedido}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Vendedor (Visitador)</span>
                <span className="font-bold text-slate-800 truncate">{pedido.co_us_in || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Total Neto</span>
                <span className="font-black text-emerald-600 text-sm">{parseFloat(pedido.tot_neto || 0).toFixed(2)} $</span>
              </div>
              <div className="col-span-2">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Identificador Único (Código)</span>
                <p className="font-mono text-[0.65rem] text-slate-500 break-all">{pedido.codigo_pedido || '-'}</p>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: INFO PROFIT */}
          <div className="p-4 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <h6 className="text-[0.65rem] font-black text-blue-700 uppercase tracking-[0.2em]">Datos de la Factura</h6>
              {infoProfit.factura?.tasa && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[0.6rem] font-black">TASA: {parseFloat(infoProfit.factura.tasa).toFixed(2)}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-medium text-slate-600">
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">N° Factura</span>
                <span className="font-black text-slate-800 text-sm">{infoProfit.factura?.fact_num || 'NO ENCONTRADA'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Fecha Facturación</span>
                <span className="font-bold text-slate-800">{fechaFactura}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Cliente (Razón Social)</span>
                <span className="font-black text-slate-800 truncate uppercase">{infoProfit.cliente?.cli_des || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">RIF Cliente</span>
                <span className="font-bold text-slate-800">{infoProfit.cliente?.rif || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Total Facturado</span>
                <span className="font-black text-blue-600 text-sm">{parseFloat(infoProfit.factura?.tot_neto || 0).toFixed(2)} VES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Comparisons */}
        <div className="overflow-auto flex-grow bg-slate-50">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest bg-white border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center w-10">#</th>
                <th className="px-5 py-3 border-r border-slate-200 text-center text-amber-700 bg-amber-50/30">Detalle del Pedido</th>
                <th className="px-5 py-3 text-center text-blue-700 bg-blue-50/30">Detalle de la Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: maxLen }, (_, i) => {
                const prod = itemsPedido[i]
                const reng = itemsProfit[i]

                const cantPed = parseFloat(prod?.cantidad || 0)
                const cantFac = parseFloat(reng?.can_art || reng?.cantidad || 0)
                const mismatch = !prod || !reng || Math.abs(cantPed - cantFac) > 0.01

                const localDesc = prod?.art_des || prod?.descripcion || (reng?.art_des || reng?.descripcion) || prod?.co_art || 'S/D'

                return (
                  <tr key={i} className={`${mismatch ? 'bg-red-50/30' : 'hover:bg-white'} transition-colors`}>
                    <td className="px-4 py-4 text-center text-[0.65rem] text-slate-400 font-black">{i + 1}</td>

                    {/* CELDA PEDIDO */}
                    <td className={`px-5 py-4 border-r border-slate-200 ${!prod ? 'bg-red-50' : ''}`}>
                      {prod
                        ? <div>
                          <p className="font-bold text-xs text-slate-800 leading-tight mb-1">{localDesc}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[0.65rem] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">Cant: {parseFloat(prod.cantidad).toFixed(0)}</span>
                            <span className="text-[0.65rem] text-slate-400 font-mono italic">{prod.co_art}</span>
                          </div>
                        </div>
                        : <span className="text-red-400 text-[0.65rem] font-black uppercase tracking-wider italic">Sin dato en pedido</span>
                      }
                    </td>

                    {/* CELDA PROFIT */}
                    <td className={`px-5 py-4 ${!reng ? 'bg-red-50' : ''}`}>
                      {reng
                        ? <div>
                          <p className="font-bold text-xs text-slate-800 leading-tight mb-1">{reng.art_des || reng.co_art || reng.descripcion || 'S/D'}</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-black ${prod && parseFloat(prod.cantidad) !== parseFloat(reng.can_art || reng.cantidad) ? 'bg-red-600 text-white' : 'bg-blue-100 text-blue-700'}`}>
                              Fact: {parseFloat(reng.can_art || reng.cantidad || 0).toFixed(0)}
                            </span>
                            <span className="text-[0.65rem] text-slate-400 font-mono italic">Reg: {reng.num_doc || reng.fact_num || '-'}</span>
                          </div>
                        </div>
                        : <span className="text-red-400 text-[0.65rem] font-black uppercase tracking-wider italic">Sin dato en factura</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="text-[0.65rem] text-slate-400 italic">
            * Las discrepancias en fondo rojo indican diferencias de cantidad o items faltantes entre sistemas.
          </div>
          <button onClick={onClose} className="px-8 py-2.5 bg-slate-800 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer">
            Finalizar Revisión
          </button>
        </div>

      </div>
    </div>
  )
}

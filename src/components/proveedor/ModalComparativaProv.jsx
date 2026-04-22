import { X, GitCompare } from 'lucide-react'

const IMG_BASE = 'https://imagenes.cristmedicals.com/imagenes-v3/imagenes/'

function getImg(co_art) {
  if (!co_art) return null
  return `${IMG_BASE}${String(co_art).replace(/[A-Za-z]$/, '')}.jpg`
}

function formatFecha(val) {
  if (!val) return '-'
  try { return new Date(String(val).replace(' ', 'T')).toLocaleDateString('es-VE') } catch { return val }
}

export default function ModalComparativaProv({ factura, onClose }) {
  const pedido = Array.isArray(factura.db_mysql) ? factura.db_mysql : []
  const factArt = Array.isArray(factura.articulos) ? factura.articulos : []

  // Match by co_art for smarter comparison
  const artMap = {}
  factArt.forEach(a => { if (a.co_art) artMap[String(a.co_art).trim()] = a })

  // Union of all co_art keys to show all rows
  const pedMap = {}
  pedido.forEach(p => { if (p.co_art) pedMap[String(p.co_art).trim()] = p })
  const allCodes = Array.from(new Set([
    ...pedido.map(p => String(p.co_art || '').trim()),
    ...factArt.map(a => String(a.co_art || '').trim()),
  ].filter(Boolean)))

  const totalPedido = pedido.reduce((s, p) => s + (Number(p.cantidad || p.cant || 0)), 0)
  const totalFacturado = factArt.reduce((s, a) => s + (Number(a.total_art || a.cantidad || 0)), 0)

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-black/70 p-2 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-h-[95vh] max-w-6xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-violet-600 text-white px-5 py-4 flex justify-between items-center shrink-0">
          <h5 className="font-black text-base flex items-center gap-3">
            <GitCompare size={20} />
            Comparativa — Pedido y Facturado
          </h5>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-violet-50 border-b border-violet-200 divide-y md:divide-y-0 md:divide-x divide-violet-200">

          {/* Pedido (db_mysql) */}
          <div className="p-4 sm:p-5">
            <h6 className="text-[0.65rem] font-black text-amber-700 uppercase tracking-[0.2em] mb-3">Datos del Pedido</h6>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-medium text-slate-600">
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">N° Pedido</span>
                <span className="font-black text-slate-800 text-sm">{factura.pedido_num || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Items pedidos</span>
                <span className="font-black text-slate-800 text-sm">{pedido.length}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Vendedor</span>
                <span className="font-bold text-slate-800 truncate">{factura.co_us_in || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-amber-600/70 font-bold uppercase tracking-wider">Unidades pedidas</span>
                <span className="font-black text-amber-700 text-sm">{totalPedido || pedido.length}</span>
              </div>
            </div>
          </div>

          {/* Factura (articulos) */}
          <div className="p-4 sm:p-5">
            <div className="flex justify-between items-start mb-3">
              <h6 className="text-[0.65rem] font-black text-blue-700 uppercase tracking-[0.2em]">Datos de la Factura</h6>
              {factura.tasa && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[0.6rem] font-black">
                  TASA: {parseFloat(factura.tasa).toFixed(2)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-medium text-slate-600">
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">N° Factura</span>
                <span className="font-black text-slate-800 text-sm">{factura.fact_num || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Fecha</span>
                <span className="font-bold text-slate-800">{formatFecha(factura.fec_emis)}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Cliente</span>
                <span className="font-black text-slate-800 truncate uppercase">{factura.cli_des || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Total $</span>
                <span className="font-black text-emerald-600 text-sm">{parseFloat(factura.tot_neto || 0).toFixed(2)} $</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.55rem] text-blue-600/70 font-bold uppercase tracking-wider">Total Bs</span>
                <span className="font-black text-blue-600 text-sm">{parseFloat(factura.tot_bruto || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla comparativa */}
        <div className="overflow-auto flex-grow bg-slate-50">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest bg-white border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center w-10">#</th>
                <th className="px-5 py-3 border-r border-slate-200 text-center text-amber-700 bg-amber-50/30">
                  Pedido SOLICITADO
                </th>
                <th className="px-5 py-3 text-center text-blue-700 bg-blue-50/30">
                  Facturado — {totalFacturado} uds
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allCodes.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-slate-400">Sin datos para comparar.</td>
                </tr>
              )}
              {allCodes.map((code, i) => {
                const ped = pedMap[code]
                const art = artMap[code]

                const cantPed = Number(ped?.cantidad || ped?.cant || 0)
                const cantFac = Number(art?.total_art || art?.cantidad || 0)
                const mismatch = !ped || !art || (cantPed > 0 && cantFac > 0 && Math.abs(cantPed - cantFac) > 0.01)

                return (
                  <tr key={code} className={`${mismatch ? 'bg-red-50/30' : 'hover:bg-white'} transition-colors`}>
                    <td className="px-4 py-4 text-center text-[0.65rem] text-slate-400 font-black">{i + 1}</td>

                    {/* PEDIDO */}
                    <td className={`px-5 py-4 border-r border-slate-200 ${!ped ? 'bg-red-50' : ''}`}>
                      {ped ? (
                        <div className="flex items-start gap-3">
                          <img
                            src={getImg(ped.co_art)}
                            alt=""
                            className="w-10 h-10 object-contain rounded border border-slate-200 bg-white shrink-0"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                          <div>
                            <p className="font-bold text-xs text-slate-800 leading-tight mb-1">{ped.art_des || ped.co_art || '-'}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[0.65rem] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black">
                                Cód: {ped.co_art}
                              </span>
                              {cantPed > 0 && (
                                <span className="text-[0.65rem] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black">
                                  Cant: {cantPed}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-400 text-[0.65rem] font-black uppercase tracking-wider italic">
                          Sin dato en pedido
                        </span>
                      )}
                    </td>

                    {/* FACTURADO */}
                    <td className={`px-5 py-4 ${!art ? 'bg-red-50' : ''}`}>
                      {art ? (
                        <div className="flex items-start gap-3">
                          <img
                            src={getImg(art.co_art)}
                            alt=""
                            className="w-10 h-10 object-contain rounded border border-slate-200 bg-white shrink-0"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                          <div>
                            <p className="font-bold text-xs text-slate-800 leading-tight mb-1">{art.art_des || art.co_art || '-'}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-black ${cantPed > 0 && Math.abs(cantPed - cantFac) > 0.01
                                ? 'bg-red-600 text-white'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                Cant: {cantFac}
                              </span>
                              {art.prec_vta && (
                                <span className="text-[0.65rem] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black">
                                  {parseFloat(art.prec_vta).toFixed(2)} $/u
                                </span>
                              )}
                              {art.reng_neto && (
                                <span className="text-[0.65rem] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-black">
                                  Total: {parseFloat(art.reng_neto).toFixed(2)} $
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-400 text-[0.65rem] font-black uppercase tracking-wider italic">
                          No facturado
                        </span>
                      )}
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
            * Fondo rojo: artículo ausente en un lado o diferencia de cantidad entre pedido y factura.
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-800 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}

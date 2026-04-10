import { Fragment } from 'react'
import { X, Package } from 'lucide-react'


const IMG_BASE = 'https://imagenes.cristmedicals.com/imagenes-v3/imagenes/'

function getImgSrc(imagen) {
  if (!imagen) return null
  const iv = String(imagen).replace(/[A-Za-z]$/, '')
  return `${IMG_BASE}${iv}.jpg`
}

export default function ModalProductos({ productos, infoProffit, onClose }) {
  // Agrupa productos por factura asociada
  const fMap = {}
  if (infoProffit?.renglones_factura) {
    infoProffit.renglones_factura.forEach(r => {
      // Intentamos mapear por co_art (que puede ser codigo o descripcion segun el JSON)
      const key = String(r.co_art || r.art_des || '').trim().toLowerCase()
      if (key) fMap[key] = r
    })
  }

  const grupos = {}
  ;(productos || []).forEach(p => {
    const codeKey = String(p.co_art || '').trim().toLowerCase()
    const descKey = String(p.art_des || p.descripcion || '').trim().toLowerCase()
    
    // Prioridad: Mapeo por codigo > Mapeo por descripcion
    const infoProfitRow = fMap[codeKey] || fMap[descKey]
    const groupKey = infoProfitRow?.fact_num || infoProfitRow?.num_doc || p.fact_num || 'N/A'
    
    if (!grupos[groupKey]) grupos[groupKey] = []
    grupos[groupKey].push({ ...p, profitRow: infoProfitRow })
  })

  const totalItems = (productos || []).length
  const totalUnidades = (productos || []).reduce((s, p) => s + (parseFloat(p.cantidad) || 0), 0)

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-h-[90vh] max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex justify-between items-center shrink-0">
          <h5 className="font-black text-slate-800 flex items-center gap-3 text-base">
            <div className="bg-emerald-500 text-white p-2 rounded-lg"><Package size={16} /></div>
            Productos del Pedido
            <span className="text-sm font-normal text-gray-400 ml-1">({totalItems} items · {totalUnidades.toLocaleString('es-ES')} unidades)</span>
          </h5>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-grow">
          <table className="w-full text-sm text-left text-gray-700 min-w-[700px]">
            <thead className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest bg-white border-b border-dashed border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center w-14">Img</th>
                <th className="px-4 py-3 min-w-[200px]">Descripción</th>
                <th className="px-4 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Precio Neto</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                <th className="px-4 py-3 text-center">Almacén</th>
                <th className="px-4 py-3 text-center">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.keys(grupos).length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin productos en este pedido.</td></tr>
              )}
              {Object.entries(grupos).map(([factura, prods]) => (
                <Fragment key={factura}>

                  <tr key={`hdr-${factura}`}>
                    <td colSpan={7} className="bg-gray-50 text-center py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest border-y border-gray-200">
                      Factura Asociada: <span className="text-slate-700">{factura}</span>
                    </td>
                  </tr>
                  {prods.map((p, i) => {
                    const imgSrc = getImgSrc(p.imagen || p.co_art)

                    const precio = parseFloat(p.precio_unit ?? p.precio ?? p.profitRow?.precio_neto ?? 0)
                    const total = parseFloat(p.tot_art ?? p.subtotal ?? p.profitRow?.tot_neto ?? 0)
                    const desc = p.art_des || p.descripcion || (p.profitRow?.art_des || p.profitRow?.co_art) || p.co_art || '-'

                    return (
                      <tr key={`${factura}-${i}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-center">
                          {imgSrc
                            ? <img src={imgSrc} loading="lazy" alt="" className="w-10 h-10 object-cover rounded-lg mx-auto border border-gray-200 shadow-sm bg-white" onError={e => { e.target.style.display = 'none' }} />
                            : <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto" />
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-800 text-xs leading-tight mb-1">{desc}</div>
                          <div className="flex gap-2">
                            <span className="text-[0.6rem] text-slate-400 font-mono">Cód: {p.co_art || '-'}</span>
                            {p.profitRow?.co_art && p.profitRow.co_art !== desc && (
                                <span className="text-[0.6rem] text-emerald-600 font-bold uppercase tracking-wider">Mapeado en Profit</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-800 text-white px-2.5 py-1 rounded text-xs font-black">{parseFloat(p.cantidad || p.profitRow?.can_art || 0).toFixed(0)}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap font-mono">{precio ? `${precio.toFixed(2)} $` : '-'}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-800 whitespace-nowrap font-mono">{total ? `${total.toFixed(2)} $` : '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[0.65rem] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.profitRow?.co_alma || p.co_alma || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[0.65rem] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {p.profitRow?.fact_num || p.fact_num || '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>

              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-600 font-bold text-sm uppercase tracking-wide rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}

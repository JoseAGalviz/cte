import { useState, useMemo } from 'react'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'

function buildProductosPorUsuario(facturas) {
  // { usuario -> { art_des -> total_art } }
  const map = {}
  ;(facturas || []).forEach(f => {
    const usr = f.co_us_in || ''
    if (!usr) return
    if (!map[usr]) map[usr] = {}
    ;(f.articulos || []).forEach(a => {
      const desc = a.art_des || a.co_art || 'Sin descripción'
      const qty = Number(a.total_art || a.cantidad || 0)
      map[usr][desc] = (map[usr][desc] || 0) + qty
    })
  })
  // Sort products desc by qty
  const result = {}
  Object.entries(map).forEach(([usr, prods]) => {
    result[usr] = Object.entries(prods)
      .map(([art_des, qty]) => ({ art_des, qty }))
      .sort((a, b) => b.qty - a.qty)
  })
  return result
}

export default function EstadisticasUsuarios({ data, facturas = [] }) {
  const hasData = Array.isArray(data) && data.length > 0
  const [expanded, setExpanded] = useState(null)

  const productosPorUsuario = useMemo(() => buildProductosPorUsuario(facturas), [facturas])

  const toggle = (usuario) => setExpanded(prev => prev === usuario ? null : usuario)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-[410px]">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
          <Users size={18} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight text-muted">
          Ventas por Usuario
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasData ? (
          <div className="bg-slate-50 text-slate-500 p-4 rounded-lg text-center text-sm">
            Sin datos de ventas por usuario.
          </div>
        ) : (
          <table className="w-full text-sm text-left align-middle border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 text-slate-500 font-semibold uppercase text-xs">Usuario</th>
                <th className="py-2 text-slate-500 font-semibold uppercase text-xs text-right">Unidades</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const usuario = item.usuario || item.user || item.nombre || 'Desconocido'
                const unidades = Number(item.total_unidades || item.total || 0)
                const productos = productosPorUsuario[usuario] || []
                const isOpen = expanded === usuario

                return (
                  <>
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors"
                      onClick={() => toggle(usuario)}
                    >
                      <td className="py-2.5 font-medium text-slate-700 flex items-center gap-1.5">
                        {isOpen
                          ? <ChevronUp size={13} className="text-blue-500 shrink-0" />
                          : <ChevronDown size={13} className="text-slate-400 shrink-0" />
                        }
                        <span
                          style={unidades === 0 ? { textDecoration: 'underline', textDecorationColor: '#f87171', textUnderlineOffset: '3px' } : {}}
                        >
                          {usuario}
                        </span>
                      </td>
                      <td className={`py-2.5 text-right font-bold ${unidades === 0 ? 'text-red-400' : 'text-slate-800'}`}>{unidades}</td>
                    </tr>

                    {isOpen && (
                      <tr key={`exp-${idx}`}>
                        <td colSpan={2} className="p-0">
                          <div className="bg-blue-50/60 border-b border-blue-100 px-4 py-3">
                            {productos.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Sin detalle de productos disponible.</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                {productos.map((p, i) => (
                                  <li key={i} className="flex items-start justify-between gap-2 text-xs">
                                    <span className="text-slate-600 leading-tight">{p.art_des}</span>
                                    <span className="font-black text-blue-700 shrink-0 bg-blue-100 px-1.5 py-0.5 rounded text-[0.65rem]">
                                      {p.qty}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

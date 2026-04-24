import { useState, useEffect } from 'react'
import { X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { getInconsistencias } from '../../services/adminService'

const PAGE_SIZE = 10

export default function ModalInconsistencias({ onClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await getInconsistencias()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const totalPags = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const slice = items.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50">
          <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Inconsistencias en Pedidos
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-500">
            <X size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <p className="text-center text-slate-400 py-12">Cargando datos...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  {['Pedido Web', 'Fact. Profit', 'Fecha', 'Usuario', 'Cliente', 'Vendedor', 'Prov.', 'Art. Web', 'Art. Profit', 'Dif.', 'Resumen'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slice.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-10 text-slate-400">
                      No hay inconsistencias reportadas
                    </td>
                  </tr>
                ) : slice.map((item, i) => {
                  const fecha = item.fecha_mysql
                    ? (() => { const d = new Date(item.fecha_mysql); return isNaN(d) ? item.fecha_mysql : d.toLocaleString('es-VE') })()
                    : ''
                  const dif = Number(item.diferencia || 0)
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{item.pedido_numero_mysql || ''}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{item.factura_profit_num || ''}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fecha}</td>
                      <td className="px-4 py-2.5 text-slate-600">{item.usuario || ''}</td>
                      <td className="px-4 py-2.5 text-slate-600">{item.cliente || ''}</td>
                      <td className="px-4 py-2.5 text-slate-500">{item.co_ven || ''}</td>
                      <td className="px-4 py-2.5 text-slate-500">{item.proveedor || ''}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{item.cant_articulos_mysql}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{item.cant_articulos_profit}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {dif}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 max-w-[200px] truncate">
                        {item.inconsistencia_detalle?.resumen || ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pager */}
        {totalPags > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{items.length} inconsistencias — pág. {pagina}/{totalPags}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
                disabled={pagina === totalPags}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

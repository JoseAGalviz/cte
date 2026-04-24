import { useState, useEffect } from 'react'
import { X, Edit2, Check } from 'lucide-react'
import { getTiemposPago, editarTiempoPago } from '../../services/adminService'

export default function ModalTiemposPago({ onClose }) {
  const [tiempos, setTiempos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      setTiempos(await getTiemposPago())
    } catch {
      setMsg({ tipo: 'error', texto: 'Error cargando tiempos de pago' })
    } finally {
      setLoading(false)
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setMsg(null)
    try {
      await editarTiempoPago({
        id: String(editando.id),
        tiempo: editando.tiempo,
        porcentaje: Number(editando.porcentaje),
        columna: editando.columna,
      })
      setMsg({ tipo: 'ok', texto: 'Tiempo de pago actualizado' })
      setEditando(null)
      await cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message || 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50">
          <h2 className="text-lg font-bold text-emerald-800">Tiempos de Pago y % Descuento</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-emerald-100 rounded-lg transition text-emerald-600">
            <X size={18} />
          </button>
        </div>

        {msg && (
          <div className={`mx-6 mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
            msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {msg.texto}
          </div>
        )}

        {editando && (
          <form onSubmit={guardar} className="px-6 pt-4 pb-3 bg-emerald-50 border-b border-emerald-100">
            <p className="text-xs font-bold text-emerald-700 uppercase mb-3">Editando #{editando.id}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[0.65rem] font-bold text-slate-500 uppercase mb-1">Tiempo de Pago</label>
                <input
                  type="text"
                  value={editando.tiempo || ''}
                  onChange={e => setEditando(p => ({ ...p, tiempo: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-bold text-slate-500 uppercase mb-1">% Descuento</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editando.porcentaje ?? ''}
                  onChange={e => setEditando(p => ({ ...p, porcentaje: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[0.65rem] font-bold text-slate-500 uppercase mb-1">Columna</label>
                <select
                  value={editando.columna || ''}
                  onChange={e => setEditando(p => ({ ...p, columna: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                >
                  <option value="">Seleccionar</option>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={`Columna ${n}`}>Columna {n}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="text-sm text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                <Check size={14} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <p className="text-center text-slate-400 py-12">Cargando...</p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left px-4 py-3">Tiempo de Pago</th>
                    <th className="text-left px-4 py-3">% Descuento</th>
                    <th className="text-left px-4 py-3">Columna</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tiempos.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">Sin datos</td></tr>
                  ) : tiempos.map(tp => (
                    <tr key={tp.id} className={`hover:bg-slate-50 transition ${editando?.id === tp.id ? 'bg-emerald-50' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{tp.tiempo}</td>
                      <td className="px-4 py-2.5 text-slate-600">{tp.porcentaje}%</td>
                      <td className="px-4 py-2.5 text-slate-500">{tp.columna}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => { setEditando({ ...tp }); setMsg(null) }}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {tiempos.length > 0 && (
                <div className="px-6 py-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                    Vista previa — Visitador
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {tiempos.map(tp => (
                      <div
                        key={tp.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 min-w-[160px] text-center shadow-sm"
                      >
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {tp.columna}
                        </span>
                        <p className="font-semibold text-slate-700 mt-2 text-sm leading-tight">{tp.tiempo}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-2">{tp.porcentaje}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

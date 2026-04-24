import { useState, useEffect } from 'react'
import { X, Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { getPedidos } from '../../services/adminService'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 10

function extraerDescuento(descrip = '') {
  const m = String(descrip || '').match(/(\d+(\.\d+)?)\s*%/)
  return m ? m[0] : ''
}

export default function ModalPedidos({ onClose }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => { cargar() }, [])

  async function cargar(d1 = null, d2 = null) {
    setLoading(true)
    try {
      const data = await getPedidos(d1, d2)
      setPedidos(Array.isArray(data) ? data : [])
    } catch {
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(e) {
    e.preventDefault()
    if (!desde || !hasta) return
    setPagina(1)
    cargar(desde, hasta)
  }

  const filtrados = pedidos.filter(p => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return [p.fact_num, p.profit_fact_num, p.cod_cliente, p.co_us_in, p.cod_prov]
      .some(v => String(v || '').toLowerCase().includes(q))
  })

  const totalPags = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const slice = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  function exportar() {
    const rows = [
      ['#', 'N° Pedido', 'N° Factura Profit', 'Fecha', 'Cliente', 'Tranferencista', 'Proveedor', 'Monto Total', 'Descuento'],
      ...filtrados.map((p, i) => [
        i + 1,
        p.fact_num || '',
        p.profit_fact_num || '',
        p.fecha ? new Date(p.fecha).toLocaleString('es-VE') : '',
        p.cod_cliente || '',
        p.co_us_in || '',
        p.cod_prov || '',
        p.tot_neto || '',
        extraerDescuento(p.descrip),
      ]),
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Pedidos')
    XLSX.writeFile(wb, `pedidos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Lista de Pedidos Realizados</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportar}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-end gap-3">
          <form onSubmit={handleFiltrar} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={e => setDesde(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={e => setHasta(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
            >
              Filtrar
            </button>
          </form>
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none w-44"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <p className="text-center text-slate-400 py-12">Cargando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  {['#', 'N° Pedido', 'N° Factura', 'Fecha', 'Cliente', 'Tranferencista', 'Proveedor', 'Monto', 'Descuento'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slice.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400">Sin datos</td></tr>
                ) : slice.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{(pagina - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{p.fact_num || ''}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.profit_fact_num || ''}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {p.fecha ? new Date(p.fecha).toLocaleString('es-VE') : ''}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{p.cod_cliente || ''}</td>
                    <td className="px-4 py-2.5 text-slate-600">{p.co_us_in || ''}</td>
                    <td className="px-4 py-2.5 text-slate-600">{p.cod_prov || ''}</td>
                    <td className="px-4 py-2.5 text-right text-slate-700 font-medium">{p.tot_neto || ''}</td>
                    <td className="px-4 py-2.5 text-slate-500">{extraerDescuento(p.descrip)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pager */}
        {totalPags > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{filtrados.length} pedidos — pág. {pagina}/{totalPags}</span>
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

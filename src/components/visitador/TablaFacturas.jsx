import { useState, useMemo } from 'react'
import { Search, X, FileText, AlertTriangle, ChevronDown } from 'lucide-react'
import { getPedidoCliente, getPedidoDescuento, getPedidoFecha } from '../../services/pedidosService'

const PAGE_SIZE = 10

export default function TablaFacturas({ pedidos, onVerProductos, onVerProforma, onVerComparativa }) {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    return pedidos.filter(p => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const nPedido  = (p.fact_num || '').toLowerCase()
        const nCliente = getPedidoCliente(p).toLowerCase()
        const cCliente = (p.cod_cliente || '').toLowerCase()
        const nFact    = (p.info_profit?.factura?.fact_num || '').toLowerCase()
        const nVisit   = (p.co_us_in || '').toLowerCase()
        
        if (!nPedido.includes(q) && 
            !nCliente.includes(q) && 
            !cCliente.includes(q) && 
            !nFact.includes(q) &&
            !nVisit.includes(q)) return false
      }
      return true
    })
  }, [pedidos, search])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows        = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const tieneDiscrepancia = p => {
    const nPed = Array.isArray(p.productos) ? p.productos.length : 0
    const nFac = Array.isArray(p.info_profit?.renglones_factura) ? p.info_profit.renglones_factura.length : 0
    return nPed !== nFac
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden mb-6">

      {/* ── Header ── */}
      <div className="p-4 sm:p-5 border-b border-dashed border-gray-300 bg-gray-50/70 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-1">Historial</p>
          <div className="text-xl font-black text-gray-800 uppercase flex items-center gap-2">
            <FileText size={18} className="text-[#16a34a]" />
            Sus Facturas
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          {/* Buscador */}
          <div className="relative w-full sm:w-[280px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por pedido, cliente, code o visitador..."
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400/50 sm:text-sm shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left text-gray-700 min-w-[900px]">
          <thead className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-4 whitespace-nowrap">N° Pedido / Info</th>
              <th className="px-5 py-4 whitespace-nowrap">N° Factura</th>
              <th className="px-5 py-4 min-w-[180px]">Cliente</th>
              <th className="px-5 py-4 min-w-[130px]">Visitador</th>
              <th className="px-5 py-4 text-right whitespace-nowrap">Total Neto</th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Dcto. Gral</th>
              <th className="px-5 py-4 whitespace-nowrap">
                <span className="flex items-center gap-1">
                  Fecha <ChevronDown size={12} className="text-gray-300" />
                </span>
              </th>
              <th className="px-5 py-4 text-center whitespace-nowrap">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm italic">
                  No se encontraron resultados para los filtros aplicados
                </td>
              </tr>
            )}
            {rows.map((p, i) => {
              const clienteNombre = getPedidoCliente(p)
              const descuento     = getPedidoDescuento(p)
              const fecha         = p.fecha
                ? new Date(String(p.fecha).replace(' ', 'T')).toLocaleDateString('es-VE')
                : ''
              const discrepancia = tieneDiscrepancia(p)

              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">

                  {/* N° Pedido — enlace verde */}
                  <td className="px-5 py-3 whitespace-nowrap text-xs">
                    <div className="flex flex-col">
                      <button
                        onClick={() => onVerProductos(p.productos, p.info_profit)}
                        className="text-[#16a34a] font-black hover:underline cursor-pointer text-left uppercase text-sm"
                      >
                        {p.fact_num || 'Ver Pedido'}
                      </button>
                      {p.codigo_pedido && (
                        <span className="text-[0.6rem] text-slate-400 font-mono tracking-tighter" title={`Cód. de transacción: ${p.codigo_pedido}`}>
                          Ref: {String(p.codigo_pedido).slice(-10)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* N° Factura + Estado */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {p.info_profit?.factura?.fact_num ? (
                        <>
                          <span className="font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs w-fit">
                            {p.info_profit.factura.fact_num}
                          </span>
                          <span className="flex items-center gap-1 text-[0.6rem] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Facturado
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-[0.6rem] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded-full w-fit border border-amber-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          Pendiente
                        </span>
                      )}
                    </div>
                  </td>


                  {/* Cliente + alerta discrepancia */}
                  <td className="px-5 py-3 min-w-[180px]">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[150px] uppercase">{clienteNombre}</span>
                        {discrepancia && (
                          <button
                            onClick={() => onVerComparativa(p)}
                            className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <AlertTriangle size={14} />
                          </button>
                        )}
                      </div>
                      <span className="text-[0.65rem] text-gray-400 font-semibold">{p.cod_cliente || '-'}</span>
                    </div>
                  </td>

                  {/* Visitador */}
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-slate-600 truncate block max-w-[120px]">{p.co_us_in || '-'}</span>
                  </td>

                  {/* Total */}
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-slate-800 text-xs">{p.tot_neto ? `${parseFloat(p.tot_neto).toFixed(2)} $` : '-'}</span>
                      {p.saldo && parseFloat(p.saldo) > 0 && Math.abs(parseFloat(p.saldo) - parseFloat(p.tot_neto)) > 0.01 && (
                        <span className="text-[0.6rem] text-red-500 font-bold uppercase tracking-tighter">Saldo: {parseFloat(p.saldo).toFixed(2)} $</span>
                      )}
                    </div>
                  </td>

                  {/* Porcentaje descuento */}
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-500 italic">
                      {descuento}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap font-medium">
                    {fecha}
                  </td>

                  {/* Botón proforma */}
                  <td className="px-5 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onVerProforma(p)}
                      className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-800 hover:text-white px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <FileText size={11} /> Proforma
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
        <span>
          {filtered.length === 0
            ? 'Sin resultados'
            : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} de ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
          >
            Anterior
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pg = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
            return (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                  pg === currentPage
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                {pg}
              </button>
            )
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>

    </section>
  )
}

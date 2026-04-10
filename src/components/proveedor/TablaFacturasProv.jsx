import { formatFecha, formatCurrency, getPrecio } from '../../services/pedidosService'
import { FileText, FileDown, ScrollText, Table, Eye } from 'lucide-react'

export default function TablaFacturasProv({ 
  facturas, 
  onVerDetalles, 
  onDescargarPDF, 
  onDescargarExcel 
}) {
  const hasData = Array.isArray(facturas) && facturas.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight flex items-center gap-2">
          <ScrollText size={18} className="text-violet-600" />
          Transferencias
        </h3>
        
        {hasData && (
          <div className="flex items-center gap-2">
            <button 
              title="Descargar PDF General"
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
            >
              <FileDown size={16} />
            </button>
            <button 
              title="Descargar Excel General"
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
            >
              <Table size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[0.65rem] tracking-wider border-b border-slate-200">
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-5 py-3 font-semibold">RIF</th>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-3 py-3 font-semibold text-center">Desc. %</th>
              <th className="px-4 py-3 font-semibold">Factura</th>
              <th className="px-4 py-3 font-semibold text-center">Tasa</th>
              <th className="px-4 py-3 font-semibold text-right">Total Bs</th>
              <th className="px-4 py-3 font-semibold text-right">Total $</th>
              <th className="px-3 py-3 font-semibold text-center">Prod.</th>
              <th className="px-4 py-3 font-semibold text-right">Desc. ($)</th>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-5 py-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!hasData ? (
              <tr>
                <td colSpan="12" className="px-5 py-8 text-center text-slate-500">
                  No se encontraron transferencias.
                </td>
              </tr>
            ) : (
              facturas.map((fact, idx) => {
                const cliente = fact.cli_des || fact.co_cli || fact.cod_cliente || ''
                const articulosList = Array.isArray(fact.articulos) ? fact.articulos : (Array.isArray(fact.productos) ? fact.productos : [])
                const totalProductos = articulosList.reduce((s, p) => s + (Number(p.total_art ?? p.cantidad ?? p.cant_producto ?? p.cant ?? 0) || 0), 0)
                
                // Calculos de descuento
                const pctRaw = String(fact.campo6 || '').replace(/%/g, '').trim()
                const pct = Number(pctRaw.replace(',', '.')) || 0
                const totUsd = Number(String(fact.tot_neto || '0').replace(/[^0-9\.-]/g, '')) || 0
                const descUsd = (pct / 100) * totUsd
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-medium text-slate-700 max-w-[200px] truncate" title={cliente}>
                      {cliente}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{fact.rif || '-'}</td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{formatFecha(fact.fec_emis) || formatFecha(fact.fecha) || '-'}</td>
                    <td className="px-3 py-3 text-center text-slate-600">
                      {fact.campo6 ? <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[0.6rem] font-bold">{fact.campo6}</span> : '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{fact.fact_num || fact.nro || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs">{fact.tasa || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{fact.tot_bruto || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{fact.tot_neto || '-'}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700 bg-slate-50">{totalProductos}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">
                      {descUsd > 0 ? `${descUsd.toFixed(2)} $` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fact.co_us_in || '-'}</td>
                    
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onVerDetalles(fact)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-200"
                          title="Ver Detalles"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => onDescargarPDF(fact)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors border border-rose-200"
                          title="Descargar PDF Factura"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

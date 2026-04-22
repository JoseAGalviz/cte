import { useState, useMemo } from 'react'
import { Search, FileSpreadsheet, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 15

function isAlfanumerico(val) {
  const s = String(val ?? '').replace(/\s+/g, '')
  return s !== '' && /\d/.test(s) && /[A-Za-z]/.test(s)
}

export default function TablaTransferencias({ filas = [], onVerDetalle }) {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return filas
    const q = busqueda.toLowerCase()
    return filas.filter(f =>
      Object.values(f).some(v => String(v ?? '').toLowerCase().includes(q))
    )
  }, [filas, busqueda])

  const totalPags = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const slice = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const keys = filas.length ? Object.keys(filas[0]) : []

  const headerMap = {
    fact_num: 'N° Factura', fac_num: 'N° Factura',
    campo5: 'Cód. Proveedor', campo6: 'Desc. %',
    fec_emis: 'Fecha', tot_neto: 'Total $',
    tasa: 'Tasa', cli_des: 'Cliente',
  }

  function exportarExcel() {
    const rows = [
      [...keys.map(k => headerMap[k] || k), 'Monto Desc. ($)'],
      ...filtradas.map(f => [
        ...keys.map(k => f[k] ?? ''),
        (() => {
          const pct = Number(String(f.campo6 || '').replace(/%/g, '').trim().replace(',', '.')) || 0
          const tot = Number(String(f.tot_neto || '0').replace(/[^0-9.-]/g, '')) || 0
          return ((pct / 100) * tot).toFixed(2)
        })(),
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transferencias')
    XLSX.writeFile(wb, `transferencias_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Transferencias</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 w-44"
            />
          </div>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {keys.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10">Sin datos</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                {keys.map(k => (
                  <th key={k} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">
                    {headerMap[k] || k}
                  </th>
                ))}
                <th className="text-right px-4 py-2.5 font-medium">Monto Desc. ($)</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {slice.map((f, i) => {
                const verde = isAlfanumerico(f.campo5)
                const pct = Number(String(f.campo6 || '').replace(/%/g, '').trim().replace(',', '.')) || 0
                const tot = Number(String(f.tot_neto || '0').replace(/[^0-9.-]/g, '')) || 0
                const descUsd = ((pct / 100) * tot).toFixed(2)
                return (
                  <tr
                    key={i}
                    className={`hover:bg-slate-50 transition ${verde ? 'bg-emerald-50' : ''}`}
                  >
                    {keys.map(k => (
                      <td key={k} className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                        {f[k] ?? ''}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right text-slate-600 whitespace-nowrap">
                      {descUsd} $
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onVerDetalle?.(f)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Ver detalle"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPags > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {filtradas.length} registros — pág. {pagina}/{totalPags}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPagina(p => Math.min(totalPags, p + 1))}
              disabled={pagina === totalPags}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

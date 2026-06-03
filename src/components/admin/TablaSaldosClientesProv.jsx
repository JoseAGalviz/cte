import { useState } from 'react'
import { Loader2, Search, Wallet } from 'lucide-react'
import { getSaldosClientesProveedor } from '../../services/adminService'

const _now = new Date()
const _pad = n => String(n).padStart(2, '0')
const _firstDay = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-01`
const _lastDay = (() => {
  const d = new Date(_now.getFullYear(), _now.getMonth() + 1, 0)
  return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`
})()

export default function TablaSaldosClientesProv({ provMap = {} }) {
  const [coProv, setCoProv] = useState('')
  const [startDate, setStartDate] = useState(_firstDay)
  const [endDate, setEndDate] = useState(_lastDay)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const provList = Object.entries(provMap).map(([co, des]) => ({ co, des }))

  async function handleBuscar() {
    if (!coProv || !startDate || !endDate) return
    setLoading(true)
    setError(null)
    try {
      const res = await getSaldosClientesProveedor(coProv, startDate, endDate)
      setData(res)
    } catch (e) {
      setError(e.message || 'Error al cargar saldos')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Derive columns dynamically: cli_des first, fact_num second
  const cols = (() => {
    if (!data || data.length === 0) return []
    let keys = Object.keys(data[0])
    keys = keys.filter(k => k !== 'cli_des' && k !== 'fact_num')
    if (data[0].hasOwnProperty('fact_num')) keys.unshift('fact_num')
    if (data[0].hasOwnProperty('cli_des'))  keys.unshift('cli_des')
    return keys
  })()

  const COL_LABELS = {
    cli_des:    'Cliente',
    fact_num:   'N° Factura',
    co_cli:     'Cód. Cliente',
    rif:        'RIF',
    fec_emis:   'Fecha Emisión',
    fec_venc:   'Vencimiento',
    fecha:      'Fecha',
    monto:      'Monto',
    saldo:      'Saldo',
    debe:       'Debe',
    haber:      'Haber',
    neto:       'Neto',
    bruto:      'Bruto',
    tot_neto:   'Total $',
    tot_bruto:  'Total Bs',
    total:      'Total',
    subtotal:   'Subtotal',
    tasa:       'Tasa',
    co_prov:    'Cód. Proveedor',
    prov_des:   'Proveedor',
    co_us_in:   'Usuario',
    dias:       'Días',
    plazo:      'Plazo',
    status:     'Estatus',
    estatus:    'Estatus',
    comentario: 'Comentario',
    observacion:'Observación',
    pedido_num: 'N° Pedido',
    co_art:     'Cód. Artículo',
    art_des:    'Artículo',
    cantidad:   'Cantidad',
    precio:     'Precio',
    prec_vta:   'Precio Venta',
  }

  const colLabel = c => COL_LABELS[c] ?? c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const cleanText = v =>
    String(v).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim() || '-'

  const fmtVal = (v, col) => {
    if (v == null || v === '') return '-'
    if (col === 'comentario') return cleanText(v)
    const n = Number(v)
    if (!isNaN(n) && v !== '' && v !== true && v !== false) {
      return n.toLocaleString('es-VE', { maximumFractionDigits: 2 })
    }
    return String(v)
  }

  // Heuristic column styles by name pattern
  const isWide    = c => /des|nombre|descripcion|comentario|direcc|razon|client/i.test(c)
  const isMoney   = c => /monto|total|saldo|debe|haber|neto|bruto|importe|precio|balance/i.test(c)
  const isFactNum = c => c === 'fact_num'
  const isCode    = c => /^co_|cod|^id$|^rif$|num|nro|fact|prov/i.test(c)
  const isDate    = c => /fec|fecha|date/i.test(c)

  function colStyle(c) {
    if (isFactNum(c)) return { minWidth: '130px' }
    if (isWide(c))    return { minWidth: c === 'comentario' ? '260px' : '180px' }
    if (isMoney(c))   return { minWidth: '110px' }
    if (isCode(c))    return { minWidth: '90px' }
    if (isDate(c))    return { minWidth: '100px' }
    return { minWidth: '100px' }
  }

  function thAlign(c) {
    if (isMoney(c)) return 'text-right'
    if (isCode(c) || isDate(c) || isFactNum(c)) return 'text-center'
    return 'text-left'
  }

  function tdClass(c) {
    if (isFactNum(c)) return 'px-4 py-3 whitespace-nowrap text-center font-black text-slate-800'
    const wrap  = isWide(c) ? '' : 'whitespace-nowrap'
    const align = isMoney(c) ? 'text-right font-mono' : isCode(c) || isDate(c) ? 'text-center' : ''
    const color = isMoney(c) ? 'text-emerald-700 font-semibold' : 'text-slate-700'
    return `px-4 py-3 ${wrap} ${align} ${color}`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight flex items-center gap-2">
          <Wallet size={18} className="text-violet-600" />
          Saldos por Cliente — Proveedor
        </h3>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-wrap items-end gap-3">
          {/* Select proveedor */}
          <div>
            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Proveedor</label>
            <select
              value={coProv}
              onChange={e => setCoProv(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 min-w-[220px] max-w-[320px]"
            >
              <option value="">— Seleccionar proveedor —</option>
              {provList.map(({ co, des }) => (
                <option key={co} value={co}>{co} — {des}</option>
              ))}
            </select>
          </div>

          {/* Desde */}
          <div>
            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>

          <button
            onClick={handleBuscar}
            disabled={!coProv || !startDate || !endDate || loading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-5 rounded-lg text-sm transition disabled:opacity-50 self-end"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[480px]">
        {data === null && !loading && (
          <div className="py-14 text-center text-slate-400 text-sm">
            Selecciona un proveedor y un rango de fechas para ver los saldos.
          </div>
        )}

        {loading && (
          <div className="py-14 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin text-violet-500" />
            <span className="text-sm">Cargando saldos...</span>
          </div>
        )}

        {error && !loading && (
          <div className="py-10 text-center text-red-500 text-sm font-medium">{error}</div>
        )}

        {!loading && !error && data !== null && data.length === 0 && (
          <div className="py-14 text-center text-slate-400 text-sm">Sin resultados para los filtros seleccionados.</div>
        )}

        {!loading && !error && data && data.length > 0 && (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-slate-500 uppercase text-[0.65rem] tracking-wider border-b border-slate-200">
                {cols.map(col => (
                  <th key={col} style={colStyle(col)} className={`px-4 py-3 font-semibold whitespace-nowrap ${thAlign(col)}`}>{colLabel(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  {cols.map(col => (
                    <td key={col} className={tdClass(col)}>{fmtVal(row[col], col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

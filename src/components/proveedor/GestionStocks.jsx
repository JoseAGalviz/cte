import { useState, useMemo } from 'react'
import { Package, Search, Download } from 'lucide-react'

export default function GestionStocks({ stockAlmacenes, productosVendidos }) {
  const [activeTab, setActiveTab] = useState('proveedor')
  const [searchTerm, setSearchTerm] = useState('')

  // Normalizar y ordenar almacenes detectados en la tabla de stock
  const { orderedCodes, mapAlmaLabel, parsedStock } = useMemo(() => {
    if (!Array.isArray(stockAlmacenes)) return { orderedCodes: [], mapAlmaLabel: () => '', parsedStock: [] }
    
    // extraemos logica de almacenes
    function mapLabel(code) {
      if (!code && code !== 0) return ''
      const c = String(code).padStart(2, '0')
      switch (c) {
        case '01': return 'San Cristobal'
        case '02': return 'Bulto SC'
        case '04': return 'BQMTO'
        case '05': return 'Bulto BQMTO'
        default: return code || ''
      }
    }

    const preferredOrder = ['01', '02', '04', '05']
    const foundCodes = new Set()
    stockAlmacenes.forEach(prod => {
      if (Array.isArray(prod.almacenes)) {
        prod.almacenes.forEach(a => {
          if (a && a.co_alma !== undefined && a.co_alma !== null) {
            foundCodes.add(String(a.co_alma).padStart(2, '0'))
          }
        })
      }
    })

    const codes = []
    preferredOrder.forEach(c => { if (foundCodes.has(c)) { codes.push(c); foundCodes.delete(c) } })
    Array.from(foundCodes).sort().forEach(c => codes.push(c))

    // filter by search term
    const filtered = stockAlmacenes.filter(prod => {
      if (!searchTerm) return true
      const desc = (prod.des_art || prod.descrip || prod.descripcion || '').toLowerCase()
      return desc.includes(searchTerm.toLowerCase())
    })

    return { orderedCodes: codes, mapAlmaLabel: mapLabel, parsedStock: filtered }
  }, [stockAlmacenes, searchTerm])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-orange-100 text-orange-700 p-2 rounded-lg">
          <Package size={18} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight">
          Gestión de Stocks
        </h3>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
        <button
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeTab === 'proveedor' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('proveedor')}
        >
          Proveedor
        </button>
        <button
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
            activeTab === 'almacenes' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('almacenes')}
        >
          Almacenes
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-[300px]">
        {activeTab === 'proveedor' ? (
          <div className="table-responsive">
            {!productosVendidos || productosVendidos.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Sin datos de productos más vendidos</p>
            ) : (
             <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-slate-500 font-semibold uppercase text-xs">Producto</th>
                  <th className="py-2 text-slate-500 font-semibold uppercase text-xs text-right">Cant.</th>
                  <th className="py-2 text-slate-500 font-semibold uppercase text-xs text-center w-16">Img</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosVendidos.map((prod, i) => {
                  const codigo = (prod.co_art || '').toString()
                  const desc = prod.art_des || ''
                  const total = Math.round(Number(prod.total_vendido || 0))
                  const safeCode = codigo.replace(/[A-Za-z]$/, '')
                  // Mostrar el código atenuado
                  const hasDesc = desc && desc.trim().length > 0 && desc.trim() !== codigo.trim()

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2">
                        {hasDesc ? (
                          <>
                            <div className="font-medium text-slate-700">{desc}</div>
                            <div className="text-[0.65rem] text-slate-400 font-mono mt-0.5">{codigo}</div>
                          </>
                        ) : (
                          <div className="font-medium text-slate-700">{codigo || desc || '-'}</div>
                        )}
                      </td>
                      <td className="py-2 text-right font-bold text-slate-800">{total}</td>
                      <td className="py-2 text-center">
                        <img 
                          src={`https://imagenes.cristmedicals.com/imagenes/${safeCode}.jpg`} 
                          alt="Img" 
                          className="w-10 h-10 object-contain mx-auto rounded border border-slate-200 bg-white"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* TODO: Add Excel Export specific to this table if needed */}
              <button title="Exportar Almacenes (WIP)" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 shrink-0">
                <Download size={16} />
              </button>
            </div>
            
            <div className="table-responsive flex-1">
              {!parsedStock || parsedStock.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {searchTerm ? 'No se encontraron coincidencias' : 'Sin datos de almacén'}
                </p>
              ) : (
                <table className="w-full text-sm text-left align-middle border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-2 px-2 text-slate-500 font-semibold uppercase text-xs w-[140px]">Producto</th>
                      {orderedCodes.map(c => (
                        <th key={c} className="py-2 px-1 text-slate-500 font-semibold uppercase text-[0.6rem] text-center" title={mapAlmaLabel(c)}>
                          {mapAlmaLabel(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStock.map((prod, i) => {
                      const desc = prod.des_art || prod.descrip || prod.descripcion || '-'
                      const stockMap = {}
                      if (Array.isArray(prod.almacenes)) {
                        prod.almacenes.forEach(a => {
                          if (a) stockMap[String(a.co_alma || a.almacen || '').padStart(2, '0')] = a.stock_act
                        })
                      }
                      
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-2">
                             <div className="text-xs font-medium text-slate-700 line-clamp-2 leading-tight" title={desc}>{desc}</div>
                          </td>
                          {orderedCodes.map(c => {
                            const val = stockMap[c]
                            const s = (val !== undefined && val !== null) ? val : '-'
                            return (
                              <td key={c} className="py-2 px-1 text-center font-bold text-slate-800 text-xs bg-slate-50/50">
                                {s}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

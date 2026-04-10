import { useState, useMemo } from 'react'
import { X, BookOpen, FileText, Table, Search, Loader2 } from 'lucide-react'
import { resolvePrecio, calcularPrecioNeto } from '../../services/catalogoService'
// Carga diferida para no bloquear el bundle principal
const loadPDF = () => Promise.all([import('jspdf'), import('jspdf-autotable')])
const loadXLSX = () => import('xlsx')

const IMG_BASE = 'https://imagenes.cristmedicals.com/imagenes-v3/imagenes/'

function getImgSrc(imagen) {
  if (!imagen) return null
  const iv = String(imagen).replace(/[A-Za-z]$/, '')
  return `${IMG_BASE}${iv}.jpg`
}

export default function ModalCatalogo({ data, precioNum, onClose }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(r =>
      (r.descripcion || '').toLowerCase().includes(q)
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const exportPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await loadPDF()
    const doc = new jsPDF('l', 'pt', 'a4')
    doc.setFontSize(13)
    doc.text(`Catálogo de Productos — Precio ${precioNum}`, 40, 30)
    const cols = ['Descripción', 'Stk BQTO', 'Stk TACH', 'P. Base', 'Dcto Art', 'Dcto Cat', 'Dcto Lín', 'Total Neto']
    const rows = data.map(r => {
      const pBase = parseFloat(resolvePrecio(r)) || 0
      const neto = calcularPrecioNeto(r)
      return [
        r.descripcion || '',
        r.stock_barquisimeto ? Math.round(r.stock_barquisimeto) : '',
        r.stock_tachira ? Math.round(r.stock_tachira) : '',
        pBase ? `${pBase.toFixed(2)} $` : '',
        r.descuento_por_art ? `${r.descuento_por_art}%` : '',
        r.descuento_por_categoria ? `${r.descuento_por_categoria}%` : '',
        r.descuento_por_linea ? `${r.descuento_por_linea}%` : '',
        neto ? `${neto.toFixed(2)} $` : '',
      ]
    })
    autoTable(doc, {
      head: [cols], body: rows, startY: 45,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    })
    doc.save(`Catalogo_Precio_${precioNum}.pdf`)
  }

  const exportExcel = async () => {
    const XLSX = await loadXLSX()

    const columnas = [
      { key: 'imagen',                  label: 'Imagen'       },
      { key: 'descripcion',             label: 'Descripción'  },
      { key: 'stock_barquisimeto',      label: 'Stk BQTO'     },
      { key: 'stock_tachira',           label: 'Stk TACH'     },
      { key: 'Precio',                  label: 'P. Base'      },
      { key: 'descuento_por_art',       label: 'Dcto Art'     },
      { key: 'descuento_por_categoria', label: 'Dcto Cat'     },
      { key: 'descuento_por_linea',     label: 'Dcto Lín'     },
      { key: 'precio_venta',            label: 'Total Neto'   },
    ]

    const excelCols = columnas.filter(c => c.key !== 'imagen')

    const wsData = [
      [...excelCols.map(c => c.label), 'PEDIDO'],
      ...data.map(row => {
        const rowData = excelCols.map(col => {
          if (col.key === 'Precio') return resolvePrecio(row) ? `${parseFloat(resolvePrecio(row)).toFixed(2)} $` : ''
          if (col.key.startsWith('descuento')) return row[col.key] ? `${row[col.key]} %` : ''
          if (col.key === 'precio_venta') {
            let t = parseFloat(resolvePrecio(row)) || 0
            if (t === 0) return ''
            const da = parseFloat(row.descuento_por_art) || 0
            if (da) t *= (1 - da / 100)
            const dc = parseFloat(row.descuento_por_categoria) || 0
            if (dc) t *= (1 - dc / 100)
            const dl = parseFloat(row.descuento_por_linea) || 0
            if (dl) t *= (1 - dl / 100)
            return (t * 0.9).toFixed(2) + ' $'
          }
          return row[col.key] || ''
        })
        rowData.push('')
        return rowData
      })
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')
    XLSX.writeFile(wb, `Catalogo_Precio_${precioNum}.xlsx`)
  }

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-h-[95vh] max-w-7xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center shrink-0">
          <h5 className="font-black text-base flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-2 rounded-lg">
              <BookOpen size={18} />
            </div>
            Catálogo <span className="font-normal text-white/60 ml-1">— Precio {precioNum}</span>
          </h5>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500 text-white/70 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 bg-white shadow-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={exportPDF} className="flex-1 sm:flex-none bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
              <FileText size={14} /> PDF
            </button>
            <button onClick={exportExcel} className="flex-1 sm:flex-none bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
              <Table size={14} /> Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-grow overflow-auto">
          <table className="w-full text-sm text-left text-gray-700 min-w-[900px]">
            <thead className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center w-14">Img</th>
                <th className="px-4 py-3 min-w-[220px]">Descripción</th>
                <th className="px-4 py-3 text-center">Stk BQTO</th>
                <th className="px-4 py-3 text-center">Stk TACH</th>
                <th className="px-4 py-3 text-right">P. Base</th>
                <th className="px-4 py-3 text-center">Dcto Art</th>
                <th className="px-4 py-3 text-center">Dcto Cat</th>
                <th className="px-4 py-3 text-center">Dcto Lín</th>
                <th className="px-4 py-3 text-right bg-emerald-50/50">Total Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No se encontraron productos</td></tr>
              )}
              {rows.map((r, i) => {
                const pBase = parseFloat(resolvePrecio(r)) || 0
                const neto = calcularPrecioNeto(r)
                const da = parseFloat(r.descuento_por_art) || 0
                const dc = parseFloat(r.descuento_por_categoria) || 0
                const dl = parseFloat(r.descuento_por_linea) || 0
                const imgSrc = getImgSrc(r.imagen)
                return (
                  <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-2 text-center">
                      {imgSrc
                        ? <img src={imgSrc} loading="lazy" alt="" className="w-10 h-10 object-cover rounded-lg mx-auto border border-gray-200 shadow-sm bg-white" onError={e => { e.target.style.display = 'none' }} />
                        : <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto" />
                      }
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 text-xs leading-snug">{r.descripcion || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {parseFloat(r.stock_barquisimeto)
                        ? <span className="bg-gray-100 border border-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-black">{Math.round(r.stock_barquisimeto)}</span>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {parseFloat(r.stock_tachira)
                        ? <span className="bg-gray-100 border border-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-black">{Math.round(r.stock_tachira)}</span>
                        : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 font-medium whitespace-nowrap">{pBase ? `${pBase.toFixed(2)} $` : '-'}</td>
                    <td className={`px-4 py-3 text-center text-xs font-bold ${da ? 'text-red-500' : 'text-gray-300'}`}>{da ? `${da}%` : '-'}</td>
                    <td className={`px-4 py-3 text-center text-xs font-bold ${dc ? 'text-red-500' : 'text-gray-300'}`}>{dc ? `${dc}%` : '-'}</td>
                    <td className={`px-4 py-3 text-center text-xs font-bold ${dl ? 'text-red-500' : 'text-gray-300'}`}>{dl ? `${dl}%` : '-'}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 whitespace-nowrap bg-emerald-50/30">{neto ? `${neto.toFixed(2)} $` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 text-sm text-gray-500">
          <span>
            Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium">
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${pg === currentPage ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                  {pg}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium">
              Siguiente
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

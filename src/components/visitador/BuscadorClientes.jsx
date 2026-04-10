import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { getClientes, getClienteNombre, getClienteCodigo, getClienteRif, asArray } from '../../services/clientesService'

export default function BuscadorClientes({ segmentos, onClienteSeleccionado }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [clientesData, setClientesData] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Carga inicial de clientes por segmento
  useEffect(() => {
    const segs = asArray(segmentos)
    if (!segs.length) return
    getClientes(segs).then(data => {
      setClientesData(Array.isArray(data) ? data : (data?.data || []))
    }).catch(() => {})
  }, [segmentos])

  // Búsqueda con debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResultados([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      const raw = query.trim()
      const isCodeLike = /^\d+$/.test(raw.replace(/[^0-9]/g, '')) ||
        /[A-Za-z].*\d/.test(raw) ||
        /^[JVGEP]-?\d+/i.test(raw)

      let found = []

      if (isCodeLike) {
        const upper = raw.toUpperCase()
        const local = clientesData.filter(c => {
          const co = (c.co_cli || c.co_cliente || c.codigo || '').toString().toUpperCase()
          return co === upper || co.includes(upper)
        })
        if (local.length > 0) {
          found = local
        } else {
          try { found = await getClientes(asArray(segmentos), raw) } catch (_) {}
        }
      } else {
        const norm = raw.toLowerCase()
        found = clientesData.filter(c => {
          const n = String(c.cli_des || c.prov_des || c.razon_social || '').toLowerCase()
          const r = String(c.rif || '').toLowerCase()
          return n.includes(norm) || r.includes(norm)
        })
      }

      setResultados((Array.isArray(found) ? found : []).slice(0, 10))
      setOpen(true)
    }, 300)
  }, [query])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const seleccionar = (cliente) => {
    const rif = getClienteRif(cliente)
    const cod = getClienteCodigo(cliente)
    setQuery(rif || cod)
    setOpen(false)
    onClienteSeleccionado(cliente)
  }

  return (
    <div className="relative w-full">
      <label className="block text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-2">
        Seleccione un Cliente
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={15} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => resultados.length && setOpen(true)}
          placeholder="Buscar por RIF, NIT o Nombre..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 text-sm transition-all"
        />
      </div>

      {open && resultados.length > 0 && (
        <ul
          ref={listRef}
          className="absolute w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 divide-y divide-gray-100"
        >
          {resultados.map((c, i) => (
            <li
              key={i}
              onMouseDown={() => seleccionar(c)}
              className="px-4 py-3 hover:bg-emerald-50 cursor-pointer flex flex-col transition-colors"
            >
              <span className="font-bold text-gray-800 text-sm">{getClienteNombre(c)}</span>
              <span className="text-xs text-gray-500 mt-0.5">
                RIF: {getClienteRif(c) || '-'}
                <span className="mx-2">|</span>
                Cód: <strong className="text-emerald-600">{getClienteCodigo(c)}</strong>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

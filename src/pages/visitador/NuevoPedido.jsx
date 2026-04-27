import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, Search, ShoppingCart, X, Check, Loader2,
  FileText, Package, Trash2, ChevronRight, AlertCircle
} from 'lucide-react'
import { getTiemposPago, getClienteByRif, getTipoCliente, enviarPedido, crearPedidoTransf } from '../../services/pedidosService'
import { getCatalogo } from '../../services/catalogoService'
import { asArray } from '../../services/clientesService'

const IMG_BASE = 'https://imagenes.cristmedicals.com/imagenes-v3/imagenes/'

function normalizeCode(code) {
  if (!code && code !== 0) return ''
  return String(code).replace(/[A-Za-z]$/, '')
}

function getImgUrl(producto) {
  const code = normalizeCode(producto.imagen || producto.co_art || '')
  return code ? `${IMG_BASE}${code}.jpg` : null
}

// Precio para mostrar en tarjeta (incluye todos los descuentos + factor 0.9)
function calcPrecioDisplay(producto, descGlobal, descProveedor, sumaAdicionales) {
  let p = parseFloat(producto.precio_venta) || 0
  if (!p) return 0
  const da = parseFloat(producto.descuento_por_art) || 0
  const dc = parseFloat(producto.descuento_por_categoria) || 0
  const dl = parseFloat(producto.descuento_por_linea) || 0
  if (da) p *= (1 - da / 100)
  if (dc) p *= (1 - dc / 100)
  if (dl) p *= (1 - dl / 100)
  if (descGlobal) p *= (1 - descGlobal / 100)
  if (descProveedor) p *= (1 - descProveedor / 100)
  if (sumaAdicionales) p *= (1 - sumaAdicionales / 100)
  return p * 0.9
}

// Precio para el carrito (sin tiempos de pago, sin factor 0.9)
function calcPrecioCarrito(producto, descGlobal, descProveedor) {
  let p = parseFloat(producto.precio_venta) || 0
  if (!p) return 0
  const da = parseFloat(producto.descuento_por_art) || 0
  const dc = parseFloat(producto.descuento_por_categoria) || 0
  const dl = parseFloat(producto.descuento_por_linea) || 0
  if (da) p *= (1 - da / 100)
  if (dc) p *= (1 - dc / 100)
  if (dl) p *= (1 - dl / 100)
  if (descGlobal) p *= (1 - descGlobal / 100)
  if (descProveedor) p *= (1 - descProveedor / 100)
  return p
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ producto, onClose }) {
  const imgUrl = getImgUrl(producto)
  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      {imgUrl
        ? <img src={imgUrl} alt={producto.descripcion} className="max-w-full max-h-[75vh] object-contain rounded-lg mb-5 pointer-events-none" />
        : <Package size={80} className="text-gray-600 mb-5" />
      }
      <h2 className="text-white text-xl font-black text-center max-w-2xl">{producto.descripcion || producto.art_des}</h2>
      <span className="mt-5 text-white/30 text-xs uppercase tracking-widest font-bold">Toca para cerrar</span>
    </div>
  )
}

// ── Tarjeta de producto ───────────────────────────────────────────────────────
function ProductCard({ producto, idx, cantBQ, cantSC, onCantidad, onLightbox, descGlobal, descProveedor, sumaAdicionales }) {
  const stockBQ = parseInt(producto.stock_barquisimeto) || 0
  const stockSC = parseInt(producto.stock_tachira) || 0
  const hasBQ = stockBQ > 0
  const hasSC = stockSC > 0
  const sinStock = !hasBQ && !hasSC

  const da = parseFloat(producto.descuento_por_art) || 0
  const dc = parseFloat(producto.descuento_por_categoria) || 0
  const dl = parseFloat(producto.descuento_por_linea) || 0
  const precioBase = parseFloat(producto.Precio) || 0
  const precioDisplay = calcPrecioDisplay(producto, descGlobal, descProveedor, sumaAdicionales)
  const cantidad = cantBQ + cantSC
  const totalDisplay = cantidad > 0 ? (precioDisplay * cantidad) : 0
  const ahorro = cantidad > 0 && precioBase > 0 ? (precioBase - precioDisplay) * cantidad : 0
  const imgUrl = getImgUrl(producto)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col hover:shadow-md transition-shadow">
      {/* Top: imagen + nombre + stock */}
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => onLightbox(idx)}
          className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl border border-gray-100 p-1 flex items-center justify-center overflow-hidden hover:bg-white transition-all cursor-pointer"
        >
          {imgUrl
            ? <img src={imgUrl} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply hover:scale-110 transition-transform" />
            : <Package size={24} className="text-gray-300" />
          }
        </button>

        <div className="flex-1 flex flex-col justify-start min-w-0">
          <button
            onClick={() => onLightbox(idx)}
            className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 mb-2 text-left hover:text-[#16a34a] transition-colors cursor-pointer"
            title={producto.descripcion || producto.art_des}
          >
            {producto.descripcion || producto.art_des || '—'}
          </button>
          <div className="flex flex-wrap gap-1 text-[0.6rem] font-bold text-gray-500 uppercase tracking-wider mt-auto">
            {hasSC && <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">S/C: <span className="text-gray-800">{stockSC}</span></span>}
            {hasBQ && <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">B/Q: <span className="text-gray-800">{stockBQ}</span></span>}
            {sinStock && <span className="bg-red-50 border border-red-100 text-red-500 px-1.5 py-0.5 rounded">Sin Stock</span>}
          </div>
        </div>
      </div>

      {/* Inputs cantidad */}
      <div className="flex gap-2 items-center mb-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
        <span className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-wider px-1 shrink-0">Pedir:</span>
        <input
          type="number" inputMode="numeric" min="0" max={stockBQ}
          value={cantBQ || ''}
          onChange={e => onCantidad(idx, 'bq', e.target.value)}
          disabled={!hasBQ}
          placeholder="B/Q"
          className="w-full text-center py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-[#16a34a] focus:border-[#16a34a] bg-white shadow-inner disabled:bg-gray-100 disabled:opacity-50"
        />
        <input
          type="number" inputMode="numeric" min="0" max={stockSC}
          value={cantSC || ''}
          onChange={e => onCantidad(idx, 'sc', e.target.value)}
          disabled={!hasSC}
          placeholder="S/C"
          className="w-full text-center py-1.5 text-sm font-bold border border-gray-300 rounded-lg focus:ring-[#16a34a] focus:border-[#16a34a] bg-white shadow-inner disabled:bg-gray-100 disabled:opacity-50"
        />
      </div>

      {/* Descuentos grid */}
      <div className="grid grid-cols-4 gap-1 mb-3 text-center">
        {[
          { label: 'Art', val: da, colorBg: 'bg-blue-50/40', colorBorder: 'border-blue-100', colorText: 'text-blue-700', colorLabel: 'text-blue-500' },
          { label: 'Cat', val: dc, colorBg: 'bg-blue-50/40', colorBorder: 'border-blue-100', colorText: 'text-blue-700', colorLabel: 'text-blue-500' },
          { label: 'Lin', val: dl, colorBg: 'bg-blue-50/40', colorBorder: 'border-blue-100', colorText: 'text-blue-700', colorLabel: 'text-blue-500' },
          { label: 'L/G', val: descGlobal, colorBg: 'bg-green-50/40', colorBorder: 'border-green-100', colorText: 'text-green-700', colorLabel: 'text-[#16a34a]' },
        ].map(({ label, val, colorBg, colorBorder, colorText, colorLabel }) => (
          <div key={label} className={`${colorBg} border ${colorBorder} rounded-lg py-1.5 flex flex-col items-center`}>
            <div className={`text-[0.5rem] ${colorLabel} font-bold tracking-wider leading-none mb-1 uppercase`}>{label}</div>
            <div className={`text-xs font-black ${colorText}`}>{val > 0 ? `${val}%` : '—'}</div>
          </div>
        ))}
      </div>

      {/* Precio + total */}
      <div className="mt-auto border-t border-dashed border-gray-200 pt-3 flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Precio U. c/Dcto</span>
          <div className="flex items-baseline gap-1.5">
            {precioBase > 0 && <span className="text-[0.6rem] text-gray-400 line-through">{precioBase.toFixed(2)} $</span>}
            <span className="text-sm font-black text-gray-800">{precioDisplay > 0 ? `${precioDisplay.toFixed(2)} $` : '—'}</span>
          </div>
          <span className="text-[0.6rem] text-[#16a34a] font-bold mt-0.5">
            Ahorro: {ahorro > 0 ? `${ahorro.toFixed(2)} $` : '0.00 $'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Neto</span>
          <span className="text-xl font-black text-gray-900 leading-none">
            {totalDisplay > 0 ? `${totalDisplay.toFixed(2)} $` : '0.00 $'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Modal Vista Previa ────────────────────────────────────────────────────────
function ModalVistaPrevio({ cartItems, totalUnidades, totalNeto, descGlobal, descProveedorNum, observacion, onClose, onConfirmar, enviando }) {
  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-h-[92vh] max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex justify-between items-center shrink-0">
          <h5 className="font-black text-gray-900 flex items-center gap-3 text-base">
            <div className="bg-gray-900 text-white p-2 rounded-lg"><FileText size={16} /></div>
            Vista Previa del Pedido
          </h5>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-grow">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest bg-white border-b border-dashed border-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-center w-14">UND.</th>
                <th className="px-4 py-3">Código / Artículo</th>
                <th className="px-4 py-3 text-right">Neto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cartItems.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-center font-black text-gray-900">{item.cantidad}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-xs text-gray-800">{item.descripcion || item.art_des}</div>
                    <div className="text-[0.6rem] text-gray-400 font-mono mt-0.5">{item.imagen}</div>
                    {(item.cantBQ > 0 || item.cantSC > 0) && (
                      <div className="flex gap-2 mt-1">
                        {item.cantBQ > 0 && <span className="text-[0.55rem] bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">B/Q: {item.cantBQ}</span>}
                        {item.cantSC > 0 && <span className="text-[0.55rem] bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-600">S/C: {item.cantSC}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-gray-900 font-mono">{item.subtotal.toFixed(2)} $</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Observación */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-wider mb-2">Condiciones del Pedido</div>
            <div className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl p-3 shadow-sm min-h-[48px]">
              {observacion || <span className="text-gray-400 italic">Sin condiciones adicionales</span>}
            </div>
          </div>
        </div>

        {/* Footer totales */}
        <div className="bg-gray-900 text-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Unidades</div>
              <div className="text-base font-bold">{totalUnidades}</div>
            </div>
            <div className="h-7 w-px bg-gray-700" />
            <div>
              <div className="text-[0.6rem] text-gray-400 uppercase tracking-widest">Desc. L/G + Prov.</div>
              <div className="text-sm font-bold text-[#4ade80]">
                {(descGlobal + descProveedorNum) > 0 ? `${(descGlobal + descProveedorNum).toFixed(1)}%` : '—'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[0.6rem] text-gray-400 uppercase tracking-widest mb-0.5">Total Neto</div>
            <div className="text-2xl font-black font-mono">${totalNeto.toFixed(2)}</div>
          </div>
        </div>

        {/* Botones */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-4 flex flex-wrap sm:flex-nowrap justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-600 font-bold text-xs uppercase tracking-wide rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Modificar
          </button>
          <button
            onClick={onConfirmar}
            disabled={enviando}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#16a34a] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {enviando ? 'Enviando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function NuevoPedido() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()

  const cliente = state?.cliente || null

  useEffect(() => {
    if (!cliente) navigate('/visitador', { replace: true })
  }, [cliente, navigate])

  // Data
  const [tiemposPago, setTiemposPago] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [descGlobal, setDescGlobal] = useState(0)

  // UI
  const [cantidades, setCantidades] = useState({})     // {idx: {bq, sc}}
  const [tiemposActivos, setTiemposActivos] = useState(new Set())
  const [descProveedorActivo, setDescProveedorActivo] = useState(false)
  const [descProveedorVal, setDescProveedorVal] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [clientIp, setClientIp] = useState('127.0.0.1')

  const descProveedorInputRef = useRef(null)

  // ── Carga de datos ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cliente) return
    const proveedor = user?.proveedor || ''

    Promise.all([
      getTiemposPago().catch(() => []),
      getClienteByRif(cliente.rif || '').catch(() => []),
    ])
      .then(async ([tiempos, clienteData]) => {
        setTiemposPago(Array.isArray(tiempos) ? tiempos : [])

        const arr = Array.isArray(clienteData) ? clienteData
          : (Array.isArray(clienteData?.data) ? clienteData.data : [])
        const descGlob = parseFloat(arr[0]?.desc_glob) || 0
        setDescGlobal(descGlob)

        // Determinar precio_num según tipo de cliente
        let precioNum = 1
        const tipo = cliente.tipo || ''
        if (tipo && proveedor) {
          try {
            const tipoData = await getTipoCliente(tipo)
            const tipoArr = Array.isArray(tipoData) ? tipoData
              : (Array.isArray(tipoData?.data) ? tipoData.data : [])
            if (tipoArr[0]?.precio_a) {
              const precioA = String(tipoArr[0].precio_a).trim().toUpperCase()
              precioNum = { 'PRECIO 1': 1, 'PRECIO 2': 2, 'PRECIO 3': 3, 'PRECIO 4': 4 }[precioA] || 1
            }
          } catch (_) {}
        }

        if (proveedor) {
          const catalog = await getCatalogo(proveedor, cliente, precioNum)
          setProductos(Array.isArray(catalog) ? catalog : [])
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [cliente, user])

  // Fetch client IP
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(() => setClientIp('127.0.0.1'))
  }, [])

  // ── Descuentos de tiempo de pago ─────────────────────────────────────────
  const handleTiempoToggle = (idx) => {
    setTiemposActivos(prev => {
      const next = new Set(prev)
      const isExclusive = idx > 0
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        if (isExclusive) {
          for (const k of next) { if (k > 0) next.delete(k) }
        }
        next.add(idx)
      }
      return next
    })
  }

  const sumaDescAdicionales = useMemo(() => {
    let sum = 0
    for (const idx of tiemposActivos) sum += tiemposPago[idx]?.porcentaje || 0
    return sum
  }, [tiemposActivos, tiemposPago])

  const descProveedorNum = parseFloat(descProveedorVal) || 0

  // ── Cantidades ────────────────────────────────────────────────────────────
  const handleCantidad = (idx, campo, valor) => {
    const num = parseInt(String(valor).replace(/\D/g, '')) || 0
    const producto = productos[idx]
    const maxBQ = parseInt(producto?.stock_barquisimeto) || 0
    const maxSC = parseInt(producto?.stock_tachira) || 0

    setCantidades(prev => {
      const cur = prev[idx] || { bq: 0, sc: 0 }
      return {
        ...prev,
        [idx]: {
          bq: campo === 'bq' ? Math.min(Math.max(0, num), maxBQ) : cur.bq,
          sc: campo === 'sc' ? Math.min(Math.max(0, num), maxSC) : cur.sc,
        },
      }
    })
  }

  // ── Carrito ───────────────────────────────────────────────────────────────
  const cartItems = useMemo(() => {
    return productos
      .map((p, idx) => {
        const { bq = 0, sc = 0 } = cantidades[idx] || {}
        const cantidad = bq + sc
        if (!cantidad) return null
        const precioU = calcPrecioCarrito(p, descGlobal, descProveedorNum)
        return { ...p, idx, cantBQ: bq, cantSC: sc, cantidad, precioU, subtotal: precioU * cantidad }
      })
      .filter(Boolean)
  }, [productos, cantidades, descGlobal, descProveedorNum])

  const totalUnidades = cartItems.reduce((s, i) => s + i.cantidad, 0)
  const totalNeto = cartItems.reduce((s, i) => s + i.subtotal, 0)

  // ── Texto de observación ──────────────────────────────────────────────────
  const observacion = useMemo(() => {
    const parts = []
    for (const idx of tiemposActivos) {
      const t = tiemposPago[idx]
      if (t) parts.push(`${t.tiempo} ${t.porcentaje}%`)
    }
    if (descProveedorActivo && descProveedorNum > 0) {
      parts.push(`DSCTO APL. PROV ${descProveedorNum}%`)
    }
    return parts.join(' | ')
  }, [tiemposActivos, tiemposPago, descProveedorActivo, descProveedorNum])

  // ── Filtro de productos ───────────────────────────────────────────────────
  const productosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return productos.map((p, idx) => ({ p, idx }))
    const q = busqueda.trim().toLowerCase()
    return productos
      .map((p, idx) => ({ p, idx }))
      .filter(({ p }) => {
        const desc = String(p.descripcion || p.art_des || '').toLowerCase()
        const cod = String(p.co_art || '').toLowerCase()
        return desc.includes(q) || cod.includes(q)
      })
  }, [productos, busqueda])

  // ── Enviar pedido ─────────────────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!cartItems.length) return
    setEnviando(true)
    try {
      const provArr = asArray(user?.proveedor)
      const cod_prov = provArr[0] || String(user?.proveedor || '')

      const descuentosAdicionalesList = []
      for (const idx of tiemposActivos) {
        const t = tiemposPago[idx]
        if (t) descuentosAdicionalesList.push({ tiempo: t.tiempo, porcentaje: t.porcentaje })
      }

      const porc_gdesc = descGlobal + descProveedorNum
      const porc_gdesc_total = porc_gdesc + sumaDescAdicionales

      const items = cartItems.map(item => {
        const cantTotal = item.cantBQ + item.cantSC
        // tot_bruto = price after art/cat/lin/global/provider discounts × qty (no 0.9 factor)
        const tot_bruto = +(item.precioU * cantTotal).toFixed(2)
        const tot_neto = +(tot_bruto * 0.9).toFixed(2)
        const iva_item = +(tot_bruto - tot_neto).toFixed(2)

        return {
          co_art: item.imagen,
          cant_bq: item.cantBQ,
          cant_sc: item.cantSC,
          cant_producto: cantTotal,
          precio: parseFloat(item.Precio) || 0,
          descuento: descProveedorNum,
          desc_especial: 0,
          porc_gdesc,
          porc_gdesc_total,
          suma_descuentos_adicionales: sumaDescAdicionales,
          tot_bruto,
          tot_neto,
          saldo: tot_neto,
          iva: iva_item,
        }
      })

      const payload = {
        usuario: { user: user?.user || '' },
        co_us_in: user?.user || '',
        cod_cliente: cliente.co_cli || '',
        codigo_pedido: Date.now(),
        items,
        cod_prov,
        descuentos_adicionales: descuentosAdicionalesList,
        descrip: observacion,
        ip_cliente: clientIp,
      }

      const result = await crearPedidoTransf(payload)

      setShowPreview(false)
      setCantidades({})

      // Mostrar éxito con SweetAlert2
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({
        icon: 'success',
        title: '¡Pedido Registrado!',
        html: `El pedido ha sido creado exitosamente.<br><br><strong style="font-size:1.2rem">N° ${result.fact_num || '—'}</strong>`,
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#16a34a',
        customClass: { popup: 'rounded-2xl' },
      })

      navigate('/visitador', { replace: true })
    } catch (err) {
      console.error('[handleConfirmar] error:', err)
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar el pedido',
        text: err.message,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#dc2626',
        customClass: { popup: 'rounded-2xl' },
      })
    } finally {
      setEnviando(false)
    }
  }

  if (!cliente) return null

  return (
    <div className="flex flex-col gap-6">

      {/* ── Banner cliente ── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute w-2 bg-[#16a34a] h-full left-0 top-0 rounded-l-2xl" />
        <div className="pl-3 w-full sm:w-auto">
          <div className="text-[0.6rem] font-black tracking-widest text-[#16a34a] uppercase mb-1">Pedido actual en curso</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-800 uppercase truncate" title={cliente.cli_des}>
            {cliente.cli_des || cliente.nombre || cliente.co_cli}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            <span>RIF: <strong className="text-gray-800">{cliente.rif || '—'}</strong></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span>Código: <strong className="text-[#16a34a]">{cliente.co_cli || '—'}</strong></span>
          </div>
        </div>
        <button
          onClick={() => navigate('/visitador')}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-semibold text-sm transition-all shrink-0 cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Volver al inicio</span>
        </button>
      </section>

      {/* ── Tiempos de pago ── */}
      {tiemposPago.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="text-[#16a34a]">%</span> Descuentos y Tiempos de entrega
            </div>
            <span className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
              Selecciona tus descuentos
            </span>
          </div>

          <div className="flex overflow-x-auto gap-2.5 pb-2 w-full">
            {tiemposPago.map((tp, idx) => {
              const isActive = tiemposActivos.has(idx)
              const isFirst = idx === 0
              const activeCls = isFirst
                ? 'border-yellow-500 bg-yellow-100/60'
                : 'border-[#16a34a] bg-green-50/50 shadow-sm'
              const idleCls = isFirst
                ? 'border-yellow-300 bg-yellow-50/40 hover:border-yellow-400'
                : 'border-gray-200 hover:border-[#16a34a]/40'

              return (
                <button
                  key={idx}
                  onClick={() => handleTiempoToggle(idx)}
                  className={`shrink-0 min-w-[140px] sm:min-w-[160px] flex items-center gap-2.5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all text-left ${isActive ? activeCls : idleCls}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? (isFirst ? 'border-yellow-500 bg-yellow-500' : 'border-[#16a34a] bg-[#16a34a]') : 'border-gray-300 bg-white'}`}>
                    {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex flex-col">
                    <strong className="text-sm font-black text-gray-800 leading-none mb-1">{tp.porcentaje}%</strong>
                    <span className="text-[0.6rem] font-medium text-gray-500 leading-tight">{tp.tiempo}</span>
                  </div>
                </button>
              )
            })}

            {/* Descuento proveedor */}
            <button
              onClick={() => {
                const next = !descProveedorActivo
                setDescProveedorActivo(next)
                if (!next) setDescProveedorVal('')
                else setTimeout(() => descProveedorInputRef.current?.focus(), 50)
              }}
              className={`shrink-0 min-w-[140px] sm:min-w-[160px] flex items-center gap-2.5 border-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${descProveedorActivo ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-blue-50/30 hover:border-blue-300'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${descProveedorActivo ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}>
                {descProveedorActivo && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <div className="flex flex-col w-full">
                <span className="text-[0.6rem] font-bold text-blue-800 tracking-wider leading-none mb-1.5">DCTO. PROVEEDOR</span>
                {descProveedorActivo
                  ? (
                    <input
                      ref={descProveedorInputRef}
                      type="number" min="0" max="100"
                      value={descProveedorVal}
                      onChange={e => setDescProveedorVal(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      placeholder="%"
                      className="w-14 px-1.5 py-0.5 text-center font-bold border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 text-sm bg-white"
                    />
                  )
                  : <span className="text-xs font-black text-blue-700">%</span>
                }
              </div>
            </button>
          </div>
        </section>
      )}

      {/* ── Contenido principal ── */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-[#16a34a]" />
            <span className="text-sm">Cargando catálogo...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">

          {/* ── Grid de productos ── */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">

            {/* Buscador */}
            <div className="p-3 border-b border-gray-200 bg-gray-50/80">
              <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={15} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por descripción, código..."
                  className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/40 focus:border-[#16a34a] text-sm transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Tarjetas */}
            <div className="p-4 bg-gray-100/50 flex-1">
              {productosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Package size={40} className="mb-3 text-gray-300" />
                  <span className="text-sm font-medium">
                    {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay productos disponibles'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto scrollbar-thin content-start p-1">
                  {productosFiltrados.map(({ p, idx }) => {
                    const { bq = 0, sc = 0 } = cantidades[idx] || {}
                    return (
                      <ProductCard
                        key={idx}
                        producto={p}
                        idx={idx}
                        cantBQ={bq}
                        cantSC={sc}
                        onCantidad={handleCantidad}
                        onLightbox={setLightboxIdx}
                        descGlobal={descGlobal}
                        descProveedor={descProveedorNum}
                        sumaAdicionales={sumaDescAdicionales}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Carrito ── */}
          <div className="xl:w-96 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 rounded-t-2xl" />

            {/* Header carrito */}
            <div className="p-5 pb-4 border-b border-dashed border-gray-300 flex justify-between items-end">
              <div>
                <h3 className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">Resumen</h3>
                <div className="text-lg font-bold text-gray-900 uppercase flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#16a34a]" /> Su Pedido
                </div>
              </div>
              <div className="text-right">
                <span className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-wider">Items</span>
                <div className="text-2xl font-black text-gray-900 leading-none">{cartItems.length}</div>
              </div>
            </div>

            {/* Lista carrito */}
            <div className="overflow-y-auto max-h-80 bg-gray-50/50 p-4 flex flex-col gap-3">
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6 italic">Su carrito está vacío.</p>
              ) : cartItems.map((item, i) => {
                const imgUrl = getImgUrl(item)
                return (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex gap-3 items-center hover:border-[#16a34a]/40 transition-colors">
                    <div className="w-11 h-11 shrink-0 bg-gray-50 rounded-lg border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                      {imgUrl
                        ? <img src={imgUrl} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="" />
                        : <Package size={16} className="text-gray-300" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 leading-tight truncate mb-1">{item.descripcion || item.art_des}</h4>
                      <div className="flex items-center gap-2 text-[0.6rem] font-bold flex-wrap">
                        <span className="text-gray-500 uppercase tracking-widest">Cant:</span>
                        <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">{item.cantidad}</span>
                        {item.cantBQ > 0 && <span className="text-gray-500">B/Q:{item.cantBQ}</span>}
                        {item.cantSC > 0 && <span className="text-gray-500">S/C:{item.cantSC}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-black text-gray-900 font-mono shrink-0">{item.subtotal.toFixed(2)} $</span>
                  </div>
                )
              })}
            </div>

            {/* Totalización */}
            <div className="p-5 border-t border-dashed border-gray-300 space-y-2">
              <h6 className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest px-1">Totalización</h6>
              <div className="flex justify-between items-center text-sm font-medium text-gray-600 px-1">
                <span>Unidades Totales</span>
                <span className="font-bold font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{totalUnidades}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium text-[#16a34a] px-1 pb-3 border-b border-dashed border-gray-200">
                <span>% L/G + Desc. Proveedor</span>
                <span className="font-bold font-mono bg-green-50 px-2 py-0.5 rounded border border-green-100">
                  {(descGlobal + descProveedorNum) > 0 ? `${(descGlobal + descProveedorNum).toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-end px-1 pt-1">
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Total Neto</span>
                <span className="text-3xl font-black text-gray-900 tracking-tighter font-mono leading-none">
                  ${totalNeto.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Botones acción */}
            <div className="p-5 pt-4 bg-white flex flex-wrap sm:flex-nowrap gap-3">
              <button
                onClick={() => setCantidades({})}
                disabled={cartItems.length === 0}
                className="flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-bold py-3 px-4 rounded-xl transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={16} />
                <span className="text-xs uppercase tracking-wide">Vaciar</span>
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={cartItems.length === 0}
                className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Realizar Pedido <ChevronRight size={16} className="text-[#16a34a]" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── Modal vista previa ── */}
      {showPreview && (
        <ModalVistaPrevio
          cartItems={cartItems}
          totalUnidades={totalUnidades}
          totalNeto={totalNeto}
          descGlobal={descGlobal}
          descProveedorNum={descProveedorNum}
          observacion={observacion}
          onClose={() => setShowPreview(false)}
          onConfirmar={handleConfirmar}
          enviando={enviando}
        />
      )}

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && productos[lightboxIdx] && (
        <Lightbox producto={productos[lightboxIdx]} onClose={() => setLightboxIdx(null)} />
      )}

    </div>
  )
}

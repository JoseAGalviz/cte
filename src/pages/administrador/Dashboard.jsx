import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Clock, Users, ListOrdered, AlertTriangle, X, UserPlus } from 'lucide-react'

import {
  getTransferencias,
  getTransacciones,
  getNotasCredito,
  getProductosVendidos,
  getProveedores,
  getDetallePedido,
} from '../../services/adminService'

import TablaTransferencias from '../../components/admin/TablaTransferencias'
import TablaTransacciones from '../../components/admin/TablaTransacciones'
import TablaNotasCreditoAdmin from '../../components/admin/TablaNotasCreditoAdmin'
import ProductosVendidosAdmin from '../../components/admin/ProductosVendidosAdmin'
import ModalEditarUsuarios from '../../components/admin/ModalEditarUsuarios'
import ModalDetalleAdmin from '../../components/admin/ModalDetalleAdmin'
import ModalTiemposPago from '../../components/admin/ModalTiemposPago'
import ModalPedidos from '../../components/admin/ModalPedidos'
import ModalInconsistencias from '../../components/admin/ModalInconsistencias'

// Default month range: 3 months ago → current
const _now = new Date()
const _pad = n => String(n).padStart(2, '0')
const CURRENT_MONTH = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}`
const _3ago = new Date(_now.getFullYear(), _now.getMonth() - 2, 1)
const START_MONTH_DEFAULT = `${_3ago.getFullYear()}-${_pad(_3ago.getMonth() + 1)}`

function monthToDateRange(startM, endM) {
  const [sy, sm] = (startM || CURRENT_MONTH).split('-').map(Number)
  const [ey, em] = (endM || startM || CURRENT_MONTH).split('-').map(Number)
  const lastDay = new Date(ey, em, 0).getDate()
  return {
    startDate: `${sy}-${_pad(sm)}-01`,
    endDate: `${ey}-${_pad(em)}-${_pad(lastDay)}`,
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  // Date filters
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [transStart, setTransStart] = useState(START_MONTH_DEFAULT)
  const [transEnd, setTransEnd] = useState(CURRENT_MONTH)

  // Data
  const [transferencias, setTransferencias] = useState([])
  const [transacciones, setTransacciones] = useState([])
  const [notas, setNotas] = useState([])
  const [productos, setProductos] = useState([])
  const [provMap, setProvMap] = useState({})

  // Loading
  const [loading, setLoading] = useState(true)
  const [loadingTrans, setLoadingTrans] = useState(false)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  // Modals
  const [modalDetalle, setModalDetalle] = useState(null)
  const [showTiemposPago, setShowTiemposPago] = useState(false)
  const [showPedidos, setShowPedidos] = useState(false)
  const [showInconsistencias, setShowInconsistencias] = useState(false)
  const [showUsuarios, setShowUsuarios] = useState(false)

  // notasMap: provider label (normalized) → total monto notas crédito
  const notasMap = useMemo(() => {
    const normalize = s =>
      String(s || '').replace(/^\s*\d+\s*[-. ]\s*/, '').replace(/\s+/g, ' ').trim().toUpperCase()
    const map = {}
    notas.forEach(n => {
      const label = provMap[n.co_prov] || n.prov_des || n.proveedor || ''
      const key = normalize(label)
      map[key] = (map[key] || 0) + (Number(n.monto || n.importe || 0) || 0)
    })
    return map
  }, [notas, provMap])

  // Load provMap once
  useEffect(() => {
    getProveedores()
      .then(data => {
        const m = {}
        data.forEach(p => { m[p.co_prov] = p.prov_des })
        setProvMap(m)
      })
      .catch(console.error)
  }, [])

  // Load transferencias + notas + productos
  async function loadMain(d1 = null, d2 = null) {
    setLoading(true)
    try {
      const [tfr, nts, prods] = await Promise.all([
        getTransferencias(d1, d2),
        getNotasCredito(d1, d2),
        getProductosVendidos(d1, d2),
      ])
      setTransferencias(tfr)
      setNotas(nts)
      setProductos(prods)
    } catch (e) {
      console.error('loadMain error', e)
    } finally {
      setLoading(false)
    }
  }

  // Load transacciones (also reloads notas for accurate notasMap)
  async function loadTrans(d1 = null, d2 = null) {
    setLoadingTrans(true)
    try {
      const [nts, trans] = await Promise.all([
        getNotasCredito(d1, d2),
        getTransacciones(d1, d2),
      ])
      setNotas(nts)
      setTransacciones(trans)
    } catch (e) {
      console.error('loadTrans error', e)
    } finally {
      setLoadingTrans(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadMain()
    const { startDate, endDate } = monthToDateRange(START_MONTH_DEFAULT, CURRENT_MONTH)
    loadTrans(startDate, endDate)
  }, [])

  function handleBuscar() {
    if (!fechaDesde || !fechaHasta) return
    loadMain(fechaDesde, fechaHasta)
    loadTrans(fechaDesde, fechaHasta)
  }

  function handleActualizarTrans() {
    const { startDate, endDate } = monthToDateRange(
      transStart || START_MONTH_DEFAULT,
      transEnd || CURRENT_MONTH,
    )
    loadTrans(startDate, endDate)
  }

  async function handleVerDetalle(fila) {
    const factNum = fila.fact_num || fila.fac_num || ''
    if (!factNum) return
    setLoadingDetalle(true)
    try {
      const res = await getDetallePedido(factNum)
      // Normalize varying response shapes into { factura, renglones }
      let data = res
      if (!res?.factura && !res?.renglones) {
        const items = res?.articulos || res?.productos || res?.items || res?.detalle
        data = { factura: res?.factura || {}, renglones: items || (Array.isArray(res) ? res : []) }
      }
      setModalDetalle(data)
    } catch (e) {
      console.error('handleVerDetalle error', e)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const transFilter = (
    <div className="flex flex-wrap items-center gap-2">
      <div>
        <label className="block text-[0.6rem] font-bold text-slate-400 uppercase mb-0.5">Desde (mes)</label>
        <input
          type="month"
          value={transStart}
          onChange={e => setTransStart(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[0.6rem] font-bold text-slate-400 uppercase mb-0.5">Hasta (mes)</label>
        <input
          type="month"
          value={transEnd}
          onChange={e => setTransEnd(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
        />
      </div>
      <button
        onClick={handleActualizarTrans}
        disabled={loadingTrans}
        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 self-end"
      >
        {loadingTrans && <Loader2 size={12} className="animate-spin" />}
        Actualizar
      </button>
    </div>
  )

  return (
    <div className="space-y-6 pb-28">
      {/* Date filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={!fechaDesde || !fechaHasta || loading}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Buscar
          </button>
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta(''); loadMain() }}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
              title="Limpiar filtro"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left — 3 cols */}
        <div className="lg:col-span-3 space-y-6">

          {/* Transferencias */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 flex flex-col items-center text-slate-400">
              <Loader2 size={28} className="animate-spin mb-3" />
              <span className="text-sm font-medium">Cargando transferencias...</span>
            </div>
          ) : (
            <TablaTransferencias filas={transferencias} onVerDetalle={handleVerDetalle} />
          )}

          {/* Transacciones */}
          <TablaTransacciones
            filas={transacciones}
            notasMap={notasMap}
            headerRight={transFilter}
          />

          {/* Notas de Crédito */}
          <TablaNotasCreditoAdmin notas={notas} provMap={provMap} />
        </div>

        {/* Right sidebar — 1 col */}
        <div className="lg:col-span-1">
          <ProductosVendidosAdmin proveedores={productos} />
        </div>
      </div>

      {/* Detalle loading overlay */}
      {loadingDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl px-8 py-6 flex items-center gap-3 shadow-xl">
            <Loader2 size={22} className="animate-spin text-rose-500" />
            <span className="text-sm font-semibold text-slate-700">Cargando detalle...</span>
          </div>
        </div>
      )}

      {/* Floating action buttons */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-row-reverse gap-3 flex-wrap">
        <button
          onClick={() => setShowTiemposPago(true)}
          className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
          title="Tiempos de Pago"
        >
          <Clock size={20} />
        </button>
        <button
          onClick={() => navigate('/administrador/usuarios')}
          className="w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition"
          style={{ backgroundColor: '#1A9888' }}
          title="Crear Usuario"
        >
          <UserPlus size={20} />
        </button>
        <button
          onClick={() => setShowUsuarios(true)}
          className="w-14 h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
          title="Editar Usuarios"
        >
          <Users size={20} />
        </button>
        <button
          onClick={() => setShowPedidos(true)}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center transition"
          title="Ver Pedidos"
        >
          <ListOrdered size={20} />
        </button>
        <button
          onClick={() => setShowInconsistencias(true)}
          className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
          title="Inconsistencias"
        >
          <AlertTriangle size={20} />
        </button>
      </div>

      {/* Modals */}
      {modalDetalle && (
        <ModalDetalleAdmin detalle={modalDetalle} onClose={() => setModalDetalle(null)} />
      )}
      {showTiemposPago && <ModalTiemposPago onClose={() => setShowTiemposPago(false)} />}
      {showPedidos && <ModalPedidos onClose={() => setShowPedidos(false)} />}
      {showInconsistencias && <ModalInconsistencias onClose={() => setShowInconsistencias(false)} />}
      {showUsuarios && <ModalEditarUsuarios onClose={() => setShowUsuarios(false)} />}
    </div>
  )
}

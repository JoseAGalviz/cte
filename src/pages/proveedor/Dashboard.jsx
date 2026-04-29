import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MapPin, Globe, Loader2, X } from 'lucide-react'

// Importar servicios
import {
  getFacturasProveedor,
  getVentasUsuarios,
  getProductosMasVendidos,
  getStockAlmacenes,
  getNotasCredito,
  getCatalogo
} from '../../services/proveedorService'

// Importar componentes de UI
import VentasChart from '../../components/proveedor/VentasChart'
import EstadisticasUsuarios from '../../components/proveedor/EstadisticasUsuarios'
import TablaFacturasProv from '../../components/proveedor/TablaFacturasProv'
import TablaNotasCredito from '../../components/proveedor/TablaNotasCredito'
import GestionStocks from '../../components/proveedor/GestionStocks'
import RankingStats from '../../components/proveedor/RankingStats'

import ModalComparativaProv from '../../components/proveedor/ModalComparativaProv'
import ModalProforma from '../../components/visitador/ModalProforma'

// Importar generadores
import { generarPDFFactura, generarExcelFactura, generarExcelTransferencias, generarExcelCatalogo, generarPDFCatalogo } from '../../utils/exportHelpers'

export default function ProveedorDashboard() {
  const { user } = useAuth()
  
  // Extraer el código del proveedor del usuario logueado
  const provRaw = user?.proveedor || user?.proveedor_codigo || user?.cod_prov || user?.co_prov || ''
  const codProv = Array.isArray(provRaw) ? (provRaw.length ? provRaw[0] : '') : provRaw

  // Estados de datos
  const [facturas, setFacturas] = useState([])
  const [ventasUsuarios, setVentasUsuarios] = useState([])
  const [productosVendidos, setProductosVendidos] = useState([])
  const [stockAlmacenes, setStockAlmacenes] = useState([])
  const [notasCredito, setNotasCredito] = useState([])

  const [loadingFacturas, setLoadingFacturas] = useState(true)
  const [loadingVentas, setLoadingVentas] = useState(true)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [loadingStock, setLoadingStock] = useState(true)
  const [loadingNotas, setLoadingNotas] = useState(true)

  const anyLoading = loadingFacturas || loadingVentas || loadingProductos || loadingStock || loadingNotas

  const [loadingCatalogo, setLoadingCatalogo] = useState(false)
  const [modalCatalogo, setModalCatalogo] = useState(null) // { precioNum, tipo }

  const handleCatalogo = async (formato) => {
    if (!modalCatalogo || loadingCatalogo) return
    const { precioNum, tipo } = modalCatalogo
    setModalCatalogo(null)
    setLoadingCatalogo(true)
    try {
      const productos = await getCatalogo(codProv, precioNum)
      if (formato === 'pdf') generarPDFCatalogo(productos, tipo)
      else await generarExcelCatalogo(productos, tipo)
    } catch (err) {
      console.error('Error catálogo:', err)
    } finally {
      setLoadingCatalogo(false)
    }
  }

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Modales
  const [modalDetalles, setModalDetalles] = useState(null)
  const [modalProforma, setModalProforma] = useState(null)

  // Función principal para cargar todo — progresivo, cada sección muestra al llegar
  const loadDashboardData = (fDesde = '', fHasta = '') => {
    if (!codProv) {
      setLoadingFacturas(false)
      setLoadingVentas(false)
      setLoadingProductos(false)
      setLoadingStock(false)
      setLoadingNotas(false)
      return
    }

    setLoadingFacturas(true)
    setLoadingVentas(true)
    setLoadingProductos(true)
    setLoadingStock(true)
    setLoadingNotas(true)

    getFacturasProveedor(codProv, fDesde, fHasta)
      .then(res => {
        let parsed = []
        if (Array.isArray(res)) parsed = res
        else if (res && Array.isArray(res.facturas)) parsed = res.facturas
        else if (res && Array.isArray(res.data)) parsed = res.data
        parsed.sort((a, b) => {
          const da = a?.fec_emis ? Date.parse(a.fec_emis) : 0
          const db = b?.fec_emis ? Date.parse(b.fec_emis) : 0
          return db - da
        })
        setFacturas(parsed)
      })
      .catch(err => console.error('Error facturas:', err))
      .finally(() => setLoadingFacturas(false))

    getVentasUsuarios(codProv)
      .then(setVentasUsuarios)
      .catch(err => console.error('Error ventas:', err))
      .finally(() => setLoadingVentas(false))

    getProductosMasVendidos(codProv)
      .then(setProductosVendidos)
      .catch(err => console.error('Error productos:', err))
      .finally(() => setLoadingProductos(false))

    getStockAlmacenes(codProv)
      .then(setStockAlmacenes)
      .catch(err => console.error('Error stock:', err))
      .finally(() => setLoadingStock(false))

    getNotasCredito(codProv)
      .then(setNotasCredito)
      .catch(err => console.error('Error notas:', err))
      .finally(() => setLoadingNotas(false))
  }

  // Carga inicial
  useEffect(() => {
    loadDashboardData(fechaDesde, fechaHasta)
  }, [codProv])

  const handleAplicarFiltro = () => {
    loadDashboardData(fechaDesde, fechaHasta)
  }

  const handleLimpiarFiltro = () => {
    setFechaDesde('')
    setFechaHasta('')
    loadDashboardData('', '')
  }

  return (
    <div className="flex flex-col gap-4 max-w-full overflow-hidden pb-6">

      {/* Botones de catálogo — ancho completo */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModalCatalogo({ precioNum: 4, tipo: 'regional' })}
          disabled={loadingCatalogo}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-center gap-3 transition-colors"
        >
          {loadingCatalogo ? <Loader2 size={22} className="animate-spin shrink-0" /> : <MapPin size={22} className="opacity-90 shrink-0" />}
          <div className="text-left">
            <span className="block font-bold text-sm leading-tight uppercase">Táchira · Mérida · Trujillo</span>
            <span className="text-xs opacity-75">Disponibilidad regional</span>
          </div>
        </button>

        <button
          onClick={() => setModalCatalogo({ precioNum: 3, tipo: 'nacional' })}
          disabled={loadingCatalogo}
          className="bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-center gap-3 transition-colors"
        >
          {loadingCatalogo ? <Loader2 size={22} className="animate-spin shrink-0" /> : <Globe size={22} className="opacity-90 shrink-0" />}
          <div className="text-left">
            <span className="block font-bold text-sm leading-tight uppercase">Otros Estados</span>
            <span className="text-xs opacity-75">Disponibilidad nacional</span>
          </div>
        </button>
      </div>

      {/* Estadísticas */}
      <div>
        <h2 className="text-base font-black text-slate-800 uppercase tracking-wider mb-3 border-l-4 border-emerald-500 pl-3">
          Estadísticas
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="xl:col-span-2 lg:col-span-2">
            {loadingVentas ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                <Loader2 size={28} className="animate-spin mb-3" />
                <span className="font-medium text-sm">Cargando ventas...</span>
              </div>
            ) : (
              <VentasChart data={ventasUsuarios} />
            )}
          </div>
          <div className="xl:col-span-1 lg:col-span-1">
            {loadingVentas || loadingFacturas ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                <Loader2 size={28} className="animate-spin mb-3" />
                <span className="font-medium text-sm">Cargando estadísticas...</span>
              </div>
            ) : (
              <EstadisticasUsuarios data={ventasUsuarios} facturas={facturas} />
            )}
          </div>
        </div>
      </div>

      {/* Datos principales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-4">

        {/* Columna principal */}
        <div className="xl:col-span-2 lg:col-span-2 space-y-4">

          {!loadingFacturas && facturas.length > 0 && (
            <RankingStats facturas={facturas} />
          )}

          {/* Filtro de fechas sobre la tabla */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[0.6rem] font-bold text-slate-400 uppercase mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={e => setFechaDesde(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="flex-1 min-w-[130px]">
                <label className="block text-[0.6rem] font-bold text-slate-400 uppercase mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={e => setFechaHasta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleAplicarFiltro}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2 shrink-0"
              >
                {anyLoading && <Loader2 size={14} className="animate-spin" />}
                OK
              </button>
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={handleLimpiarFiltro}
                  className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-100 shrink-0"
                  title="Limpiar filtros"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {loadingFacturas ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={28} className="animate-spin mb-3" />
              <span className="font-medium text-sm">Cargando transferencias...</span>
            </div>
          ) : (
            <TablaFacturasProv
              facturas={facturas}
              onVerDetalles={(factura) => setModalDetalles(factura)}
              onDescargarPDF={(factura) => generarPDFFactura(factura)}
              onDescargarExcel={(factura) => generarExcelFactura(factura)}
              onGenerarExcelGeneral={() => generarExcelTransferencias(facturas)}
            />
          )}

          {loadingNotas ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={22} className="animate-spin mb-3" />
              <span className="font-medium text-sm">Cargando notas de crédito...</span>
            </div>
          ) : (
            <TablaNotasCredito notas={notasCredito} />
          )}
        </div>

        {/* Sidebar sticky */}
        <div className="xl:col-span-1 lg:col-span-1">
          <div className="sticky top-4">
            {loadingProductos || loadingStock ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={28} className="animate-spin mb-3" />
                <span className="font-medium text-sm">Cargando stocks...</span>
              </div>
            ) : (
              <GestionStocks
                productosVendidos={productosVendidos}
                stockAlmacenes={stockAlmacenes}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal selección formato catálogo */}
      {modalCatalogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 flex flex-col gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-base uppercase tracking-wide">Generar catálogo</h3>
              <p className="text-sm text-slate-500 mt-1">
                {modalCatalogo.tipo === 'regional' ? 'Táchira · Mérida · Trujillo' : 'Otros Estados'}
              </p>
              <p className="text-xs text-slate-400 mt-1">¿En qué formato deseas descargarlo?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCatalogo('pdf')}
                className="flex flex-col items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl py-4 font-bold text-sm transition-colors"
              >
                <span className="text-2xl">📄</span>
                PDF
              </button>
              <button
                onClick={() => handleCatalogo('excel')}
                className="flex flex-col items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl py-4 font-bold text-sm transition-colors"
              >
                <span className="text-2xl">📊</span>
                Excel
              </button>
            </div>
            <button
              onClick={() => setModalCatalogo(null)}
              className="text-xs text-slate-400 hover:text-slate-600 text-center transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modales Compartidos */}
      {modalDetalles && (
        <ModalComparativaProv
          factura={modalDetalles}
          onClose={() => setModalDetalles(null)}
        />
      )}
      
      {modalProforma && (
         <ModalProforma 
          pedido={modalProforma}
          onClose={() => setModalProforma(null)}
         />
      )}

    </div>
  )
}

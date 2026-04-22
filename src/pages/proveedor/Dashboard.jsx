import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MapPin, Globe, Loader2, X } from 'lucide-react'

// Importar servicios
import { 
  getFacturasProveedor, 
  getVentasUsuarios, 
  getProductosMasVendidos, 
  getStockAlmacenes, 
  getNotasCredito 
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
import { generarPDFFactura, generarExcelFactura, generarExcelTransferencias } from '../../utils/exportHelpers'

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
  
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Modales
  const [modalDetalles, setModalDetalles] = useState(null)
  const [modalProforma, setModalProforma] = useState(null)

  // Función principal para cargar todo
  const loadDashboardData = async (fDesde = '', fHasta = '') => {
    if (!codProv) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Cargamos todas las APIs en paralelo para máxima eficiencia
      const [
        resFacturas, 
        resVentasUsr, 
        resProdVendido,
        resStock,
        resNotas
      ] = await Promise.all([
        getFacturasProveedor(codProv, fDesde, fHasta),
        getVentasUsuarios(codProv),
        getProductosMasVendidos(codProv),
        getStockAlmacenes(codProv),
        getNotasCredito(codProv)
      ])

      // Parse facturas (pueden venir envueltas en res.facturas o res.data)
      let parsedFacturas = []
      if (Array.isArray(resFacturas)) parsedFacturas = resFacturas
      else if (resFacturas && Array.isArray(resFacturas.facturas)) parsedFacturas = resFacturas.facturas
      else if (resFacturas && Array.isArray(resFacturas.data)) parsedFacturas = resFacturas.data

      // Ordenar facturas desc
      parsedFacturas.sort((a, b) => {
        const da = a?.fec_emis ? Date.parse(a.fec_emis) : 0
        const db = b?.fec_emis ? Date.parse(b.fec_emis) : 0
        return db - da
      })

      setFacturas(parsedFacturas)
      setVentasUsuarios(resVentasUsr)
      setProductosVendidos(resProdVendido)
      setStockAlmacenes(resStock)
      setNotasCredito(resNotas)
    } catch (err) {
      console.error('Error cargando el dashboard del proveedor:', err)
    } finally {
      setLoading(false)
    }
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
    <div className="space-y-6 max-w-full overflow-hidden pb-10">
      
      {/* Botones de Catálogo (UI Header) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm p-4 sm:p-5 flex items-center justify-center gap-4 transition-colors">
          <MapPin size={40} className="opacity-90 shrink-0" />
          <div className="text-left">
            <span className="block font-bold text-lg leading-tight uppercase">Catálogo Táchira, Mérida, Trujillo</span>
            <span className="text-sm opacity-80 font-medium">Consultar disponibilidad regional</span>
          </div>
        </button>
        
        <button className="bg-slate-700 hover:bg-slate-800 text-white rounded-xl shadow-sm p-4 sm:p-5 flex items-center justify-center gap-4 transition-colors">
          <Globe size={40} className="opacity-90 shrink-0" />
          <div className="text-left">
            <span className="block font-bold text-lg leading-tight uppercase">Otros Estados</span>
            <span className="text-sm opacity-80 font-medium">Consultar disponibilidad nacional</span>
          </div>
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider mb-4 border-l-4 border-emerald-500 pl-3">
          Estadísticas
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-6">
          <div className="xl:col-span-2 lg:col-span-2 min-h-[300px]">
             <VentasChart data={ventasUsuarios} />
          </div>
          <div className="xl:col-span-1 lg:col-span-1">
             <EstadisticasUsuarios data={ventasUsuarios} facturas={facturas} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Columna Izquierda / Principal (75%) */}
        <div className="xl:col-span-2 lg:col-span-2 space-y-6">
          
          {/* Filtro de Fechas */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h6 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
              Filtrar por fecha
            </h6>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Desde</label>
                <input 
                  type="date" 
                  value={fechaDesde} 
                  onChange={e => setFechaDesde(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="w-full sm:flex-1">
                <label className="block text-[0.65rem] font-bold text-slate-400 uppercase mb-1">Hasta</label>
                <input 
                  type="date" 
                  value={fechaHasta} 
                  onChange={e => setFechaHasta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleAplicarFiltro}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  OK
                </button>
                {(fechaDesde || fechaHasta) && (
                  <button 
                    onClick={handleLimpiarFiltro}
                    className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                    title="Limpiar filtros"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!loading && facturas.length > 0 && (
            <RankingStats facturas={facturas} />
          )}

          {loading ? (
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-slate-400">
               <Loader2 size={32} className="animate-spin mb-3" />
               <span className="font-medium text-sm">Cargando transferencias...</span>
             </div>
          ) : (
            <>
              {/* Tabla de Transferencias */}
              <TablaFacturasProv
                facturas={facturas}
                onVerDetalles={(factura) => setModalDetalles(factura)}
                onDescargarPDF={(factura) => generarPDFFactura(factura)}
                onDescargarExcel={(factura) => generarExcelFactura(factura)}
                onGenerarExcelGeneral={() => generarExcelTransferencias(facturas)}
              />

              {/* Notas de Crédito */}
              <TablaNotasCredito notas={notasCredito} />
            </>
          )}

        </div>

        {/* Columna Derecha / Sidebar (25%) */}
        <div className="xl:col-span-1 lg:col-span-1">
          <GestionStocks 
            productosVendidos={productosVendidos} 
            stockAlmacenes={stockAlmacenes} 
          />
        </div>
      </div>

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

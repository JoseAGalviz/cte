import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { asArray } from '../../services/clientesService'
import { getCatalogo } from '../../services/catalogoService'
import { getPedidosPorUsuario, getTotalUnidades } from '../../services/pedidosService'

import BuscadorClientes from '../../components/visitador/BuscadorClientes'
import TablaFacturas from '../../components/visitador/TablaFacturas'
import ModalCatalogo from '../../components/visitador/ModalCatalogo'
import ModalProductos from '../../components/visitador/ModalProductos'
import ModalProforma from '../../components/visitador/ModalProforma'
import ModalComparativa from '../../components/visitador/ModalComparativa'

import { ShoppingCart, Tags, BarChart2, Loader2, AlertCircle, ArrowRight, X } from 'lucide-react'

export default function VisitadorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const segmentos  = asArray(user?.segmento)
  const proveedores = user?.proveedor
  const precios    = asArray(user?.catalogo)

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [pedidos,        setPedidos]        = useState([])
  const [loadingPedidos, setLoadingPedidos] = useState(true)
  const [errorPedidos,   setErrorPedidos]   = useState('')
  const [loadingCatalogo, setLoadingCatalogo] = useState(null)

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const [modalCatalogo,    setModalCatalogo]    = useState(null)
  const [modalProductos,   setModalProductos]   = useState(null)
  const [modalProforma,    setModalProforma]    = useState(null)
  const [modalComparativa, setModalComparativa] = useState(null)

  const fetchPedidos = (fDesde = null, fHasta = null) => {
    if (!user?.user) return
    setLoadingPedidos(true)
    setErrorPedidos('')
    getPedidosPorUsuario(user.user, fDesde, fHasta)
      .then(data => setPedidos(Array.isArray(data) ? data : []))
      .catch(err  => setErrorPedidos(err.message))
      .finally(() => setLoadingPedidos(false))
  }

  useEffect(() => {
    fetchPedidos()
  }, [user?.user])

  const handleConsultar = () => {
    fetchPedidos(fechaDesde, fechaHasta)
  }

  const totalUnidades = getTotalUnidades(pedidos)

  const handleVerCatalogo = async (precioNum) => {
    setLoadingCatalogo(precioNum)
    try {
      const data = await getCatalogo(proveedores, clienteSeleccionado, precioNum)
      setModalCatalogo({ data: Array.isArray(data) ? data : [], precioNum })
    } catch (err) {
      alert(`Error al cargar catálogo: ${err.message}`)
    } finally {
      setLoadingCatalogo(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Fila superior ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Panel Nuevo Pedido */}
        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col relative">
          {/* Borde verde izquierdo */}
          <div className="absolute w-2 bg-[#16a34a] h-full left-0 top-0 rounded-l-2xl" />

          <div className="pl-3 flex flex-col h-full">
            {/* Título */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[0.65rem] font-black tracking-widest text-[#16a34a] uppercase mb-1">
                  Iniciar Operación
                </p>
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none">
                  Nuevo Pedido
                </h2>
              </div>
              <ShoppingCart size={52} className="text-gray-100 hidden sm:block" />
            </div>

            {/* Buscador */}
            <BuscadorClientes
              segmentos={segmentos}
              onClienteSeleccionado={setClienteSeleccionado}
            />

            {clienteSeleccionado && (
              <p className="mt-2 text-xs text-[#16a34a] font-semibold">
                ✓ {clienteSeleccionado.cli_des || clienteSeleccionado.nombre || clienteSeleccionado.co_cli}
              </p>
            )}

            {/* Catálogo + botón — empuja al fondo */}
            <div className="mt-auto pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              {precios.length > 0 ? (
                <div>
                  <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Descargar Catálogo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {precios.map(precio => (
                      <button
                        key={precio}
                        onClick={() => handleVerCatalogo(precio)}
                        disabled={loadingCatalogo === precio}
                        className="bg-white border-2 border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-white font-bold py-2 px-4 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {loadingCatalogo === precio
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Tags size={14} />}
                        Precio {precio}
                      </button>
                    ))}
                  </div>
                </div>
              ) : <div />}

              <button
                disabled={!clienteSeleccionado}
                onClick={() => navigate('/visitador/nuevo-pedido', { state: { cliente: clienteSeleccionado } })}
                className="w-full sm:w-auto bg-gray-900 hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 px-7 rounded-xl transition-all flex justify-center items-center gap-3 uppercase tracking-widest text-sm shadow-md border-2 border-gray-900 cursor-pointer"
              >
                Realizar Pedido
                <ArrowRight size={18} className="text-[#16a34a]" />
              </button>
            </div>
          </div>
        </section>

        {/* Panel Unidades Vendidas */}
        <section className="lg:w-64 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-[0.04]">
            <BarChart2 size={130} className="text-gray-900" />
          </div>
          <p className="text-xs font-black tracking-widest text-gray-400 uppercase text-center mb-3">
            Unidades Vendidas
          </p>
          <div className="text-7xl font-black text-gray-900 tracking-tighter leading-none">
            {loadingPedidos
              ? <Loader2 size={44} className="animate-spin text-gray-300" />
              : totalUnidades.toLocaleString('es-ES')}
          </div>
          <span className="mt-4 text-[0.6rem] font-bold text-[#16a34a] uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full border border-green-200">
            En facturas mostradas
          </span>
        </section>
      </div>

      {/* ── Filtro de Consulta (Servidor) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
            <BarChart2 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Consulta Histórica</h3>
            <p className="text-[0.65rem] text-slate-400 font-bold uppercase italic">Filtra facturas directamente desde el servidor</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase">Desde:</span>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={e => setFechaDesde(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 p-0 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <span className="text-[0.6rem] font-black text-slate-400 uppercase">Hasta:</span>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={e => setFechaHasta(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:ring-0 p-0 outline-none"
            />
          </div>
          <button
            onClick={handleConsultar}
            disabled={loadingPedidos}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-6 rounded-xl text-[0.65rem] uppercase tracking-[0.2em] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loadingPedidos ? <Loader2 size={14} className="animate-spin" /> : 'Consultar'}
          </button>
          {(fechaDesde || fechaHasta) && (
            <button
               onClick={() => { setFechaDesde(''); setFechaHasta(''); fetchPedidos(); }}
               className="text-slate-400 hover:text-red-500 p-2 transition-colors"
               title="Limpiar filtros"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla facturas ── */}
      {loadingPedidos ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
            <span className="text-sm">Cargando facturas...</span>
          </div>
        </div>
      ) : errorPedidos ? (
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{errorPedidos}</span>
        </div>
      ) : (
        <TablaFacturas
          pedidos={pedidos}
          onVerProductos={(productos, infoProffit) => setModalProductos({ productos, infoProffit })}
          onVerProforma={pedido => setModalProforma(pedido)}
          onVerComparativa={pedido => setModalComparativa(pedido)}
        />
      )}

      {/* ── Modales ── */}
      {modalCatalogo && (
        <ModalCatalogo
          data={modalCatalogo.data}
          precioNum={modalCatalogo.precioNum}
          onClose={() => setModalCatalogo(null)}
        />
      )}
      {modalProductos && (
        <ModalProductos
          productos={modalProductos.productos}
          infoProffit={modalProductos.infoProffit}
          onClose={() => setModalProductos(null)}
        />
      )}
      {modalProforma && (
        <ModalProforma
          pedido={modalProforma}
          onClose={() => setModalProforma(null)}
        />
      )}
      {modalComparativa && (
        <ModalComparativa
          pedido={modalComparativa}
          onClose={() => setModalComparativa(null)}
        />
      )}
    </div>
  )
}

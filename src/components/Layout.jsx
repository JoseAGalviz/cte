import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Menu, X, LogOut, ChevronRight, User,
  Home, Package, ShoppingCart, Users, BarChart2,
  FileText, Truck, ClipboardList, Settings, DollarSign
} from 'lucide-react'

const roleConfig = {
  visitador: {
    label: 'Visitador',
    color: 'from-emerald-600 to-teal-700',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    nav: [
      { label: 'Dashboard', icon: Home, path: '/visitador' },
      { label: 'Mis Pedidos', icon: ClipboardList, path: '/visitador/pedidos' },
      { label: 'Nuevo Pedido', icon: ShoppingCart, path: '/visitador/nuevo-pedido' },
      { label: 'Clientes', icon: Users, path: '/visitador/clientes' },
      { label: 'Reportes', icon: BarChart2, path: '/visitador/reportes' },
    ]
  },
  proveedor: {
    label: 'Proveedor',
    color: 'from-violet-600 to-purple-700',
    lightColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
    badgeColor: 'bg-violet-100 text-violet-800',
    nav: [
      { label: 'Dashboard', icon: Home, path: '/proveedor' },
      { label: 'Mis Productos', icon: Package, path: '/proveedor/productos' },
      { label: 'Órdenes Recibidas', icon: FileText, path: '/proveedor/ordenes' },
      { label: 'Entregas', icon: Truck, path: '/proveedor/entregas' },
      { label: 'Facturación', icon: DollarSign, path: '/proveedor/facturacion' },
    ]
  },
  administrador: {
    label: 'Administrador',
    color: 'from-rose-600 to-red-700',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    badgeColor: 'bg-rose-100 text-rose-800',
    nav: [
      { label: 'Dashboard', icon: Home, path: '/administrador' },
      { label: 'Usuarios', icon: Users, path: '/administrador/usuarios' },
      { label: 'Pedidos', icon: ClipboardList, path: '/administrador/pedidos' },
      { label: 'Proveedores', icon: Truck, path: '/administrador/proveedores' },
      { label: 'Reportes', icon: BarChart2, path: '/administrador/reportes' },
      { label: 'Configuración', icon: Settings, path: '/administrador/configuracion' },
    ]
  },
  compras: {
    label: 'Compras',
    color: 'from-amber-500 to-orange-600',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    nav: [
      { label: 'Dashboard', icon: Home, path: '/compras' },
      { label: 'Órdenes de Compra', icon: ShoppingCart, path: '/compras/ordenes' },
      { label: 'Solicitudes', icon: FileText, path: '/compras/solicitudes' },
      { label: 'Proveedores', icon: Truck, path: '/compras/proveedores' },
      { label: 'Presupuesto', icon: DollarSign, path: '/compras/presupuesto' },
      { label: 'Reportes', icon: BarChart2, path: '/compras/reportes' },
    ]
  }
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const config = roleConfig[user?.rol] || roleConfig.visitador

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavItem = ({ item }) => {
    const Icon = item.icon
    const active = location.pathname === item.path
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 group ${
          active
            ? 'bg-white/20 text-white font-medium shadow-sm'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        {sidebarOpen && <span className="text-sm">{item.label}</span>}
        {sidebarOpen && active && <ChevronRight size={14} className="ml-auto" />}
      </Link>
    )
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-gradient-to-b ${config.color} ${mobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/20">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <Package size={16} className="text-white" />
        </div>
        {(sidebarOpen || mobile) && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">Centro de</p>
            <p className="text-white/80 text-xs">Transferencias</p>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-white/70 hover:text-white p-1 rounded"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        )}
      </div>

      {/* Role badge */}
      {(sidebarOpen || mobile) && (
        <div className="px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Módulo
          </span>
          <p className="text-white font-semibold mt-0.5">{config.label}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {config.nav.map(item => <NavItem key={item.path} item={item} />)}
      </nav>

      {/* User */}
      <div className="border-t border-white/20 p-3">
        <div className={`flex items-center gap-3 ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <User size={15} className="text-white" />
          </div>
          {(sidebarOpen || mobile) && (
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.user}</p>
              <p className="text-white/60 text-xs truncate">{user?.segmento || user?.rol}</p>
            </div>
          )}
          <button onClick={handleLogout} className="text-white/60 hover:text-white p-1 rounded shrink-0" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  const hideSidebar = user?.rol === 'visitador'

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar — oculto para visitador */}
      {!hideSidebar && (
        <div className="hidden lg:flex shrink-0 shadow-xl">
          <Sidebar />
        </div>
      )}

      {/* Mobile overlay — oculto para visitador */}
      {!hideSidebar && mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full shadow-2xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 shadow-sm">
          {!hideSidebar && (
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-slate-800 font-semibold text-base">Centro de Transferencias</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-700">{user?.user}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${config.badgeColor}`}>
                    {config.label}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors text-sm"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

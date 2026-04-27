import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'
import logo from '../assets/logo.png'

const roleConfig = {
  visitador:     { label: 'Visitador',     badgeColor: 'bg-emerald-100 text-emerald-800' },
  proveedor:     { label: 'Proveedor',     badgeColor: 'bg-violet-100 text-violet-800' },
  administrador: { label: 'Administrador', badgeColor: 'bg-rose-100 text-rose-800' },
  compras:       { label: 'Compras',       badgeColor: 'bg-amber-100 text-amber-800' },
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const config = roleConfig[user?.rol] || roleConfig.visitador

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 shadow-sm shrink-0">
        <div className="flex-1 flex items-center gap-3">
          <img src={logo} alt="Cristmedicals" className="h-10 w-auto" />
          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <p className="text-sm font-bold text-slate-800 leading-tight">Cristmedicals</p>
            <p className="text-xs text-slate-500 leading-tight">Centro de Transferencias</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shrink-0">
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
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  )
}

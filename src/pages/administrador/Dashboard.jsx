import { Users, ClipboardList, Truck, BarChart2, TrendingUp, AlertTriangle, CheckCircle, Eye, Settings, Plus } from 'lucide-react'

const stats = [
  { label: 'Usuarios activos', value: '47', change: '+4', icon: Users, color: 'bg-rose-500' },
  { label: 'Pedidos totales', value: '312', change: '+28%', icon: ClipboardList, color: 'bg-pink-500' },
  { label: 'Proveedores', value: '23', change: '+2', icon: Truck, color: 'bg-orange-500' },
  { label: 'Ventas totales', value: '$182K', change: '+18%', icon: TrendingUp, color: 'bg-red-500' },
]

const users = [
  { name: 'Carlos Ruiz', rol: 'visitador', email: 'c.ruiz@cte.com', status: 'Activo', lastLogin: 'Hoy' },
  { name: 'María González', rol: 'proveedor', email: 'm.gonzalez@cte.com', status: 'Activo', lastLogin: 'Ayer' },
  { name: 'Pedro Alves', rol: 'compras', email: 'p.alves@cte.com', status: 'Activo', lastLogin: 'Hoy' },
  { name: 'Ana Torres', rol: 'visitador', email: 'a.torres@cte.com', status: 'Inactivo', lastLogin: 'Hace 5 días' },
  { name: 'Luis Mora', rol: 'proveedor', email: 'l.mora@cte.com', status: 'Activo', lastLogin: 'Hoy' },
]

const roleBadge = {
  visitador: 'bg-emerald-100 text-emerald-700',
  proveedor: 'bg-violet-100 text-violet-700',
  compras: 'bg-amber-100 text-amber-700',
  administrador: 'bg-rose-100 text-rose-700',
}

const alerts = [
  { type: 'warning', msg: '3 pedidos sin atención por más de 48h', time: 'hace 1h' },
  { type: 'error', msg: 'Stock crítico en 5 productos del proveedor Norte', time: 'hace 3h' },
  { type: 'success', msg: 'Backup del sistema completado exitosamente', time: 'hace 5h' },
  { type: 'warning', msg: '2 usuarios con sesión expirada', time: 'Ayer' },
]

const alertIcon = {
  warning: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
  error: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  success: { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Administración</h2>
          <p className="text-slate-500 text-sm mt-0.5">Control total del sistema</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
            <Settings size={16} /> Configuración
          </button>
          <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Users table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Usuarios del sistema</h3>
            <button className="text-sm text-rose-600 hover:text-rose-700 font-medium">Gestionar</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Usuario</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Correo</th>
                  <th className="text-left px-5 py-3">Rol</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.email} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.lastLogin}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleBadge[u.rol]}`}>{u.rol}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Activo' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span className="text-xs text-slate-500">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-slate-400 hover:text-slate-600"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Alertas del sistema</h3>
          <div className="space-y-3">
            {alerts.map((a, i) => {
              const cfg = alertIcon[a.type]
              const Icon = cfg.icon
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg ${cfg.color.split(' ')[1]}`}>
                  <Icon size={16} className={`shrink-0 mt-0.5 ${cfg.color.split(' ')[0]}`} />
                  <div>
                    <p className="text-sm text-slate-700 leading-tight">{a.msg}</p>
                    <p className="text-xs text-slate-400 mt-1">{a.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

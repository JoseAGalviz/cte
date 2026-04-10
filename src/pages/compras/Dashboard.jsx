import { ShoppingCart, FileText, Truck, DollarSign, TrendingUp, Clock, CheckCircle, Plus, Eye, AlertCircle } from 'lucide-react'

const stats = [
  { label: 'Órdenes activas', value: '19', change: '+6%', icon: ShoppingCart, color: 'bg-amber-500' },
  { label: 'Solicitudes pend.', value: '7', change: '+2', icon: FileText, color: 'bg-orange-500' },
  { label: 'Proveedores activos', value: '23', change: '+1', icon: Truck, color: 'bg-yellow-600' },
  { label: 'Presupuesto usado', value: '68%', change: '$136K', icon: DollarSign, color: 'bg-red-500' },
]

const purchaseOrders = [
  { id: 'OC-501', supplier: 'Distribuidora Central', date: '09/04/2026', total: '$12,400', status: 'Aprobada', priority: 'Alta' },
  { id: 'OC-502', supplier: 'Importadora Sur', date: '08/04/2026', total: '$5,800', status: 'Pendiente', priority: 'Media' },
  { id: 'OC-503', supplier: 'Proveedor Norte SAC', date: '07/04/2026', total: '$9,100', status: 'En tránsito', priority: 'Alta' },
  { id: 'OC-504', supplier: 'Global Supplies', date: '06/04/2026', total: '$3,200', status: 'Recibida', priority: 'Baja' },
  { id: 'OC-505', supplier: 'Distribuidora Central', date: '05/04/2026', total: '$7,600', status: 'Aprobada', priority: 'Media' },
]

const statusBadge = {
  'Aprobada': 'bg-emerald-100 text-emerald-700',
  'Pendiente': 'bg-amber-100 text-amber-700',
  'En tránsito': 'bg-blue-100 text-blue-700',
  'Recibida': 'bg-slate-100 text-slate-600',
}

const priorityBadge = {
  'Alta': 'bg-red-100 text-red-600',
  'Media': 'bg-amber-100 text-amber-600',
  'Baja': 'bg-green-100 text-green-600',
}

const budget = [
  { category: 'Insumos', used: 45000, total: 60000 },
  { category: 'Equipos', used: 28000, total: 40000 },
  { category: 'Servicios', used: 18000, total: 30000 },
  { category: 'Logística', used: 12000, total: 20000 },
]

export default function ComprasDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Compras</h2>
          <p className="text-slate-500 text-sm mt-0.5">Gestión de órdenes de compra</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Nueva orden
        </button>
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
                <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">{s.change}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Orders table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Órdenes de compra</h3>
            <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">OC</th>
                  <th className="text-left px-5 py-3">Proveedor</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Prioridad</th>
                  <th className="text-left px-5 py-3">Total</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {purchaseOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-sm font-medium text-slate-700">{o.id}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{o.supplier}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityBadge[o.priority]}`}>{o.priority}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-700">{o.total}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge[o.status]}`}>{o.status}</span>
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

        {/* Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Presupuesto por categoría</h3>
          </div>

          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-amber-700">Presupuesto total</span>
              <span className="text-sm font-bold text-amber-700">$150K</span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '68%' }} />
            </div>
            <p className="text-xs text-amber-600 mt-1">$103K usados de $150K</p>
          </div>

          <div className="space-y-3">
            {budget.map(b => (
              <div key={b.category}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-600">{b.category}</span>
                  <span className="text-xs text-slate-400">${(b.used / 1000).toFixed(0)}K / ${(b.total / 1000).toFixed(0)}K</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${b.used / b.total > 0.8 ? 'bg-red-400' : 'bg-amber-500'}`}
                    style={{ width: `${(b.used / b.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

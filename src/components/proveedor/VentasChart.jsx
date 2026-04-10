import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

// Utilidad local para generar paleta de colores
const generatePaletteFor = (n) => {
  const base = ['#17a398', '#49AF4E', '#2d9cdb', '#f6b042', '#e5645d', '#9b59b6']
  if (n <= base.length) return base.slice(0, n)
  const out = []
  for (let i = 0; i < n; i++) out.push(base[i % base.length])
  return out
}

export default function VentasChart({ data }) {
  // data = [{ usuario: "Juan", total_unidades: 200 }, ...]
  
  // Transformar data para recharts
  const chartData = data?.map((item, i) => {
    const colors = generatePaletteFor(data.length)
    return {
      nombre: item.usuario || item.user || item.nombre || 'Desconocido',
      unidades: Number(item.total_unidades || item.total || 0),
      fill: colors[i]
    }
  }) || []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
          <TrendingUp size={18} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight text-muted">
          Ventas Mensuales
        </h3>
      </div>
      
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="nombre" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              tickFormatter={v => `${v} UND`}
            />
            <Tooltip 
              cursor={{ fill: '#f1f5f9' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="unidades" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

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

const BAR_MIN_WIDTH = 64

export default function VentasChart({ data }) {
  // data = [{ usuario: "Juan", total_unidades: 200 }, ...]

  const chartData = data?.map((item, i) => {
    const colors = generatePaletteFor(data.length)
    const unidades = Number(item.total_unidades || item.total || 0)
    return {
      nombre: item.usuario || item.user || item.nombre || 'Desconocido',
      unidades,
      fill: unidades === 0 ? '#ef4444' : colors[i]
    }
  }) || []

  const chartWidth = Math.max(500, chartData.length * BAR_MIN_WIDTH)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
          <TrendingUp size={18} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight text-muted">
          Ventas Mensuales
        </h3>
      </div>

      <div className="overflow-x-auto">
        <div style={{ width: chartWidth, height: 360 }}>
          <BarChart width={chartWidth} height={360} data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="nombre"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              interval={0}
              angle={-40}
              textAnchor="end"
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
        </div>
      </div>
    </div>
  )
}

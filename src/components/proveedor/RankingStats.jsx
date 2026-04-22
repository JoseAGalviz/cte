import { useMemo } from 'react'
import { Users, UserCheck, Package } from 'lucide-react'

function buildRanking(facturas, keyFn, labelFn, top = 10) {
  const map = {}
  facturas.forEach(f => {
    const key = keyFn(f)
    if (!key) return
    if (!map[key]) map[key] = { label: labelFn(f), count: 0, total: 0 }
    map[key].count += 1
    map[key].total += Number(f.tot_neto) || 0
  })
  return Object.values(map)
    .sort((a, b) => b.total - a.total)
    .slice(0, top)
}

function buildArticulosRanking(facturas, top = 10) {
  const map = {}
  facturas.forEach(f => {
    ;(f.articulos || []).forEach(a => {
      const key = a.co_art || a.art_des
      if (!key) return
      const label = a.art_des || a.co_art || '-'
      const qty = Number(a.total_art || a.cantidad || 0)
      if (!map[key]) map[key] = { label, count: 0, total: 0 }
      map[key].count += qty
      map[key].total += qty
    })
  })
  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, top)
}

function RankingCard({ title, icon: Icon, color, items, emptyMsg, mode = 'money' }) {
  const max = items[0]?.total || 1
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`${color.icon} p-2 rounded-lg`}>
          <Icon size={16} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight">{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">{emptyMsg}</p>
      ) : (
        <ol className="space-y-2.5">
          {items.map((item, i) => {
            const pct = Math.round((item.total / max) * 100)
            return (
              <li key={i} className="flex items-center gap-3">
                <span className={`text-[0.65rem] font-black w-5 text-center shrink-0 ${i === 0 ? color.first : i === 1 ? color.second : i === 2 ? color.third : 'text-slate-400'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5 gap-1">
                    <span className="text-xs font-semibold text-slate-700 truncate" title={item.label}>{item.label}</span>
                    {mode === 'units' ? (
                      <span className={`text-[0.65rem] font-black shrink-0 ${color.amount}`}>{item.count} uds.</span>
                    ) : (
                      <span className="text-[0.65rem] font-black text-slate-500 shrink-0">{item.count} fact.</span>
                    )}
                  </div>
                  {mode === 'money' && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[0.65rem] font-black shrink-0 ${color.amount}`}>
                        {item.total.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                      </span>
                    </div>
                  )}
                  {mode === 'units' && (
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                      <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default function RankingStats({ facturas = [] }) {
  const { clientes, transferencistas, articulos } = useMemo(() => ({
    clientes: buildRanking(
      facturas,
      f => f.co_cli,
      f => f.cli_des || f.co_cli || '-'
    ),
    transferencistas: buildRanking(
      facturas,
      f => f.co_us_in,
      f => f.co_us_in || '-'
    ),
    articulos: buildArticulosRanking(facturas),
  }), [facturas])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingCard
          title="Clientes con más ventas"
          icon={Users}
          color={{
            icon: 'bg-violet-100 text-violet-700',
            bar: 'bg-violet-500',
            amount: 'text-violet-700',
            first: 'text-amber-500',
            second: 'text-slate-500',
            third: 'text-orange-400',
          }}
          items={clientes}
          emptyMsg="Sin datos de clientes"
        />
        <RankingCard
          title="Transferencistas con más ventas"
          icon={UserCheck}
          color={{
            icon: 'bg-emerald-100 text-emerald-700',
            bar: 'bg-emerald-500',
            amount: 'text-emerald-700',
            first: 'text-amber-500',
            second: 'text-slate-500',
            third: 'text-orange-400',
          }}
          items={transferencistas}
          emptyMsg="Sin datos de transferencistas"
        />
      </div>
      <RankingCard
        title="Artículos con más rotación"
        icon={Package}
        mode="units"
        color={{
          icon: 'bg-amber-100 text-amber-700',
          bar: 'bg-amber-500',
          amount: 'text-amber-700',
          first: 'text-amber-500',
          second: 'text-slate-500',
          third: 'text-orange-400',
        }}
        items={articulos}
        emptyMsg="Sin datos de artículos"
      />
    </div>
  )
}

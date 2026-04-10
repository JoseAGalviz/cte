import { Users } from 'lucide-react'

export default function EstadisticasUsuarios({ data }) {
  const hasData = Array.isArray(data) && data.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
          <Users size={18} />
        </div>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight text-muted">
          Ventas por Usuario
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasData ? (
          <div className="bg-slate-50 text-slate-500 p-4 rounded-lg text-center text-sm">
            Sin datos de ventas por usuario.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm text-left align-middle border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 text-slate-500 font-semibold uppercase text-xs">Usuario</th>
                  <th className="py-2 text-slate-500 font-semibold uppercase text-xs text-right">Unidades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => {
                  const usuario = item.usuario || item.user || item.nombre || 'Desconocido'
                  const unidades = Number(item.total_unidades || item.total || 0)
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-medium text-slate-700">{usuario}</td>
                      <td className="py-2.5 text-right font-bold text-slate-800">{unidades}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

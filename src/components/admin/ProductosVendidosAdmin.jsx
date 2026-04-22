export default function ProductosVendidosAdmin({ proveedores = [] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 sticky top-4">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Productos Vendidos</h3>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {proveedores.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">Sin datos</p>
        ) : proveedores.map((p, i) => (
          <div key={i}>
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {p.prov_des || p.co_prov || 'Proveedor'}
              </span>
            </div>
            {(p.productos || []).length === 0 ? (
              <p className="px-4 py-2 text-xs text-slate-400">Sin productos</p>
            ) : (p.productos || []).map((prod, j) => (
              <div key={j} className="flex items-center justify-between px-4 py-2 border-b border-slate-50 hover:bg-slate-50 transition">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs text-slate-700 font-medium truncate">{prod.art_des || ''}</p>
                  <p className="text-[0.65rem] text-slate-400">{prod.co_art || ''}</p>
                </div>
                <span className="text-xs font-bold text-rose-600 whitespace-nowrap">
                  {Number(prod.total_vendido || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

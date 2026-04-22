import { useState, useEffect } from 'react'
import { X, Edit2, FileSpreadsheet, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { getUsuarios, editarUsuario } from '../../services/adminService'
import * as XLSX from 'xlsx'

const PAGE_SIZE = 12

const ROL_BADGE = {
  visitador: 'bg-emerald-100 text-emerald-700',
  proveedor: 'bg-violet-100 text-violet-700',
  compras: 'bg-amber-100 text-amber-700',
  administrador: 'bg-rose-100 text-rose-700',
}

export default function ModalEditarUsuarios({ onClose }) {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState(null)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (e) {
      setMsg({ tipo: 'error', texto: 'Error cargando usuarios' })
    } finally {
      setLoading(false)
    }
  }

  function abrirEditor(u) {
    setEditando(u.id)
    setForm({
      id: String(u.id),
      userId: String(u.id),
      user: u.user || '',
      rol: u.rol || '',
      telefono: u.telefono || '',
      estado: u.estado || '',
      segmento: u.segmento || '',
      proveedor: u.proveedor || '',
      password: '',
    })
    setMsg(null)
  }

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setMsg(null)
    try {
      await editarUsuario(form)
      setMsg({ tipo: 'ok', texto: 'Usuario actualizado correctamente' })
      setEditando(null)
      await cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message || 'Error al guardar' })
    } finally {
      setGuardando(false)
    }
  }

  function exportar() {
    const rows = [
      ['#', 'Usuario', 'Contraseña', 'Rol', 'Teléfono', 'Estado', 'Segmento', 'Proveedor', 'Status', 'Fecha', 'Catálogo'],
      ...usuarios.map(u => [u.id, u.user, u.password, u.rol, u.telefono, u.estado, u.segmento, u.proveedor, u.status, u.fecha, u.catalogo]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = rows[0].map(h => ({ wch: Math.max(String(h).length + 4, 14) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios')
    XLSX.writeFile(wb, 'usuarios_admin.xlsx')
  }

  const totalPags = Math.max(1, Math.ceil(usuarios.length / PAGE_SIZE))
  const slice = usuarios.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Gestión de Usuarios</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={exportar}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
            >
              <FileSpreadsheet size={13} /> Exportar
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mensaje */}
        {msg && (
          <div className={`mx-6 mt-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
            msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {msg.texto}
          </div>
        )}

        {/* Formulario editor */}
        {editando !== null && (
          <form onSubmit={guardar} className="px-6 pt-4 pb-2 bg-rose-50 border-b border-rose-100">
            <p className="text-xs font-bold text-rose-600 uppercase mb-3">Editando usuario #{editando}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { key: 'user', label: 'Usuario' },
                { key: 'rol', label: 'Rol' },
                { key: 'telefono', label: 'Teléfono' },
                { key: 'estado', label: 'Estado' },
                { key: 'segmento', label: 'Segmento' },
                { key: 'proveedor', label: 'Proveedor' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[0.65rem] font-bold text-slate-500 uppercase mb-1">{label}</label>
                  <input
                    value={form[key] || ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[0.65rem] font-bold text-slate-500 uppercase mb-1">Nueva Clave</label>
                <input
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  value={form.password || ''}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition disabled:opacity-50"
              >
                <Save size={14} /> {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}

        {/* Tabla */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <p className="text-center text-slate-400 text-sm py-12">Cargando usuarios...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Contraseña</th>
                  <th className="text-left px-4 py-3 font-medium">Rol</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Estado</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Segmento</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Proveedor</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {slice.map(u => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition ${editando === u.id ? 'bg-rose-50' : ''}`}>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{u.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-xs font-bold text-rose-600 shrink-0">
                          {String(u.user || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{u.user}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs hidden md:table-cell">{u.password}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROL_BADGE[u.rol] || 'bg-slate-100 text-slate-600'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 hidden lg:table-cell">{u.telefono}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden lg:table-cell">{u.estado}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden xl:table-cell">{u.segmento}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden xl:table-cell truncate max-w-[120px]">{u.proveedor}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.status === 'A' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.status === 'A' ? 'Activo' : u.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs hidden xl:table-cell whitespace-nowrap">{u.fecha}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => abrirEditor(u)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginador */}
        {totalPags > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{usuarios.length} usuarios — pág. {pagina}/{totalPags}</span>
            <div className="flex gap-1">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 transition">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPagina(p => Math.min(totalPags, p + 1))} disabled={pagina === totalPags} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 transition">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

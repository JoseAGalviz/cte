import { useState, useEffect, useRef } from 'react'
import { UserPlus, AlertCircle, Check, Loader2, X, Search } from 'lucide-react'
import { api } from '../../services/api'

const VENEZUELA_STATES = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Distrito Capital','Falcón','Guárico','Lara',
  'Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre',
  'Táchira','Trujillo','La Guaira','Yaracuy','Zulia',
]

const CATALOGOS = [
  { value: '1', label: 'Precio 1' },
  { value: '2', label: 'Precio 2' },
  { value: '3', label: 'Precio 3' },
  { value: '4', label: 'Precio 4' },
]

function MultiSelect({ label, options, value, onChange, loading = false, searchable = false }) {
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  const toggle = (v) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }
  const remove = (v, e) => {
    e.stopPropagation()
    onChange(value.filter(x => x !== v))
  }

  const filtered = searchable && query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const selectedLabels = options.filter(o => value.includes(o.value))

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-brand">{label}</label>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selectedLabels.map(opt => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 bg-brand text-white text-xs px-2 py-1 rounded-md"
            >
              {opt.label}
              <button type="button" onClick={(e) => remove(opt.value, e)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border border-slate-200 rounded-[10px] overflow-hidden">
        {searchable && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}>
                <X size={12} className="text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        )}
        <div className="max-h-40 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-slate-400 text-sm gap-2">
              <Loader2 size={14} className="animate-spin" /> Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-slate-400 text-sm py-3 text-center">Sin resultados</p>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors border-b border-slate-100 last:border-0 ${
                  value.includes(opt.value)
                    ? 'bg-brand-light text-brand font-medium'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 transition-colors ${
                  value.includes(opt.value)
                    ? 'bg-brand border-brand'
                    : 'border-slate-300'
                }`}>
                  {value.includes(opt.value) && <Check size={10} className="text-white" />}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const inputClass =
  'w-full px-4 py-2.5 border border-slate-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition'

const labelClass = 'block text-sm font-medium mb-1.5 text-brand'

const EMPTY_FORM = {
  usuario: '', password: '', telefono: '', estado: '',
  catalogo: [], segmento: [], proveedor: [],
}

export default function CrearUsuario() {
  const [rol, setRol] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [proveedores, setProveedores] = useState([])
  const [segmentos, setSegmentos] = useState([])
  const [loadingProv, setLoadingProv] = useState(false)
  const [loadingSeg, setLoadingSeg] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (rol === 'visitador' || rol === 'proveedor') {
      setLoadingProv(true)
      api.get('/proveedores')
        .then(data => {
          const arr = Array.isArray(data) ? data : (data?.data || [])
          setProveedores(arr.map(p => ({
            value: String(p.co_prov),
            label: String(p.prov_des || p.co_prov).replace(/"/g, '').trim(),
          })))
        })
        .catch(() => setProveedores([]))
        .finally(() => setLoadingProv(false))
    }
    if (rol === 'visitador') {
      setLoadingSeg(true)
      fetch('https://98.94.185.164.nip.io/api/clientes/segmentos')
        .then(r => r.json())
        .then(data => {
          const arr = Array.isArray(data) ? data : []
          setSegmentos(arr.map(s => ({ value: String(s.co_seg), label: s.seg_des })))
        })
        .catch(() => setSegmentos([]))
        .finally(() => setLoadingSeg(false))
    }
  }, [rol])

  const handleRolChange = (e) => {
    setRol(e.target.value)
    setForm(EMPTY_FORM)
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if ((rol === 'visitador' || rol === 'proveedor') && form.proveedor.length === 0) {
      setError('Selecciona al menos un proveedor.')
      return
    }
    if (rol === 'visitador' && form.catalogo.length === 0) {
      setError('Selecciona al menos un tipo de catálogo.')
      return
    }
    if (rol === 'visitador' && form.segmento.length === 0) {
      setError('Selecciona al menos un segmento.')
      return
    }

    setLoading(true)

    const payload = { rol, usuario: form.usuario, password: form.password }
    if (rol === 'proveedor' || rol === 'visitador') payload.telefono = form.telefono
    if (rol === 'visitador') {
      payload.catalogo = form.catalogo
      payload.estado = form.estado
      payload.segmento = form.segmento
      payload.proveedor = form.proveedor
    }
    if (rol === 'proveedor') payload.proveedor = form.proveedor

    try {
      await api.post('/registrar-usuario', payload)
      setSuccess(true)
      setRol('')
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-[18px] shadow-lg overflow-hidden border-0">

        {/* Header negro */}
        <div className="bg-black px-6 py-4 flex items-center gap-2">
          <UserPlus size={20} className="text-white" />
          <h2 className="text-white font-semibold text-lg tracking-wide">Registro de Usuario</h2>
        </div>

        <div className="p-6">
          {success && (
            <div className="flex items-center gap-2 bg-brand-light border border-brand text-brand px-4 py-3 rounded-lg mb-5 text-sm">
              <Check size={16} className="shrink-0" />
              Usuario registrado correctamente.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Rol */}
            <div>
              <label className={labelClass}>Rol</label>
              <select
                required
                value={rol}
                onChange={handleRolChange}
                className={inputClass + ' bg-white'}
              >
                <option value="">Seleccione un rol</option>
                <option value="administrador">Administrador</option>
                <option value="proveedor">Proveedor</option>
                <option value="visitador">Visitador</option>
                <option value="compras">Compras</option>
              </select>
            </div>

            {rol && (
              <>
                {/* ── administrador / compras: usuario | password ── */}
                {(rol === 'administrador' || rol === 'compras') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Usuario</label>
                      <input type="text" required value={form.usuario}
                        onChange={e => setForm({ ...form, usuario: e.target.value })}
                        className={inputClass} placeholder="Nombre de usuario" />
                    </div>
                    <div>
                      <label className={labelClass}>Contraseña</label>
                      <input type="password" required value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className={inputClass} placeholder="••••••••" />
                    </div>
                  </div>
                )}

                {/* ── proveedor: usuario|password → telefono|proveedor ── */}
                {rol === 'proveedor' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Usuario</label>
                        <input type="text" required value={form.usuario}
                          onChange={e => setForm({ ...form, usuario: e.target.value })}
                          className={inputClass} placeholder="Nombre de usuario" />
                      </div>
                      <div>
                        <label className={labelClass}>Contraseña</label>
                        <input type="password" required value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          className={inputClass} placeholder="••••••••" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Teléfono</label>
                        <input type="tel" required value={form.telefono}
                          onChange={e => setForm({ ...form, telefono: e.target.value })}
                          className={inputClass} placeholder="0414-0000000" />
                      </div>
                      <MultiSelect
                        label="Proveedor"
                        options={proveedores}
                        value={form.proveedor}
                        onChange={v => setForm({ ...form, proveedor: v })}
                        loading={loadingProv}
                        searchable
                      />
                    </div>
                  </>
                )}

                {/* ── visitador: usuario|password → catalogo|telefono → estado|segmento → proveedor ── */}
                {rol === 'visitador' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Usuario</label>
                        <input type="text" required value={form.usuario}
                          onChange={e => setForm({ ...form, usuario: e.target.value })}
                          className={inputClass} placeholder="Nombre de usuario" />
                      </div>
                      <div>
                        <label className={labelClass}>Contraseña</label>
                        <input type="password" required value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          className={inputClass} placeholder="••••••••" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MultiSelect
                        label="Tipo de Catálogo"
                        options={CATALOGOS}
                        value={form.catalogo}
                        onChange={v => setForm({ ...form, catalogo: v })}
                      />
                      <div>
                        <label className={labelClass}>Teléfono</label>
                        <input type="tel" required value={form.telefono}
                          onChange={e => setForm({ ...form, telefono: e.target.value })}
                          className={inputClass} placeholder="0414-0000000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Estado</label>
                        <select required value={form.estado}
                          onChange={e => setForm({ ...form, estado: e.target.value })}
                          className={inputClass + ' bg-white'}
                        >
                          <option value="">Selecciona un estado</option>
                          {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <MultiSelect
                        label="Segmentos"
                        options={segmentos}
                        value={form.segmento}
                        onChange={v => setForm({ ...form, segmento: v })}
                        loading={loadingSeg}
                        searchable
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <MultiSelect
                        label="Proveedores"
                        options={proveedores}
                        value={form.proveedor}
                        onChange={v => setForm({ ...form, proveedor: v })}
                        loading={loadingProv}
                      />
                      <div />
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-[10px] transition text-sm tracking-wide"
                  >
                    {loading
                      ? <Loader2 size={16} className="animate-spin" />
                      : <UserPlus size={16} />
                    }
                    {loading ? 'Registrando...' : 'Registrar'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Package, Eye, EyeOff, UserPlus, AlertCircle, Check } from 'lucide-react'

const ROLES = [
  { value: 'visitador', label: 'Visitador', desc: 'Gestión de pedidos y clientes', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'proveedor', label: 'Proveedor', desc: 'Gestión de productos y entregas', color: 'border-violet-400 bg-violet-50 text-violet-700' },
  { value: 'administrador', label: 'Administrador', desc: 'Control total del sistema', color: 'border-rose-400 bg-rose-50 text-rose-700' },
  { value: 'compras', label: 'Compras', desc: 'Gestión de órdenes y proveedores', color: 'border-amber-400 bg-amber-50 text-amber-700' },
]

const roleRoutes = {
  visitador: '/visitador',
  proveedor: '/proveedor',
  administrador: '/administrador',
  compras: '/compras',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', rol: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.rol) return setError('Selecciona un tipo de usuario')
    if (form.password !== form.confirmPassword) return setError('Las contraseñas no coinciden')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = await register(form.name, form.email, form.password, form.rol)
    setLoading(false)
    if (result.success) {
      navigate(roleRoutes[result.user.rol])
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4 shadow-lg">
            <Package size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Centro de Transferencias</h1>
          <p className="text-slate-400 mt-1 text-sm">Crea tu cuenta para acceder al sistema</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Crear cuenta</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repite la contraseña"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition pr-10"
                  />
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de usuario</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(roleItem => (
                  <button
                    key={roleItem.value}
                    type="button"
                    onClick={() => setForm({ ...form, rol: roleItem.value })}
                    className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                      form.rol === roleItem.value
                        ? roleItem.color + ' border-2'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-sm">{roleItem.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{roleItem.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-slate-700 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

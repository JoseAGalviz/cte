import { createContext, useContext, useState } from 'react'
import { loginUsuario } from '../services/authService'

const AuthContext = createContext(null)

const SESSION_KEY = 'cte_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  /**
   * Guarda todos los datos del usuario devueltos por la API
   * para que estén disponibles en cualquier parte del sistema.
   */
  const login = async (usuario, password) => {
    const data = await loginUsuario(usuario, password)

    const session = {
      user: data.user,
      rol: data.rol,
      telefono: data.telefono,
      estado: data.estado,
      segmento: data.segmento,
      proveedor: data.proveedor,
      status: data.status,
      fecha: data.fecha,
      catalogo: data.catalogo,
    }

    setUser(session)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))

    return session
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const register = async (name, email, password, rol) => {
    // Placeholder para registro ya que el servicio aún no está implementado
    console.log('Registering user:', { name, email, password, rol })
    return { success: true, user: { name, email, rol } }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

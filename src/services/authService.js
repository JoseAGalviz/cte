import { api } from './api'

/**
 * Login de usuario
 * POST /login-usuario
 * Body: { usuario, password }
 *
 * Respuesta exitosa:
 * {
 *   user: string,
 *   rol: 'administrador' | 'visitador' | 'proveedor' | 'compras',
 *   telefono: string,
 *   estado: string,
 *   segmento: string,
 *   proveedor: string,
 *   status: string,  // 'A' = activo
 *   fecha: string,
 *   catalogo: string
 * }
 */
export async function loginUsuario(usuario, password) {
  const data = await api.post('/login-usuario', { usuario, password })
  return data
}

import { api } from './api'

/**
 * Obtiene clientes filtrados por segmento
 * POST /clientes
 * Body: { co_seg, co_segs, q?, rif?, nit? }
 */
export async function getClientes(segmentos, query = null) {
  const co_segs = asArray(segmentos)
  const co_seg = co_segs.join(',')

  const body = { co_seg, co_segs }

  if (query) {
    body.q = query
    if (/[A-Za-z]/.test(query)) body.rif = query
    else body.nit = query
  }

  return api.post('/clientes', body)
}

export function asArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string' && value.trim()) return value.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

export function getClienteNombre(cliente) {
  const nombre = cliente.cli_des || cliente.prov_des || cliente.nombre || cliente.razon_social
  if (nombre && nombre.trim()) return nombre.trim()
  return cliente.co_cli || cliente.co_cliente || cliente.codigo || cliente.rif || 'Desconocido'
}

export function getClienteCodigo(cliente) {
  return cliente.co_cli || cliente.co_cliente || cliente.codigo || ''
}

export function getClienteRif(cliente) {
  return cliente.rif || cliente.RIF || ''
}

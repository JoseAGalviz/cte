import { api } from './api'

export async function getTransferencias(startDate = null, endDate = null) {
  const payload = {}
  if (startDate) payload.startDate = startDate
  if (endDate) payload.endDate = endDate
  const res = await api.post('/facturas-campo5', payload)
  if (Array.isArray(res)) return res
  if (res?.rows) return res.rows
  return []
}

export async function getDetallePedido(factNum) {
  return api.post('/detalle-pedido-admin', { fact_num: factNum })
}

export async function getTransacciones(startDate = null, endDate = null) {
  const payload = {}
  if (startDate) payload.startDate = startDate
  if (endDate) payload.endDate = endDate
  const url = '/totalizar-deuda-proveedor'
  const res = Object.keys(payload).length
    ? await api.post(url, payload)
    : await api.get(url)
  if (Array.isArray(res)) return res
  if (res?.rows) return res.rows
  if (res?.data) return res.data
  return []
}

export async function getNotasCredito(startDate = null, endDate = null) {
  const payload = {}
  if (startDate) payload.startDate = startDate
  if (endDate) payload.endDate = endDate
  const res = await api.post('/notas-credito-transferencias', payload)
  if (Array.isArray(res)) return res
  if (res?.rows) return res.rows
  if (res?.data) return res.data
  return []
}

export async function getProductosVendidos(startDate = null, endDate = null) {
  const payload = { topPerProvider: 5 }
  if (startDate) payload.startDate = startDate
  if (endDate) payload.endDate = endDate
  const res = await api.post('/productos-mas-vendidos-campo5', payload)
  return Array.isArray(res) ? res : []
}

export async function getUsuarios() {
  const res = await api.get('/usuarios')
  return Array.isArray(res) ? res : []
}

export async function editarUsuario(payload) {
  return api.post('/usuarios/editar', payload)
}

export async function getTiemposPago() {
  const res = await api.get('/tiempos-pago-transferencias')
  return Array.isArray(res) ? res : []
}

export async function editarTiempoPago(payload) {
  return api.post('/tiempos-pago-transferencias/editar', payload)
}

export async function getPedidos(startDate = null, endDate = null) {
  if (startDate && endDate) {
    return api.post('/todos-pedidos', {
      startDate: startDate + ' 00:00:00',
      endDate: endDate + ' 23:59:59',
    })
  }
  return api.get('/todos-pedidos')
}

export async function getInconsistencias() {
  return api.post('/pedidos-inconsistencias', {})
}

export async function getProveedores() {
  const res = await api.get('/proveedores-profit')
  return Array.isArray(res) ? res : []
}

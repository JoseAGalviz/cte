import { api } from './api'

/**
 * Obtiene las facturas (transferencias) para el proveedor.
 * POST /transferencias/renglones-factura
 */
export async function getFacturasProveedor(codProv, fechaDesde = '', fechaHasta = '') {
  const payload = { cod_prov: codProv }
  if (fechaDesde) payload.startDate = fechaDesde
  if (fechaHasta) payload.endDate = fechaHasta

  const res = await api.post('/renglones-factura', payload)
  return res
}

/**
 * Obtiene el total de ventas por usuario para el proveedor.
 * POST /ventas-usuarios-proveedor
 */
export async function getVentasUsuarios(codProv) {
  const res = await api.post('/ventas-usuarios-proveedor', { cod_prov: codProv })
  return Array.isArray(res) ? res : (res?.data || [])
}

/**
 * Obtiene los productos más vendidos para el proveedor.
 * POST /productos-mas-vendidos
 */
export async function getProductosMasVendidos(codProv) {
  const res = await api.post('/productos-mas-vendidos', { cod_prov: codProv })
  return Array.isArray(res) ? res : (res?.data || [])
}

/**
 * Obtiene el stock por almacén para el proveedor.
 * GET /st-almac-proveedor?co_prov=xx
 */
export async function getStockAlmacenes(codProv) {
  const code = Array.isArray(codProv) ? codProv[0] : (codProv || '')
  if (!code) return []
  const res = await api.get(`/st-almac-proveedor?co_prov=${encodeURIComponent(code)}`)
  return Array.isArray(res) ? res : (res?.data || [])
}

/**
 * Obtiene las notas de crédito para el proveedor.
 * POST /buscar-notas-credito-proveedor-exacto
 */
export async function getNotasCredito(codProv) {
  const code = Array.isArray(codProv) ? codProv[0] : (codProv || '')
  if (!code) return []
  const res = await api.post('/buscar-notas-credito-proveedor-exacto', { proveedor: code })
  return Array.isArray(res) ? res : (res?.data || [])
}

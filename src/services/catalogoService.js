import { api } from './api'
import { asArray } from './clientesService'

/**
 * Obtiene catálogo de productos por proveedor y número de precio
 * POST /catalogo
 * Body: { co_prov, precio_num, proveedores }
 *
 * Respuesta: [{ descripcion, imagen, stock_barquisimeto, stock_tachira,
 *              Precio, descuento_por_art, descuento_por_categoria,
 *              descuento_por_linea, precio_venta }]
 */
export async function getCatalogo(proveedoresUsuario, cliente, precioNum) {
  const prArr = asArray(proveedoresUsuario)
  const provCliente = cliente?.co_prov || cliente?.proveedor

  const co_prov = provCliente
    ? String(provCliente).trim()
    : prArr.join(',')

  return api.post('/catalogo', {
    co_prov,
    precio_num: String(precioNum),
    proveedores: prArr,
  })
}

export function resolvePrecio(row) {
  return row.precio_venta ?? row.Precio ?? row.precio ?? row.PrecioUnit ?? ''
}

export function calcularPrecioNeto(row) {
  let t = parseFloat(resolvePrecio(row)) || 0
  if (!t) return 0
  const da = parseFloat(row.descuento_por_art) || 0
  if (da) t *= (1 - da / 100)
  const dc = parseFloat(row.descuento_por_categoria) || 0
  if (dc) t *= (1 - dc / 100)
  const dl = parseFloat(row.descuento_por_linea) || 0
  if (dl) t *= (1 - dl / 100)
  return t * 0.9
}

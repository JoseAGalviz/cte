import { api } from './api'

export async function getTiemposPago() {
  const raw = await api.get('/tiempos-pago')
  const arr = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : [])
  return arr.map(row => ({
    tiempo: row.tiempo ?? row.time ?? '',
    porcentaje: parseFloat(row.porcentaje ?? row.porc ?? row.percentage ?? 0) || 0,
    columna: row.columna ?? row.column ?? '',
  })).sort((a, b) => {
    const orden = { 'Columna 1': 1, 'Columna 2': 2, 'Columna 3': 3, 'Columna 4': 4, 'Columna 5': 5, 'Columna 6': 6 }
    return (orden[a.columna] ?? 99) - (orden[b.columna] ?? 99)
  })
}

export async function getClienteByRif(rif) {
  return api.post('/clientes', { rif })
}

export async function getTipoCliente(tip_cli) {
  return api.post('/tipo-cli', { tip_cli })
}

export async function enviarPedido(payload) {
  return api.post('/pedidos', payload)
}

/**
 * Obtiene pedidos/facturas del usuario visitador
 * POST /pedidos-por-usuario
 * Body: { user, fecha_desde?, fecha_hasta? }
 */
export async function getPedidosPorUsuario(user, fechaDesde = null, fechaHasta = null) {
  const payload = { user }
  if (fechaDesde) payload.fecha_desde = fechaDesde
  if (fechaHasta) payload.fecha_hasta = fechaHasta
  
  const response = await api.post('/pedidos-por-usuario', payload)
  
  // El endpoint ahora devuelve { filtro, pedidos } en lugar de un array directo
  if (response && response.pedidos && Array.isArray(response.pedidos)) {
    return response.pedidos
  }
  
  // Fallback para compatibilidad
  return Array.isArray(response) ? response : []
}

export function getPedidoFecha(pedido) {
  if (!pedido.fecha) return null
  const d = new Date(String(pedido.fecha).replace(' ', 'T'))
  if (isNaN(d)) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getPedidoCliente(pedido) {
  const cli = pedido.info_profit?.cliente || {}
  const fac = pedido.info_profit?.factura || {}
  
  // Prioridad: Nombre descriptivo de Profit > Nombre en el pedido > Rif/Codigo
  const nombre = cli.cli_des || pedido.cli_des || cli.nombre || cli.razon_social
  if (nombre && String(nombre).trim() && String(nombre).trim().toLowerCase() !== 'null') {
    return String(nombre).trim()
  }
  
  return (
    cli.co_cli || pedido.co_cli || fac.co_cli ||
    cli.cod_cliente || pedido.cod_cliente || fac.co_cliente ||
    cli.codigo || pedido.codigo || pedido.rif || 'Sin identificación'
  )
}

export function getPedidoDescuento(pedido) {
  const match = pedido.descrip?.match(/(\d+(\.\d+)?)%/)
  if (match) return `${match[1]}%`
  const n = Number(pedido.porc_gdesc)
  return n ? `${n.toFixed(2)}%` : '0%'
}

export function getPedidoSubtotal(pedido) {
  return parseFloat(pedido.tot_bruto || pedido.tot_brut || 0) || 0
}

export function getPedidoIVA(pedido) {
  return parseFloat(pedido.iva || 0) || 0
}

export function getPedidoSaldo(pedido) {
  return parseFloat(pedido.saldo || 0) || 0
}

export function getPedidoNeto(pedido) {
  return parseFloat(pedido.tot_neto || 0) || 0
}

export function getPedidoVendedor(pedido) {
  return pedido.co_us_in || '-'
}

export function getTotalUnidades(pedidos, filteredIndices = null) {
  let total = 0
  const indices = filteredIndices ?? pedidos.map((_, i) => i)
  indices.forEach(i => {
    const productos = pedidos[i]?.productos || []
    productos.forEach(p => { total += parseFloat(p.cantidad) || 0 })
  })
  return total
}

export function formatFecha(fecha) {
  if (!fecha) return ''
  return String(fecha).split('T')[0]
}

export function formatCurrency(v) {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) {
    const first = v.find(x => x !== null && x !== undefined)
    if (first === undefined) return ''
    v = first
  }
  const raw = String(v)
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean)
  const chosen = parts.length ? parts[0] : raw
  return `${chosen} $`
}

export function getPrecio(prod) {
  if (!prod || typeof prod !== 'object') return ''
  const tryKeys = ['prec_vta', 'precio', 'prec', 'precio_unitario', 'prec_vta_venta']
  for (const k of tryKeys) {
    if (prod[k] !== undefined && prod[k] !== null && String(prod[k]).trim() !== '') return prod[k]
  }
  return ''
}


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'

import VisitadorDashboard from './pages/visitador/Dashboard'
import NuevoPedido from './pages/visitador/NuevoPedido'
import ProveedorDashboard from './pages/proveedor/Dashboard'
import AdminDashboard from './pages/administrador/Dashboard'
import ComprasDashboard from './pages/compras/Dashboard'

const roleRoutes = {
  visitador: '/visitador',
  proveedor: '/proveedor',
  administrador: '/administrador',
  compras: '/compras',
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="text-4xl mb-3">🚧</div>
      <h3 className="text-xl font-semibold text-slate-700">{title}</h3>
      <p className="text-slate-400 text-sm mt-1">Esta sección está en desarrollo</p>
    </div>
  )
}

function RootRedirect() {
  const { user } = useAuth()
  if (user) return <Navigate to={roleRoutes[user.rol]} replace />
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Visitador */}
      <Route path="/visitador/*" element={
        <ProtectedRoute allowedRole="visitador">
          <Layout>
            <Routes>
              <Route index element={<VisitadorDashboard />} />
              <Route path="pedidos" element={<PlaceholderPage title="Mis Pedidos" />} />
              <Route path="nuevo-pedido" element={<NuevoPedido />} />
              <Route path="clientes" element={<PlaceholderPage title="Clientes" />} />
              <Route path="reportes" element={<PlaceholderPage title="Reportes" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Proveedor */}
      <Route path="/proveedor/*" element={
        <ProtectedRoute allowedRole="proveedor">
          <Layout>
            <Routes>
              <Route index element={<ProveedorDashboard />} />
              <Route path="productos" element={<PlaceholderPage title="Mis Productos" />} />
              <Route path="ordenes" element={<PlaceholderPage title="Órdenes Recibidas" />} />
              <Route path="entregas" element={<PlaceholderPage title="Entregas" />} />
              <Route path="facturacion" element={<PlaceholderPage title="Facturación" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Administrador */}
      <Route path="/administrador/*" element={
        <ProtectedRoute allowedRole="administrador">
          <Layout>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<PlaceholderPage title="Gestión de Usuarios" />} />
              <Route path="pedidos" element={<PlaceholderPage title="Pedidos" />} />
              <Route path="proveedores" element={<PlaceholderPage title="Proveedores" />} />
              <Route path="reportes" element={<PlaceholderPage title="Reportes del Sistema" />} />
              <Route path="configuracion" element={<PlaceholderPage title="Configuración" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Compras */}
      <Route path="/compras/*" element={
        <ProtectedRoute allowedRole="compras">
          <Layout>
            <Routes>
              <Route index element={<ComprasDashboard />} />
              <Route path="ordenes" element={<PlaceholderPage title="Órdenes de Compra" />} />
              <Route path="solicitudes" element={<PlaceholderPage title="Solicitudes" />} />
              <Route path="proveedores" element={<PlaceholderPage title="Proveedores" />} />
              <Route path="presupuesto" element={<PlaceholderPage title="Presupuesto" />} />
              <Route path="reportes" element={<PlaceholderPage title="Reportes de Compras" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.rol !== allowedRole) {
    return <Navigate to={`/${user.rol}`} replace />
  }

  return children
}

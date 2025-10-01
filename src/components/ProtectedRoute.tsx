import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'bakery';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isAdmin, isBakery } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Se não tiver dados do usuário ainda, aguardar
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dados do usuário...</span>
        </div>
      </div>
    );
  }

  // Verificar role específica se requerida
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/padaria/dashboard" replace />;
    }
    if (requiredRole === 'bakery' && !isBakery) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

// Componente específico para rotas de admin
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/login">
      {children}
    </ProtectedRoute>
  );
}

// Componente específico para rotas de padaria
export function BakeryRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="bakery" redirectTo="/login">
      {children}
    </ProtectedRoute>
  );
}






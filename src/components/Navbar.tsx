import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Don't show navbar on admin/padaria routes
  if (location.pathname.startsWith('/padaria') || 
      location.pathname === '/' || 
      location.pathname.startsWith('/participantes') ||
      location.pathname.startsWith('/padarias') ||
      location.pathname.startsWith('/sorteios') ||
      location.pathname.startsWith('/relatorios') ||
      location.pathname.startsWith('/configuracoes')) {
    return null;
  }

  const isApiAvailable = Boolean(import.meta.env.VITE_API_BASE);

  return (
    <>
      {!isApiAvailable && (
        <Alert className="border-warning/50 bg-warning/10">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Modo demonstração (sem API) - Use as credenciais: paoquente@exemplo.com / demo123
          </AlertDescription>
        </Alert>
      )}
      
      <nav className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <img 
              src="/src/assets/sindpan-logo.png" 
              alt="SINDPAN" 
              className="h-10 w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Olá, {user.bakery_name || user.email}
                </span>
                <Button variant="ghost" asChild>
                  <Link to="/perfil">Perfil</Link>
                </Button>
                <Button variant="outline" onClick={logout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/entrar">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link to="/cadastro">Cadastro</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
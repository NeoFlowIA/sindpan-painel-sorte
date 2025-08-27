import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, User, Mail, Building, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Perfil() {
  const { user, loading, logout, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !token) {
      navigate('/entrar');
    }
  }, [loading, token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'bakery':
        return 'Padaria';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default' as const;
      case 'bakery':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Informações da sua conta no sistema SINDPAN
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {user.bakery_name || user.email}
            </CardTitle>
            <CardDescription>
              <Badge variant={getRoleVariant(user.role)} className="mt-2">
                <Shield className="mr-1 h-3 w-3" />
                {getRoleLabel(user.role)}
                {user.role === 'admin' && ' (recursos em breve)'}
              </Badge>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">E-mail</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Função</p>
                  <p className="text-sm text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              {user.bakery_name && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Padaria</p>
                    <p className="text-sm text-muted-foreground">{user.bakery_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Criado em</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={logout} 
                variant="outline" 
                className="w-full"
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApiIntegrationInfo } from "@/components/ApiIntegrationInfo";

export function LoginPadaria() {
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, user } = useAuth();

  // Redirect if already authenticated
  if (user) {
    if (user.role === 'bakery') {
      navigate('/padaria/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cnpj || !senha) {
      return;
    }

    try {
      await login(cnpj, senha);
      
      // Navigate based on user role after successful login
      // The AuthContext will update the user state
      navigate("/padaria/dashboard");
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error('Login error:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-full shadow-lg">
              <ShoppingBag className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">Portal da Padaria</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho da sua padaria na campanha SINDPAN
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-foreground">
              Entrar
            </CardTitle>
            <CardDescription className="text-center">
              Acesse sua conta com CNPJ e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="ex.: 00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Link
                to="/padaria/esqueci-senha"
                className="text-sm text-primary hover:underline block"
              >
                Esqueci minha senha
              </Link>
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Link
                  to="/padaria/cadastro"
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre sua padaria
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Integration Info */}
        <ApiIntegrationInfo />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 SINDPAN - Sindicato das Indústrias de Panificação do Ceará</p>
        </div>
      </div>
    </div>
  );
}
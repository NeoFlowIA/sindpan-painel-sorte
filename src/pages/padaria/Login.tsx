import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Info, Loader2, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ApiIntegrationInfo } from "@/components/ApiIntegrationInfo";

export function LoginPadaria() {
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, user, setupBakeryAccess } = useAuth();
  const [isFirstAccessOpen, setIsFirstAccessOpen] = useState(false);
  const [firstAccessCnpj, setFirstAccessCnpj] = useState("");
  const [firstAccessPassword, setFirstAccessPassword] = useState("");
  const [firstAccessConfirmPassword, setFirstAccessConfirmPassword] = useState("");
  const [isSettingUpAccess, setIsSettingUpAccess] = useState(false);
  const [firstAccessError, setFirstAccessError] = useState<string | null>(null);

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

  const handleOpenFirstAccess = () => {
    setFirstAccessCnpj(cnpj);
    setFirstAccessPassword("");
    setFirstAccessConfirmPassword("");
    setFirstAccessError(null);
    setIsFirstAccessOpen(true);
  };

  const handleFirstAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFirstAccessError(null);

    const cnpjValue = firstAccessCnpj || cnpj;

    if (!cnpjValue) {
      setFirstAccessError("Informe o CNPJ da padaria.");
      return;
    }

    if (firstAccessPassword.length < 8) {
      setFirstAccessError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (firstAccessPassword !== firstAccessConfirmPassword) {
      setFirstAccessError("As senhas não coincidem.");
      return;
    }

    try {
      setIsSettingUpAccess(true);
      await setupBakeryAccess({ cnpj: cnpjValue, password: firstAccessPassword });
      setIsFirstAccessOpen(false);
      navigate("/padaria/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setFirstAccessError(error.message);
      } else {
        setFirstAccessError("Não foi possível concluir o primeiro acesso.");
      }
    } finally {
      setIsSettingUpAccess(false);
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
            <Alert className="mb-6">
              <ShieldCheck className="h-5 w-5" />
              <AlertTitle>Primeiro acesso da padaria</AlertTitle>
              <AlertDescription>
                <ol className="mt-3 list-decimal list-inside space-y-1 text-sm">
                  <li>Tenha o CNPJ da padaria em mãos.</li>
                  <li>Clique em <strong>Primeiro acesso</strong> para definir a sua senha.</li>
                  <li>Use o CNPJ e a nova senha para entrar no portal.</li>
                  <li>Em caso de dúvida, fale com o suporte do SINDPAN.</li>
                </ol>
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{14}"
                  placeholder="ex.: 00000000000000"
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

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleOpenFirstAccess}
              >
                Primeiro acesso
              </Button>
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Info className="h-4 w-4" aria-hidden="true" />
                <span>
                  Precisa de ajuda? {" "}
                  <a
                    href="mailto:contato@sindpan.org.br"
                    className="text-primary hover:underline"
                  >
                    Contate o suporte
                  </a>
                </span>
              </div>
            </div>

            <div className="mt-4 text-center space-y-2">
              <Link
                to="/padaria/esqueci-senha"
                className="text-sm text-primary hover:underline block"
              >
                Esqueci minha senha
              </Link>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isFirstAccessOpen} onOpenChange={setIsFirstAccessOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Primeiro acesso</DialogTitle>
              <DialogDescription>
                Informe o CNPJ da padaria e defina uma senha segura para habilitar o acesso ao portal.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleFirstAccess}>
              <div className="space-y-2">
                <Label htmlFor="first-access-cnpj">CNPJ da padaria</Label>
                <Input
                  id="first-access-cnpj"
                  value={firstAccessCnpj}
                  onChange={(event) => setFirstAccessCnpj(event.target.value)}
                  placeholder="Somente números"
                  inputMode="numeric"
                  pattern="[0-9]{14}"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-access-password">Nova senha</Label>
                <Input
                  id="first-access-password"
                  type="password"
                  value={firstAccessPassword}
                  onChange={(event) => setFirstAccessPassword(event.target.value)}
                  minLength={8}
                  placeholder="Mínimo de 8 caracteres"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-access-password-confirm">Confirmar senha</Label>
                <Input
                  id="first-access-password-confirm"
                  type="password"
                  value={firstAccessConfirmPassword}
                  onChange={(event) => setFirstAccessConfirmPassword(event.target.value)}
                  minLength={8}
                  placeholder="Repita a senha"
                  required
                />
              </div>
              {firstAccessError && (
                <p className="text-sm text-destructive" role="alert">
                  {firstAccessError}
                </p>
              )}
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsFirstAccessOpen(false)}
                  className="w-full sm:w-auto"
                  disabled={isSettingUpAccess}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSettingUpAccess}>
                  {isSettingUpAccess ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Definir senha"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
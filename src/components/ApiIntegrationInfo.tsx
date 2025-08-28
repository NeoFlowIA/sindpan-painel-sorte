import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Users, Shield } from "lucide-react";

export function ApiIntegrationInfo() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Globe className="w-5 h-5" />
          Integração API SINDPAN Auth
          <Badge className="bg-primary/10 text-primary border-primary/20">Ativo</Badge>
        </CardTitle>
        <CardDescription>
          Sistema integrado com autenticação SINDPAN para gestão segura de padarias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm">Autenticação JWT</h3>
              <p className="text-xs text-muted-foreground">
                Login seguro com tokens JWT para proteção de dados
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm">Cadastro Automático</h3>
              <p className="text-xs text-muted-foreground">
                Registro direto de padarias no sistema SINDPAN
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm">Controle de Acesso</h3>
              <p className="text-xs text-muted-foreground">
                Diferenciação automática entre admin e padarias
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Como usar:</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>1. Use o email e senha fornecidos pelo SINDPAN</p>
            <p>2. Padarias podem se cadastrar através do link "Cadastre sua padaria"</p>
            <p>3. Todas as informações ficam sincronizadas com o sistema central</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

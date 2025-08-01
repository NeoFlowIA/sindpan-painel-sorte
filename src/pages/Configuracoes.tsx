import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Calendar, Bot, Shield, DollarSign } from "lucide-react";

export default function Configuracoes() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Configurações da Campanha</h1>
            <p className="text-muted-foreground">Gerencie parâmetros e configurações do sistema</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            Salvar alterações
          </Button>
        </div>

        {/* Campaign Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Configurações da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Início</label>
                <Input type="date" defaultValue="2024-01-01" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Fim</label>
                <Input type="date" defaultValue="2024-03-31" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Ticket Médio Padrão</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="R$ 25,00" 
                  defaultValue="R$ 25,00"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valor padrão para padarias que não informaram ticket médio
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Termos e Condições</label>
              <Textarea 
                placeholder="Digite os termos e condições da campanha..."
                className="min-h-[100px]"
                defaultValue="Esta campanha promocional está sujeita aos seguintes termos e condições..."
              />
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp AI Assistant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Assistente IA WhatsApp
              <Badge className="bg-secondary text-secondary-foreground">Beta</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Ativar Assistente IA</h3>
                <p className="text-xs text-muted-foreground">
                  Resposta automática para dúvidas dos participantes via WhatsApp
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Número do WhatsApp</label>
                <Input 
                  type="text" 
                  placeholder="+55 85 9999-9999"
                  defaultValue="+55 85 3456-7890"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Horário de Funcionamento</label>
                <Input 
                  type="text" 
                  placeholder="08:00 - 18:00"
                  defaultValue="08:00 - 18:00"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem de Boas-vindas</label>
              <Textarea 
                placeholder="Mensagem automática de boas-vindas..."
                className="min-h-[80px]"
                defaultValue="Olá! Sou o assistente do SINDPAN. Como posso ajudar você com a campanha promocional?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Controle de Acesso
              <Badge variant="outline" className="text-primary border-primary">Admin</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium">Administrador Principal</h3>
                  <p className="text-xs text-muted-foreground">admin@sindpan.com.br</p>
                </div>
                <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium">Operador 1</h3>
                  <p className="text-xs text-muted-foreground">operador1@sindpan.com.br</p>
                </div>
                <Badge variant="outline">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium">Operador 2</h3>
                  <p className="text-xs text-muted-foreground">operador2@sindpan.com.br</p>
                </div>
                <Badge variant="outline">Ativo</Badge>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              Adicionar novo usuário
            </Button>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Versão do Sistema</h3>
                <p className="text-sm">v2.1.0</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                <p className="text-sm">15/01/2024 14:30</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tempo Online</h3>
                <p className="text-sm">15 dias, 8 horas</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status do Backup</h3>
                <p className="text-sm text-green-600">✓ Último backup: hoje às 02:00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Filter } from "lucide-react";

const reportTypes = [
  {
    title: "Relatório de Participação",
    description: "Lista completa de participantes e suas submissões",
    format: ".CSV",
    icon: FileText,
    color: "text-secondary"
  },
  {
    title: "Números Sorteados",
    description: "Histórico completo de todos os sorteios realizados",
    format: ".PDF", 
    icon: FileText,
    color: "text-primary"
  },
  {
    title: "Lista de Padarias",
    description: "Informações detalhadas das padarias participantes",
    format: ".XLSX",
    icon: FileText,
    color: "text-accent"
  }
];

export default function Relatorios() {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Relatórios</h1>
            <p className="text-muted-foreground">Exporte dados da campanha em diferentes formatos</p>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros para Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Início</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Data de Fim</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Padaria</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as padarias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as padarias</SelectItem>
                    <SelectItem value="central">Padaria Central</SelectItem>
                    <SelectItem value="dourado">Pão Dourado</SelectItem>
                    <SelectItem value="delicias">Delícias do Forno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Status dos Participantes</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Sorteio</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os sorteios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os sorteios</SelectItem>
                    <SelectItem value="weekly">Semanais</SelectItem>
                    <SelectItem value="monthly">Mensais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Types */}
        <div className="grid gap-6 md:grid-cols-3">
          {reportTypes.map((report, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                  {report.title}
                </CardTitle>
                <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground">
                  {report.format}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar {report.format}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Estatísticas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">1,834</div>
                <p className="text-sm text-muted-foreground">Cupons Validados</p>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <div className="text-2xl font-bold text-secondary">247</div>
                <p className="text-sm text-muted-foreground">Participantes Únicos</p>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <div className="text-2xl font-bold text-accent">23</div>
                <p className="text-sm text-muted-foreground">Padarias Ativas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">3</div>
                <p className="text-sm text-muted-foreground">Sorteios Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
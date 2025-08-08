import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Filter } from "lucide-react";

// Mock data for participation report
const mockParticipants = [
  {
    id: "001",
    nome: "Maria Silva Santos",
    cpf: "123.456.789-01",
    telefone: "(11) 98765-4321",
    email: "maria@email.com",
    padaria: "Padaria Central",
    dataRegistro: "2024-01-15",
    totalCupons: 12,
    cuponsValidados: 8,
    ultimaSubmissao: "2024-01-22",
    status: "Ativo"
  },
  {
    id: "002", 
    nome: "João Pereira Lima",
    cpf: "234.567.890-12",
    telefone: "(11) 99876-5432",
    email: "joao@email.com",
    padaria: "Pão Dourado",
    dataRegistro: "2024-01-16",
    totalCupons: 18,
    cuponsValidados: 15,
    ultimaSubmissao: "2024-01-23",
    status: "Ativo"
  },
  {
    id: "003",
    nome: "Ana Costa Oliveira", 
    cpf: "345.678.901-23",
    telefone: "(11) 97654-3210",
    email: "ana@email.com",
    padaria: "Delícias do Forno",
    dataRegistro: "2024-01-14",
    totalCupons: 25,
    cuponsValidados: 22,
    ultimaSubmissao: "2024-01-24",
    status: "Ativo"
  },
  {
    id: "004",
    nome: "Carlos Eduardo Santos",
    cpf: "456.789.012-34", 
    telefone: "(11) 96543-2109",
    email: "carlos@email.com",
    padaria: "Padaria Central",
    dataRegistro: "2024-01-17",
    totalCupons: 6,
    cuponsValidados: 4,
    ultimaSubmissao: "2024-01-20",
    status: "Inativo"
  },
  {
    id: "005",
    nome: "Fernanda Lima Costa",
    cpf: "567.890.123-45",
    telefone: "(11) 95432-1098", 
    email: "fernanda@email.com",
    padaria: "Pão Dourado",
    dataRegistro: "2024-01-18",
    totalCupons: 14,
    cuponsValidados: 11,
    ultimaSubmissao: "2024-01-21",
    status: "Ativo"
  }
];

const generateParticipationCSV = () => {
  const headers = [
    "ID",
    "Nome Completo",
    "CPF", 
    "Telefone",
    "Email",
    "Padaria",
    "Data Registro",
    "Total Cupons",
    "Cupons Validados", 
    "Última Submissão",
    "Status"
  ];
  
  const csvContent = [
    headers.join(","),
    ...mockParticipants.map(p => [
      p.id,
      `"${p.nome}"`,
      p.cpf,
      p.telefone,
      p.email,
      `"${p.padaria}"`,
      p.dataRegistro,
      p.totalCupons,
      p.cuponsValidados,
      p.ultimaSubmissao,
      p.status
    ].join(","))
  ].join("\n");
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `relatorio_participacao_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const reportTypes = [
  {
    title: "Relatório de Participação",
    description: "Lista completa de participantes e suas submissões",
    format: ".CSV",
    icon: FileText,
    color: "text-secondary",
    action: generateParticipationCSV
  },
  {
    title: "Números Sorteados",
    description: "Histórico completo de todos os sorteios realizados", 
    format: ".PDF",
    icon: FileText,
    color: "text-primary",
    action: () => alert("Funcionalidade em desenvolvimento")
  },
  {
    title: "Lista de Padarias",
    description: "Informações detalhadas das padarias participantes",
    format: ".XLSX", 
    icon: FileText,
    color: "text-accent",
    action: () => alert("Funcionalidade em desenvolvimento")
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
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={report.action}
                >
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
import { useState, useEffect } from "react";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PadariaLayout } from "@/components/padaria/PadariaLayout";
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  DollarSign,
  RefreshCw
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

// Mock data
const mockMetrics = {
  clientesTotal: 96,
  cuponsTotal: 243,
  mediaCuponsPorCliente: 2.5,
  ticketMedio: 28.65
};

const cuponsSemanais = [
  { dia: "Seg", cupons: 34 },
  { dia: "Ter", cupons: 28 },
  { dia: "Qua", cupons: 45 },
  { dia: "Qui", cupons: 38 },
  { dia: "Sex", cupons: 52 },
  { dia: "Sáb", cupons: 67 },
  { dia: "Dom", cupons: 41 },
];

const evolucaoDiaria = [
  { data: "01/08", cupons: 12 },
  { data: "02/08", cupons: 18 },
  { data: "03/08", cupons: 15 },
  { data: "04/08", cupons: 24 },
  { data: "05/08", cupons: 21 },
  { data: "06/08", cupons: 28 },
  { data: "07/08", cupons: 35 },
];

const topClientes = [
  { nome: "Ana Lima", cpf: "123.456.789-**1", cupons: 8, ultimaCompra: "04/08/2025" },
  { nome: "Carlos Sousa", cpf: "987.654.321-**9", cupons: 6, ultimaCompra: "03/08/2025" },
  { nome: "Maria Santos", cpf: "456.789.123-**5", cupons: 5, ultimaCompra: "04/08/2025" },
  { nome: "João Silva", cpf: "789.123.456-**3", cupons: 4, ultimaCompra: "02/08/2025" },
  { nome: "Paula Costa", cpf: "321.654.987-**7", cupons: 4, ultimaCompra: "04/08/2025" },
];

export function PadariaDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const refreshData = () => {
    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Auto refresh every 60 seconds
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PadariaLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <Button onClick={refreshData} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Clientes Cadastrados"
            value={mockMetrics.clientesTotal}
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Cupons Recebidos"
            value={mockMetrics.cuponsTotal}
            icon={Receipt}
            variant="secondary"
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Média Cupons/Cliente"
            value={mockMetrics.mediaCuponsPorCliente.toFixed(1)}
            icon={TrendingUp}
            variant="accent"
            trend={{ value: 3, isPositive: true }}
          />
          <KPICard
            title="Ticket Médio"
            value={`R$ ${mockMetrics.ticketMedio.toFixed(2)}`}
            icon={DollarSign}
            variant="default"
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cupons por Dia da Semana</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cuponsSemanais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="dia" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="cupons" 
                    fill="hsl(var(--chart-primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Evolution Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Diária de Cupons</CardTitle>
              <CardDescription>Última semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolucaoDiaria}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="data" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cupons" 
                    stroke="hsl(var(--chart-secondary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--chart-secondary))", r: 6 }}
                    activeDot={{ r: 8, fill: "hsl(var(--chart-accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>TOP 5 Clientes</CardTitle>
            <CardDescription>Clientes com mais cupons cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">CPF</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Cupons</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Última Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientes.map((cliente, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-2 font-medium">{cliente.nome}</td>
                      <td className="p-2 text-muted-foreground font-mono text-sm">{cliente.cpf}</td>
                      <td className="p-2 text-center">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                          {cliente.cupons}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{cliente.ultimaCompra}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PadariaLayout>
  );
}
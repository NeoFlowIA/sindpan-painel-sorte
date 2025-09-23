import { useState, useEffect } from "react";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientesTable } from "@/components/padaria/ClientesTable";
import { CadastrarCupomButton } from "@/components/padaria/CadastrarCupomButton";
import { CuponsRecentesTable } from "@/components/padaria/CuponsRecentesTable";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardMetrics, useTopClientes, useCuponsRecentes } from "@/hooks/useCupons";
import { maskCPF } from "@/utils/formatters";
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

// Mock data para gráficos (ainda não implementados)
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

export function PadariaDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();

  // Hooks para dados reais
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics(user?.padarias_id || "");
  const { data: topClientesData, isLoading: topClientesLoading, refetch: refetchTopClientes } = useTopClientes(user?.padarias_id || "");
  const { data: cuponsRecentesData, isLoading: cuponsRecentesLoading, refetch: refetchCuponsRecentes } = useCuponsRecentes(user?.padarias_id || "");

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchMetrics(),
        refetchTopClientes(),
        refetchCuponsRecentes()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCupomCadastrado = () => {
    refreshData();
  };

  useEffect(() => {
    // Auto refresh every 60 seconds
    const interval = setInterval(refreshData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calcular métricas
  const clientesTotal = metricsData?.clientes_aggregate?.aggregate?.count || 0;
  const cuponsTotal = metricsData?.cupons_aggregate?.aggregate?.count || 0;
  const ticketMedio = metricsData?.padarias_by_pk?.ticket_medio || 0;
  const mediaCuponsPorCliente = clientesTotal > 0 ? cuponsTotal / clientesTotal : 0;

  // Formatar dados dos top clientes
  const topClientes = topClientesData?.clientes
    ?.map(cliente => ({
      nome: cliente.nome,
      cpf: maskCPF(cliente.cpf), // ✅ CPF mascarado para proteção de dados
      cupons: cliente.cupons?.length || 0,
      ultimaCompra: cliente.cupons?.[0]?.data_compra 
        ? new Date(cliente.cupons[0].data_compra).toLocaleDateString('pt-BR')
        : 'N/A'
    }))
    ?.sort((a, b) => b.cupons - a.cupons) // Ordenar por quantidade de cupons (maior para menor)
    ?.slice(0, 5) || []; // Pegar apenas os top 5

  // Formatar dados dos cupons recentes
  const cuponsRecentes = cuponsRecentesData?.cupons?.map(cupom => ({
    numeroSorte: cupom.numero_sorte,
    cliente: cupom.cliente.nome,
    cpf: maskCPF(cupom.cliente.cpf), // ✅ CPF mascarado para proteção de dados
    valor: parseFloat(cupom.valor_compra || '0'),
    dataHora: new Date(cupom.data_compra).toLocaleString('pt-BR')
  })) || [];

  return (
    <div className="space-y-4 lg:space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <CadastrarCupomButton onCupomCadastrado={handleCupomCadastrado} />
            <Button 
              onClick={refreshData} 
              disabled={isLoading} 
              variant="outline"
              className="transition-all duration-200 hover:scale-105 hover:shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 lg:space-y-5 mt-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <KPICard
            title="Clientes Cadastrados"
            value={clientesTotal}
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Cupons Recebidos"
            value={cuponsTotal}
            icon={Receipt}
            variant="secondary"
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Média Cupons/Cliente"
            value={mediaCuponsPorCliente.toFixed(1)}
            icon={TrendingUp}
            variant="accent"
            trend={{ value: 3, isPositive: true }}
          />
          <KPICard
            title="Ticket Médio"
            value={`R$ ${ticketMedio.toFixed(2)}`}
            icon={DollarSign}
            variant="default"
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Weekly Bar Chart */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground">Cupons por Dia da Semana</CardTitle>
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
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground">Evolução Diária de Cupons</CardTitle>
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
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-foreground">TOP 5 Clientes</CardTitle>
            <CardDescription>Clientes com mais cupons cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            {topClientesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
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
                    {topClientes.length > 0 ? (
                      topClientes.map((cliente, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-200">
                          <td className="p-2 font-medium">{cliente.nome}</td>
                          <td className="p-2 text-muted-foreground font-mono text-sm">{cliente.cpf}</td>
                          <td className="p-2 text-center">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                              {cliente.cupons}
                            </span>
                          </td>
                          <td className="p-2 text-muted-foreground">{cliente.ultimaCompra}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cupons Recentes Section */}
        <CuponsRecentesTable cuponsRecentes={cuponsRecentes} isLoading={cuponsRecentesLoading} />
          </TabsContent>

          <TabsContent value="clientes" className="mt-6">
            <ClientesTable />
          </TabsContent>
        </Tabs>
      </div>
  );
}
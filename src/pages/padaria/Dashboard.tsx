import { useState, useEffect } from "react";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientesTable } from "@/components/padaria/ClientesTable";
import { CadastrarCupomButton } from "@/components/padaria/CadastrarCupomButton";
import { CuponsRecentesTable } from "@/components/padaria/CuponsRecentesTable";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardMetrics, useTopClientes, useCuponsRecentes, useEstatisticasSemanais, useCuponsPorDiaSemana, useEvolucaoDiariaCupons } from "@/hooks/useCupons";
import { useAnexarClientesAutomatico } from "@/hooks/useClientes";
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


export function PadariaDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();

  // Hooks para dados reais
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics(user?.padarias_id || "");
  const { data: topClientesData, isLoading: topClientesLoading, refetch: refetchTopClientes } = useTopClientes(user?.padarias_id || "");
  const { data: cuponsRecentesData, isLoading: cuponsRecentesLoading, refetch: refetchCuponsRecentes } = useCuponsRecentes(user?.padarias_id || "");
  const { data: estatisticasSemanaisData, isLoading: estatisticasSemanaisLoading, refetch: refetchEstatisticasSemanais } = useEstatisticasSemanais(user?.padarias_id || "");
  const { data: cuponsPorDiaSemanaData, isLoading: cuponsPorDiaSemanaLoading, refetch: refetchCuponsPorDiaSemana } = useCuponsPorDiaSemana(user?.padarias_id || "");
  const { data: evolucaoDiariaData, isLoading: evolucaoDiariaLoading, refetch: refetchEvolucaoDiaria } = useEvolucaoDiariaCupons(user?.padarias_id || "");
  
  // Hook para anexar clientes automaticamente baseado na quantidade de cupons
  const { 
    clientesParaAnexar, 
    anexarClientesAutomatico, 
    isLoading: anexarClientesLoading 
  } = useAnexarClientesAutomatico(user?.padarias_id || "", 3); // Limite de 3 cupons

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchMetrics(),
        refetchTopClientes(),
        refetchCuponsRecentes(),
        refetchEstatisticasSemanais(),
        refetchCuponsPorDiaSemana(),
        refetchEvolucaoDiaria()
      ]);
      
      // Anexar clientes automaticamente baseado na quantidade de cupons
      if (clientesParaAnexar.length > 0) {
        try {
          const clientesAnexados = await anexarClientesAutomatico();
          if (clientesAnexados > 0) {
            // Recarregar dados após anexar clientes
            await Promise.all([
              refetchMetrics(),
              refetchTopClientes()
            ]);
          }
        } catch (error) {
        }
      }
      
      setLastUpdate(new Date());
    } catch (error) {
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
  const clientesTotal = metricsData?.clientes?.length || 0;
  const cuponsTotal = metricsData?.cupons?.length || 0;
  const ticketMedio = metricsData?.padarias_by_pk?.ticket_medio || 0;
  const mediaCuponsPorCliente = clientesTotal > 0 ? cuponsTotal / clientesTotal : 0;

  // Processar estatísticas semanais no frontend
  const processarEstatisticasSemanais = () => {
    if (!estatisticasSemanaisData) return { clientesSemanaAtual: 0, cuponsSemanaAtual: 0, clientesSemanaAnterior: 0, cuponsSemanaAnterior: 0 };

    const agora = new Date();
    const umaSemanaAtras = new Date(agora.getTime() - (7 * 24 * 60 * 60 * 1000));
    const duasSemanasAtras = new Date(agora.getTime() - (14 * 24 * 60 * 60 * 1000));

    // Como não temos created_at, vamos usar uma aproximação baseada nos cupons
    // Assumimos que clientes com cupons recentes são "ativos" na semana atual
    const clientesComCuponsRecentes = new Set();
    estatisticasSemanaisData.cupons?.forEach(cupom => {
      const dataCompra = new Date(cupom.data_compra);
      if (dataCompra >= umaSemanaAtras) {
        // Assumir que o cliente_id está em algum lugar do cupom
        // Como não temos a relação direta, vamos usar uma aproximação
        clientesComCuponsRecentes.add(cupom.id);
      }
    });

    // Cupons da semana atual (últimos 7 dias)
    const cuponsSemanaAtual = estatisticasSemanaisData.cupons?.filter(cupom => {
      const dataCompra = new Date(cupom.data_compra);
      return dataCompra >= umaSemanaAtras;
    }).length || 0;

    // Cupons da semana anterior (7-14 dias atrás)
    const cuponsSemanaAnterior = estatisticasSemanaisData.cupons?.filter(cupom => {
      const dataCompra = new Date(cupom.data_compra);
      return dataCompra >= duasSemanasAtras && dataCompra < umaSemanaAtras;
    }).length || 0;

    // Aproximação: usar total de clientes como base
    const clientesSemanaAtual = Math.min(estatisticasSemanaisData.clientes?.length || 0, cuponsSemanaAtual);
    const clientesSemanaAnterior = Math.min(estatisticasSemanaisData.clientes?.length || 0, cuponsSemanaAnterior);

    return {
      clientesSemanaAtual,
      cuponsSemanaAtual,
      clientesSemanaAnterior,
      cuponsSemanaAnterior
    };
  };

  const {
    clientesSemanaAtual,
    cuponsSemanaAtual,
    clientesSemanaAnterior,
    cuponsSemanaAnterior
  } = processarEstatisticasSemanais();

  // Calcular percentual de crescimento
  const calcularCrescimento = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return Math.round(((atual - anterior) / anterior) * 100);
  };

  const crescimentoClientes = calcularCrescimento(clientesSemanaAtual, clientesSemanaAnterior);
  const crescimentoCupons = calcularCrescimento(cuponsSemanaAtual, cuponsSemanaAnterior);

  // Processar dados para gráficos
  const processarCuponsPorDiaSemana = () => {
    if (!cuponsPorDiaSemanaData?.cupons) return [];

    const agora = new Date();
    const umMesAtras = new Date(agora.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Filtrar cupons dos últimos 30 dias
    const cuponsUltimoMes = cuponsPorDiaSemanaData.cupons.filter(cupom => {
      const dataCompra = new Date(cupom.data_compra);
      return dataCompra >= umMesAtras;
    });

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const cuponsPorDia = diasSemana.map(dia => ({ dia, cupons: 0 }));

    cuponsUltimoMes.forEach(cupom => {
      const data = new Date(cupom.data_compra);
      const diaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda, etc.
      cuponsPorDia[diaSemana].cupons++;
    });

    return cuponsPorDia;
  };

  const processarEvolucaoDiaria = () => {
    if (!evolucaoDiariaData?.cupons) return [];

    const agora = new Date();
    const seteDiasAtras = new Date(agora.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Filtrar cupons dos últimos 7 dias
    const cuponsUltimos7Dias = evolucaoDiariaData.cupons.filter(cupom => {
      const dataCompra = new Date(cupom.data_compra);
      return dataCompra >= seteDiasAtras;
    });

    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      ultimos7Dias.push({
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        cupons: 0
      });
    }

    cuponsUltimos7Dias.forEach(cupom => {
      const dataCupom = new Date(cupom.data_compra);
      const hoje = new Date();
      const diasAtras = Math.floor((hoje.getTime() - dataCupom.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasAtras >= 0 && diasAtras <= 6) {
        ultimos7Dias[6 - diasAtras].cupons++;
      }
    });

    return ultimos7Dias;
  };

  const cuponsSemanais = processarCuponsPorDiaSemana();
  const evolucaoDiaria = processarEvolucaoDiaria();

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
    cpf: cupom.cliente.cpf,
    valor: Number(cupom.valor_compra || 0) / 100,
    serie: cupom.serie || 'N/A',
    dataHora: new Date(cupom.data_compra).toLocaleString('pt-BR')
  })) || [];

  return (
    <div className="space-y-4 md:space-y-5 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary truncate">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Última atualização: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
            <CadastrarCupomButton onCupomCadastrado={handleCupomCadastrado} />
            <Button
              onClick={refreshData}
              disabled={isLoading}
              variant="outline"
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105 hover:shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar dados</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="dashboard" className="text-sm sm:text-base py-2">Dashboard</TabsTrigger>
            <TabsTrigger value="clientes" className="text-sm sm:text-base py-2">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 md:space-y-5 lg:space-y-6 mt-4 md:mt-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
          <KPICard
            title="Clientes Cadastrados"
            value={clientesSemanaAtual}
            icon={Users}
            variant="primary"
            trend={{ value: crescimentoClientes, isPositive: crescimentoClientes >= 0 }}
          />
          <KPICard
            title="Cupons Recebidos"
            value={cuponsSemanaAtual}
            icon={Receipt}
            variant="secondary"
            trend={{ value: crescimentoCupons, isPositive: crescimentoCupons >= 0 }}
          />
          <KPICard
            title="Média Cupons/Cliente"
            value={mediaCuponsPorCliente.toFixed(1)}
            icon={TrendingUp}
            variant="accent"
            trend={{ value: 0, isPositive: true }}
          />
          <KPICard
            title="Ticket Médio"
            value={`R$ ${ticketMedio.toFixed(2)}`}
            icon={DollarSign}
            variant="default"
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        {/* Indicador de Clientes para Anexar */}
        {clientesParaAnexar.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-orange-800 dark:text-orange-200">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Clientes para Anexar Automaticamente
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
                {clientesParaAnexar.length} cliente(s) com 3+ cupons podem ser anexados à sua padaria
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
                  <p>Estes clientes serão anexados automaticamente na próxima atualização:</p>
                  <ul className="mt-2 space-y-1">
                    {clientesParaAnexar.slice(0, 3).map((cliente, index) => (
                      <li key={cliente.id} className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="font-medium text-xs sm:text-sm">{cliente.nome}</span>
                        <span className="text-xs bg-orange-200 dark:bg-orange-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                          {cliente.cupons.length} cupons
                        </span>
                      </li>
                    ))}
                    {clientesParaAnexar.length > 3 && (
                      <li className="text-xs text-orange-600 dark:text-orange-400">
                        +{clientesParaAnexar.length - 3} outros...
                      </li>
                    )}
                  </ul>
                </div>
                <Button
                  onClick={anexarClientesAutomatico}
                  disabled={anexarClientesLoading}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900"
                >
                  {anexarClientesLoading ? "Anexando..." : "Anexar Agora"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
          {/* Weekly Bar Chart */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">Cupons por Dia da Semana</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              {cuponsPorDiaSemanaLoading ? (
                <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <BarChart data={cuponsSemanais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="dia" 
                      tick={{ fontSize: 10 }}
                      className="sm:text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      className="sm:text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar 
                      dataKey="cupons" 
                      fill="hsl(var(--chart-primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Daily Evolution Line Chart */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">Evolução Diária de Cupons</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Última semana</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              {evolucaoDiariaLoading ? (
                <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <LineChart data={evolucaoDiaria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="data" 
                      tick={{ fontSize: 10 }}
                      className="sm:text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      className="sm:text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px"
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
          {/* Top Clients Table */}
          <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">TOP 5 Clientes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Clientes com mais cupons cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {topClientesLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8 p-4 md:p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground">Nome</th>
                        <th className="text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">CPF</th>
                        <th className="text-center p-2 sm:p-3 text-xs font-medium text-muted-foreground">Cupons</th>
                        <th className="text-left p-2 sm:p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Última Compra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topClientes.length > 0 ? (
                        topClientes.map((cliente, index) => (
                          <tr key={index} className="hover:bg-muted/30 transition-colors duration-200">
                            <td className="p-2 sm:p-3 text-xs sm:text-sm">
                              <div className="font-medium truncate max-w-[120px] sm:max-w-none">{cliente.nome}</div>
                            </td>
                            <td className="p-2 sm:p-3 text-muted-foreground font-mono text-xs sm:text-sm hidden sm:table-cell">{cliente.cpf}</td>
                            <td className="p-2 sm:p-3 text-center">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-primary/10 text-primary font-medium text-xs sm:text-sm">
                                {cliente.cupons}
                              </span>
                            </td>
                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground hidden md:table-cell">{cliente.ultimaCompra}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
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

          {/* Cupons Recentes */}
          <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">Cupons Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimos cupons cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CuponsRecentesTable cuponsRecentes={cuponsRecentes} isLoading={cuponsRecentesLoading} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="clientes" className="mt-4 md:mt-6">
        <ClientesTable />
      </TabsContent>
    </Tabs>
    </div>
  );
}
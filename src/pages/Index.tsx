import { KPICard } from "@/components/KPICard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Store, Target, Users, Calendar } from "lucide-react";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_ADMIN_DASHBOARD_METRICS } from "@/graphql/queries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  // Buscar métricas do dashboard usando hook customizado
  const { data: metricsData, isLoading: metricsLoading } = useGraphQLQuery<{
    clientes_aggregate: { aggregate: { count: number } };
    cupons_aggregate: { aggregate: { count: number } };
    cupons: Array<{ id: string; data_compra: string; valor_compra: string }>;
    padarias_aggregate: { aggregate: { count: number } };
    sorteios_aggregate: { aggregate: { count: number } };
    proximo_sorteio: Array<{
      id: string;
      data_sorteio: string;
      nome: string;
    }>;
  }>(
    ['admin-dashboard-metrics'],
    GET_ADMIN_DASHBOARD_METRICS
  );

  // Calcular estatísticas
  const totalPadarias = metricsData?.padarias_aggregate?.aggregate?.count || 0;
  const totalCupons = metricsData?.cupons_aggregate?.aggregate?.count || 0;
  const totalClientes = metricsData?.clientes_aggregate?.aggregate?.count || 0;
  const totalSorteios = metricsData?.sorteios_aggregate?.aggregate?.count || 0;

  // Calcular crescimento mensal
  const calcularCrescimento = () => {
    if (!metricsData?.cupons) return { value: 0, isPositive: true };

    const agora = new Date();
    const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sessentaDiasAtras = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000);

    const cuponsUltimos30 = metricsData.cupons.filter(c => {
      const data = new Date(c.data_compra);
      return data >= trintaDiasAtras && data <= agora;
    }).length;

    const cupons30Anteriores = metricsData.cupons.filter(c => {
      const data = new Date(c.data_compra);
      return data >= sessentaDiasAtras && data < trintaDiasAtras;
    }).length;

    if (cupons30Anteriores === 0) return { value: 100, isPositive: true };

    const percentual = Math.round(((cuponsUltimos30 - cupons30Anteriores) / cupons30Anteriores) * 100);
    return {
      value: Math.abs(percentual),
      isPositive: percentual >= 0
    };
  };

  const crescimento = calcularCrescimento();

  // Formatar próximo sorteio
  const proximoSorteio = metricsData?.proximo_sorteio?.[0];
  const proximoSorteioData = proximoSorteio 
    ? format(new Date(proximoSorteio.data_sorteio), "dd/MM", { locale: ptBR })
    : "--/--";
  const proximoSorteioLabel = proximoSorteio
    ? format(new Date(proximoSorteio.data_sorteio), "EEEE", { locale: ptBR })
    : "Não agendado";

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho da campanha promocional das padarias
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <KPICard
              title="Padarias Participantes"
              value={totalPadarias.toString()}
              subtitle="Total cadastradas"
              icon={Store}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
            />
            <KPICard
              title="Cupons Validados"
              value={totalCupons.toLocaleString('pt-BR')}
              subtitle="Total no sistema"
              icon={Target}
              variant="secondary"
              trend={crescimento}
            />
            <KPICard
              title="Participantes Únicos"
              value={totalClientes.toLocaleString('pt-BR')}
              subtitle="Pessoas cadastradas"
              icon={Users}
              variant="accent"
              trend={{ value: 15, isPositive: true }}
            />
            <KPICard
              title="Próximo Sorteio"
              value={proximoSorteioData}
              subtitle={proximoSorteioLabel}
              icon={Calendar}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      {/* Leaderboard */}
      <LeaderboardTable />
    </div>
  );
};

export default Index;

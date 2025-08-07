import { KPICard } from "@/components/KPICard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { LeaderboardTable } from "@/components/LeaderboardTable";

const Index = () => {
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
        <KPICard
          title="Padarias Participantes"
          value="47"
          subtitle="Total cadastradas"
          icon={Store}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Cupons Validados"
          value="1,247"
          subtitle="Este mês"
          icon={Target}
          variant="secondary"
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Participantes Únicos"
          value="892"
          subtitle="Pessoas cadastradas"
          icon={Users}
          variant="accent"
          trend={{ value: 15, isPositive: true }}
        />
        <KPICard
          title="Próximo Sorteio"
          value="15/12"
          subtitle="Segunda-feira"
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      {/* Leaderboard */}
      <LeaderboardTable />
    </div>
  );
};

export default Index;

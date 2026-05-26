import { useMemo, useState } from "react";
import { KPICard } from "@/components/KPICard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Store, Target, Users, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_ADMIN_DASHBOARD_METRICS } from "@/graphql/queries";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  format,
  isWithinInterval,
  startOfDay,
  subDays
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type DashboardMetrics = {
  clientes_aggregate: { aggregate: { count: number } };
  cupons_aggregate: { aggregate: { count: number } };
  cupons: Array<{ id: string; data_compra: string; valor_compra: string }>;
  padarias_aggregate: { aggregate: { count: number } };
  sorteios_aggregate: { aggregate: { count: number } };
  proximo_sorteio: Array<{
    id: string;
    data_sorteio: string;
    nome?: string;
  }>;
  compras: Array<{
    id: string;
    valor_centavos: number | string;
    padaria_id: string | null;
    atendente_id: string | null;
    padaria?: { id: string; nome: string; ticket_medio?: number | null } | null;
    atendente?: { id: string; nome: string } | null;
  }>;
};

const Index = () => {
  // Buscar métricas do dashboard usando hook customizado
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: subDays(new Date(), 29),
    to: new Date()
  }));

  const normalizedRange = useMemo(() => {
    if (dateRange?.from) {
      return {
        from: dateRange.from,
        to: dateRange.to ?? dateRange.from
      };
    }

    const fallbackStart = subDays(new Date(), 29);
    const fallbackEnd = new Date();
    return { from: fallbackStart, to: fallbackEnd };
  }, [dateRange]);

  const periodStart = startOfDay(normalizedRange.from);
  const periodEnd = endOfDay(normalizedRange.to || normalizedRange.from);

  const metricsQueryVariables = useMemo(
    () => ({
      startDate: periodStart?.toISOString() ?? null,
      endDate: periodEnd?.toISOString() ?? null
    }),
    [periodEnd, periodStart]
  );

  const { data: metricsData, isLoading: metricsLoading } = useGraphQLQuery<DashboardMetrics>(
    ['admin-dashboard-metrics', metricsQueryVariables.startDate, metricsQueryVariables.endDate],
    GET_ADMIN_DASHBOARD_METRICS,
    metricsQueryVariables
  );

  // Calcular estatísticas
  const totalPadarias = metricsData?.padarias_aggregate?.aggregate?.count || 0;
  const totalCupons = metricsData?.cupons_aggregate?.aggregate?.count || 0;
  const totalClientes = metricsData?.clientes_aggregate?.aggregate?.count || 0;
  const totalSorteios = metricsData?.sorteios_aggregate?.aggregate?.count || 0;

  // Calcular crescimento mensal
  const calcularCrescimento = () => {
    const cuponsNoPeriodo = metricsData?.cupons ?? [];

    if (!periodStart || !periodEnd || cuponsNoPeriodo.length === 0) {
      return { value: 0, isPositive: true };
    }

    const totalDias = differenceInCalendarDays(periodEnd, periodStart) + 1;
    if (totalDias <= 1) {
      return { value: 0, isPositive: true };
    }

    const metadePeriodo = Math.floor(totalDias / 2);
    const primeiraMetadeFim = addDays(periodStart, metadePeriodo - 1);
    const segundaMetadeInicio = addDays(primeiraMetadeFim, 1);

    const cuponsPrimeiraMetade = cuponsNoPeriodo.filter((c) =>
      isWithinInterval(new Date(c.data_compra), { start: periodStart, end: primeiraMetadeFim })
    ).length;

    const cuponsSegundaMetade = cuponsNoPeriodo.filter((c) =>
      isWithinInterval(new Date(c.data_compra), { start: segundaMetadeInicio, end: periodEnd })
    ).length;

    if (cuponsPrimeiraMetade === 0) {
      return { value: cuponsSegundaMetade > 0 ? 100 : 0, isPositive: true };
    }

    const percentual = Math.round(
      ((cuponsSegundaMetade - cuponsPrimeiraMetade) / cuponsPrimeiraMetade) * 100
    );
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

  const rankingAtendentesPorPadaria = useMemo(() => {
    const mapa = new Map<string, { padariaNome: string; atendenteNome: string; totalCentavos: number; ticketMedio: number }>();

    (metricsData?.compras || []).forEach((compra) => {
      if (!compra.padaria_id || !compra.atendente_id) return;
      const chave = `${compra.padaria_id}:${compra.atendente_id}`;
      const atual = mapa.get(chave);
      const valorCentavos = Number(compra.valor_centavos || 0);
      const ticketMedio = Number(compra.padaria?.ticket_medio || 0);

      if (!atual) {
        mapa.set(chave, {
          padariaNome: compra.padaria?.nome || "Padaria sem nome",
          atendenteNome: compra.atendente?.nome || "Atendente sem nome",
          totalCentavos: valorCentavos,
          ticketMedio,
        });
      } else {
        atual.totalCentavos += valorCentavos;
      }
    });

    return Array.from(mapa.values())
      .map((item) => ({
        ...item,
        totalReais: item.totalCentavos / 100,
        totalCuponsEstimado: item.ticketMedio > 0 ? Math.floor((item.totalCentavos / 100) / item.ticketMedio) : 0,
      }))
      .sort((a, b) => b.totalReais - a.totalReais);
  }, [metricsData?.compras]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Acompanhe o desempenho da campanha promocional das padarias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-filter"
                variant="outline"
                className={cn(
                  "w-full md:w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {normalizedRange?.from ? (
                  normalizedRange.to ? (
                    <span>
                      {format(normalizedRange.from, "dd/MM/yyyy", { locale: ptBR })} - {""}
                      {format(normalizedRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  ) : (
                    format(normalizedRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Filtrar por período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={normalizedRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {metricsLoading ? (
          <>
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
            {/* <KPICard
              title="Próximo Sorteio"
              value={proximoSorteioData}
              subtitle={proximoSorteioLabel}
              icon={Calendar}
              variant="default"
            /> */}
          </>
        )}
      </div>

      {/* Charts Section */}
      <DashboardCharts dateRange={normalizedRange} />

      {/* Leaderboard */}
      <LeaderboardTable dateRange={normalizedRange} />

      <Card>
        <CardHeader>
          <CardTitle>Atendentes por padaria (vendas registradas)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Padaria</th>
                <th className="text-left p-2">Atendente</th>
                <th className="text-right p-2">Total em R$</th>
                <th className="text-right p-2">Cupons estimados</th>
              </tr>
            </thead>
            <tbody>
              {rankingAtendentesPorPadaria.length === 0 ? (
                <tr><td className="p-3 text-muted-foreground" colSpan={4}>Sem compras com atendente no período selecionado.</td></tr>
              ) : rankingAtendentesPorPadaria.map((item, idx) => (
                <tr key={`${item.padariaNome}-${item.atendenteNome}-${idx}`} className="border-b">
                  <td className="p-2">{item.padariaNome}</td>
                  <td className="p-2">{item.atendenteNome}</td>
                  <td className="p-2 text-right">R$ {item.totalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-2 text-right">{item.totalCuponsEstimado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { differenceInCalendarDays, format, subDays, startOfDay, endOfDay } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateRange } from "react-day-picker";

type DashboardChartsProps = {
  dateRange?: DateRange;
};

type DashboardChartsResponse = {
  cupons: Array<{ id: string; data_compra: string; valor_compra: string }>;
  padarias: Array<{
    nome: string;
    cupons_aggregate: { aggregate: { count: number } };
  }>;
};

export function DashboardCharts({ dateRange }: DashboardChartsProps) {
  const isMobile = useIsMobile();

  const startDate = dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined;
  const endDate = dateRange?.to
    ? endOfDay(dateRange.to).toISOString()
    : dateRange?.from
      ? endOfDay(dateRange.from).toISOString()
      : undefined;

  // Buscar métricas para os gráficos
  const { data: metricsData, isLoading } = useQuery<DashboardChartsResponse>({
    queryKey: ['dashboard-charts-metrics', startDate, endDate],
    queryFn: async (): Promise<DashboardChartsResponse> => {
      const dateFilters = { startDate: startDate ?? null, endDate: endDate ?? null };

      const data = await graphqlClient.query<DashboardChartsResponse>(`
        query GetCuponsForCharts($startDate: timestamptz, $endDate: timestamptz) {
          cupons(
            order_by: {data_compra: desc}
            where: {
              data_compra: {_gte: $startDate, _lte: $endDate}
              status: {_eq: "ativo"}
            }
            limit: 365
          ) {
            id
            data_compra
            valor_compra
          }
          padarias(
            order_by: {cupons_aggregate: {count: desc}}
            limit: 6
          ) {
            nome
            cupons_aggregate(
              where: {
                data_compra: {_gte: $startDate, _lte: $endDate}
                status: {_eq: "ativo"}
              }
            ) {
              aggregate {
                count
              }
            }
          }
        }
      `, dateFilters);
      return data;
    }
  });

  // Processar dados para gráfico de barras
  const bakeryData = (metricsData?.padarias || []).map(p => ({
    name: p.nome,
    coupons: p.cupons_aggregate.aggregate.count
  }));

  // Processar dados para tendência diária (últimos 7 dias)
  const dailyTrends = (() => {
    if (!metricsData?.cupons) return [];

    const start = startDate ? new Date(startDate) : subDays(new Date(), 6);
    const end = endDate ? new Date(endDate) : new Date();
    const totalDias = Math.max(differenceInCalendarDays(end, start), 0);

    const tendencia = [];
    for (let i = totalDias; i >= 0; i--) {
      const dia = subDays(end, i);
      const cupomsDoDia = metricsData.cupons.filter(c => {
        const dataCupom = new Date(c.data_compra);
        return dataCupom.toDateString() === dia.toDateString();
      }).length;

      tendencia.push({
        date: format(dia, 'dd/MM'),
        coupons: cupomsDoDia
      });
    }
    return tendencia;
  })();

  // Calcular distribuição (Top 5 padarias individualizadas) - Melhorado
  const participationData = (() => {
    if (!metricsData?.padarias || metricsData.padarias.length === 0) {
      return [{ name: "Sem dados", value: 100, color: "hsl(var(--muted))" }];
    }

    const todasTotal = metricsData.padarias.reduce((acc, p) => acc + p.cupons_aggregate.aggregate.count, 0);
    
    if (todasTotal === 0) {
      return [{ name: "Sem cupons", value: 100, color: "hsl(var(--muted))" }];
    }

    // Cores mais vibrantes e acessíveis
    const cores = [
      "#8b5cf6", // Roxo
      "#3b82f6", // Azul
      "#10b981", // Verde
      "#f59e0b", // Laranja
      "#ef4444", // Vermelho
      "#06b6d4", // Ciano
      "#84cc16", // Lima
      "#f97316", // Laranja escuro
    ];

    // Ordenar padarias por número de cupons (maior para menor)
    const padariasOrdenadas = [...metricsData.padarias].sort((a, b) =>
      b.cupons_aggregate.aggregate.count - a.cupons_aggregate.aggregate.count
    );

    // Top 5 padarias com percentuais
    const top5 = padariasOrdenadas.slice(0, 5).map((p, index) => {
      const count = p.cupons_aggregate.aggregate.count;
      const percentual = Math.round((count / todasTotal) * 100);
      return {
        name: p.nome.length > 15 ? `${p.nome.substring(0, 15)}...` : p.nome,
        fullName: p.nome,
        value: percentual,
        count: count,
        color: cores[index] || "hsl(var(--chart-primary))"
      };
    });

    // Outras (se houver mais de 5)
    if (padariasOrdenadas.length > 5) {
      const outrasTotal = padariasOrdenadas.slice(5).reduce((acc, p) => acc + p.cupons_aggregate.aggregate.count, 0);
      const outrasPercent = Math.round((outrasTotal / todasTotal) * 100);
      
      if (outrasPercent > 0) {
        top5.push({
          name: `Outras (${padariasOrdenadas.length - 5})`,
          fullName: `Outras ${padariasOrdenadas.length - 5} padarias`,
          value: outrasPercent,
          count: outrasTotal,
          color: "hsl(var(--muted))"
        });
      }
    }

    return top5;
  })();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] lg:col-span-2" />
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px] lg:col-span-3" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {/* Bar Chart - Coupons per Bakery */}
      <Card className="lg:col-span-2 xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold text-foreground">
            Cupons por Padaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 280} className="min-h-[250px]">
            <BarChart data={bakeryData} margin={{ bottom: isMobile ? 80 : 60, top: 20, left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
                formatter={(value: any) => [value, 'Cupons']}
              />
              <Bar 
                dataKey="coupons" 
                fill="hsl(var(--chart-primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Participation Percentage - Melhorado */}
      <Card className="lg:col-span-1 xl:col-span-1">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold text-foreground">
            Distribuição de Participação
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 280} className="min-h-[250px]">
            <PieChart>
              <Pie
                data={participationData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 40 : 50}
                outerRadius={isMobile ? 75 : 90}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {participationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
                formatter={(value: any, name: any) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Legend customizada para melhor responsividade */}
          <div className="mt-4 w-full">
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {participationData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center justify-between gap-2 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate" title={entry.fullName || entry.name}>
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <span className="font-medium">{entry.value}%</span>
                    {entry.count && (
                      <span className="text-muted-foreground">({entry.count})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Chart - Daily Trends */}
      <Card className="lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold text-foreground">
            Tendência Diária de Cupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 280} className="min-h-[250px]">
            <LineChart data={dailyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
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
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
                formatter={(value: any) => [value, 'Cupons']}
              />
              <Line 
                type="monotone" 
                dataKey="coupons" 
                stroke="hsl(var(--chart-secondary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--chart-secondary))", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: "hsl(var(--chart-secondary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
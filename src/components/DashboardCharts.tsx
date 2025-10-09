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
import { format, subDays } from "date-fns";

export function DashboardCharts() {
  // Buscar métricas para os gráficos
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['dashboard-charts-metrics'],
    queryFn: async () => {
      const data = await graphqlClient.query<{
        cupons: Array<{ id: string; data_compra: string; valor_compra: string }>;
      }>(`
        query GetCuponsForCharts {
          cupons(order_by: {data_compra: desc}, limit: 100) {
            id
            data_compra
            valor_compra
          }
        }
      `);
      return data;
    }
  });

  // Buscar padarias com contagem de cupons
  const { data: padariasData } = useQuery({
    queryKey: ['padarias-cupons'],
    queryFn: async () => {
      const data = await graphqlClient.query<{
        padarias: Array<{
          nome: string;
          cupons_aggregate: { aggregate: { count: number } };
        }>;
      }>(`
        query GetPadariasCupons {
          padarias(
            order_by: {cupons_aggregate: {count: desc}}
            limit: 6
          ) {
            nome
            cupons_aggregate {
              aggregate {
                count
              }
            }
          }
        }
      `);
      return data;
    }
  });

  // Processar dados para gráfico de barras
  const bakeryData = (padariasData?.padarias || []).map(p => ({
    name: p.nome,
    coupons: p.cupons_aggregate.aggregate.count
  }));

  // Processar dados para tendência diária (últimos 7 dias)
  const dailyTrends = (() => {
    if (!metricsData?.cupons) return [];
    
    const ultimosSete = [];
    for (let i = 6; i >= 0; i--) {
      const dia = subDays(new Date(), i);
      const cupomsDoDia = metricsData.cupons.filter(c => {
        const dataCupom = new Date(c.data_compra);
        return dataCupom.toDateString() === dia.toDateString();
      }).length;
      
      ultimosSete.push({
        date: format(dia, 'dd/MM'),
        coupons: cupomsDoDia
      });
    }
    return ultimosSete;
  })();

  // Calcular distribuição (Top 5 padarias individualizadas)
  const participationData = (() => {
    if (!padariasData?.padarias || padariasData.padarias.length === 0) {
      return [{ name: "Sem dados", value: 100, color: "hsl(var(--muted))" }];
    }

    const todasTotal = padariasData.padarias.reduce((acc, p) => acc + p.cupons_aggregate.aggregate.count, 0);
    
    if (todasTotal === 0) {
      return [{ name: "Sem cupons", value: 100, color: "hsl(var(--muted))" }];
    }

    const cores = [
      "#8b5cf6", // Roxo
      "#3b82f6", // Azul
      "#10b981", // Verde
      "#f59e0b", // Laranja
      "#ef4444", // Vermelho
    ];

    // Top 5 padarias com percentuais
    const top5 = padariasData.padarias.slice(0, 5).map((p, index) => {
      const count = p.cupons_aggregate.aggregate.count;
      const percentual = Math.round((count / todasTotal) * 100);
      return {
        name: `${p.nome} (${percentual}%)`,
        value: percentual,
        color: cores[index] || "hsl(var(--chart-primary))"
      };
    });

    // Outras (se houver mais de 5)
    if (padariasData.padarias.length > 5) {
      const outrasTotal = padariasData.padarias.slice(5).reduce((acc, p) => acc + p.cupons_aggregate.aggregate.count, 0);
      const outrasPercent = Math.round((outrasTotal / todasTotal) * 100);
      
      if (outrasPercent > 0) {
        top5.push({
          name: `Outras (${outrasPercent}%)`,
          value: outrasPercent,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Bar Chart - Coupons per Bakery */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Cupons por Padaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bakeryData} margin={{ bottom: 60 }}>
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
                  borderRadius: "8px"
                }}
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

      {/* Pie Chart - Participation Percentage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Distribuição de Participação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={participationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {participationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart - Daily Trends */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Tendência Diária de Cupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrends}>
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
                  borderRadius: "8px"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="coupons" 
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
  );
}
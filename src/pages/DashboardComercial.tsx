import { useMemo, useState } from "react";
import { addDays, subDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommercialDashboard } from "@/hooks/useCommercialDashboard";
import { CommercialDashboardFilters as FilterType } from "@/services/commercialDashboardService";
import {
  CategoryRankingChart,
  CommercialDashboardFilters,
  CommercialInsightsCards,
  CustomerRankingTable,
  DailyPerformanceChart,
  HourlyPerformanceChart,
  OcrQualityCard,
  OverviewCards,
  ProductRankingTable,
  SuspiciousPurchasesTable,
  TicketRangeChart,
} from "@/components/admin/commercial-dashboard/CommercialDashboardWidgets";

const toIso = (date: Date, end = false) => {
  const next = new Date(date);
  next.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return next.toISOString();
};

export default function DashboardComercial() {
  const [filters, setFilters] = useState<FilterType>(() => ({
    startDate: toIso(subDays(new Date(), 30)),
    endDate: toIso(addDays(new Date(), 1), true),
  }));

  const insightParams = useMemo(() => ({ ticketThreshold: 40, vipValueThreshold: 100, inactivityDays: 7, highTicketPercentile: 75, minOccurrencesForProductInsight: 3, minOccurrencesForComboInsight: 2 }), []);
  const dashboard = useCommercialDashboard(filters, insightParams);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Comercial</h1>
            <Badge variant="secondary">Dados experimentais para teste interno</Badge>
            {dashboard.source === "mock" && <Badge variant="outline">Usando fallback mockado</Badge>}
          </div>
          <p className="text-muted-foreground">Indicadores de vendas calculados a partir das notas fiscais cadastradas.</p>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50 text-amber-950">
        <AlertTitle>Aviso importante</AlertTitle>
        <AlertDescription>Os valores representam compras cadastradas na campanha, não o faturamento total da padaria.</AlertDescription>
      </Alert>

      <CommercialDashboardFilters filters={filters} onChange={setFilters} onRefresh={dashboard.refresh} options={dashboard.options} />

      {dashboard.error && (
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar dados reais</AlertTitle>
          <AlertDescription>O painel tenta usar dados reais do GraphQL e mantém um fallback seguro quando a API não está disponível.</AlertDescription>
        </Alert>
      )}

      {dashboard.loading ? <LoadingDashboard /> : (
        <>
          <section className="space-y-4">
            <div><h2 className="text-xl font-semibold">Resumo comercial</h2><p className="text-sm text-muted-foreground">KPIs principais do período filtrado.</p></div>
            <OverviewCards overview={dashboard.overview} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <HourlyPerformanceChart data={dashboard.charts.hourlyPerformance} />
            <DailyPerformanceChart daily={dashboard.charts.dailyPerformance} weekdays={dashboard.charts.weekdayPerformance} />
          </section>

          <section className="space-y-4">
            <div><h2 className="text-xl font-semibold">Clientes</h2><p className="text-sm text-muted-foreground">Rankings comerciais com nome e WhatsApp sempre mascarados.</p></div>
            <div className="grid gap-6 xl:grid-cols-2">
              <CustomerRankingTable title="Top clientes por valor" customers={dashboard.tables.topCustomersByValue} />
              <CustomerRankingTable title="Top clientes por frequência" customers={dashboard.tables.topCustomersByFrequency} />
              <CustomerRankingTable title="Clientes de alto ticket e VIP" customers={dashboard.tables.vipCustomers} />
              <CustomerRankingTable title="Clientes em risco" customers={dashboard.tables.customersAtRisk} />
            </div>
          </section>

          <section className="space-y-4">
            <div><h2 className="text-xl font-semibold">Produtos e categorias</h2><p className="text-sm text-muted-foreground">Leitura tolerante do OCR, mesmo quando o texto está incompleto.</p></div>
            <div className="grid gap-6 xl:grid-cols-2">
              <CategoryRankingChart data={dashboard.charts.categories} />
              <TicketRangeChart data={dashboard.charts.ticketRanges} />
            </div>
            <ProductRankingTable products={dashboard.charts.products} combos={dashboard.charts.combos} />
          </section>

          <section className="space-y-4">
            <div><h2 className="text-xl font-semibold">Insights comerciais</h2><p className="text-sm text-muted-foreground">Leituras automáticas parametrizadas para apoiar ações comerciais.</p></div>
            <CommercialInsightsCards insights={dashboard.insights} />
          </section>

          <section className="space-y-4">
            <div><h2 className="text-xl font-semibold">Qualidade dos dados</h2><p className="text-sm text-muted-foreground">Indicadores operacionais, OCR e auditoria usando data de cadastro apenas para controle.</p></div>
            <OcrQualityCard quality={dashboard.ocrQuality} paymentMethods={dashboard.charts.paymentMethods} />
            <SuspiciousPurchasesTable rows={dashboard.tables.suspiciousPurchases} />
          </section>
        </>
      )}
    </div>
  );
}

function LoadingDashboard() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, idx) => <Skeleton key={idx} className="h-28 rounded-xl" />)}</div><Skeleton className="h-96 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>;
}

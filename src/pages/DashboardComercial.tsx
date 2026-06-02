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
  CommercialScopeSummary,
  CustomerRankingTable,
  DailyPerformanceChart,
  HourlyPerformanceChart,
  OcrQualityCard,
  OverviewCards,
  ProductRankingTable,
  SuspiciousPurchasesTable,
  TicketRangeChart,
} from "@/components/admin/commercial-dashboard/CommercialDashboardWidgets";
import { AlertTriangle, BarChart3, Building2, Sparkles } from "lucide-react";

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
  const [revealCustomerData, setRevealCustomerData] = useState(false);

  const insightParams = useMemo(() => ({ ticketThreshold: 40, vipValueThreshold: 100, inactivityDays: 7, highTicketPercentile: 75, minOccurrencesForProductInsight: 3, minOccurrencesForComboInsight: 2 }), []);
  const dashboard = useCommercialDashboard(filters, insightParams);
  const selectedBakery = dashboard.options.padarias.find((padaria) => padaria.id === filters.padariaId);

  return (
    <div className="min-h-screen space-y-7 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-background to-secondary/10 p-6 shadow-elevated md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Admin experimental</Badge>
              <Badge variant="secondary">Dashboard Comercial</Badge>
              {dashboard.source === "mock" && <Badge variant="outline">Usando fallback mockado</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">Dashboard Comercial</h1>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              Indicadores comerciais calculados a partir das notas fiscais cadastradas, com visão consolidada do Admin ou filtro dedicado por padaria.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-card backdrop-blur">
              <div className="flex items-center gap-2 text-primary"><Building2 className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">Escopo atual</span></div>
              <p className="mt-2 text-xl font-bold">{selectedBakery?.nome || "Todas as padarias"}</p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-card backdrop-blur">
              <div className="flex items-center gap-2 text-secondary"><BarChart3 className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">Notas analisadas</span></div>
              <p className="mt-2 text-xl font-bold">{dashboard.overview.totalPurchases.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>
      </div>

      <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 shadow-sm">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Aviso importante</AlertTitle>
        <AlertDescription>Os valores representam compras cadastradas na campanha, não o faturamento total da padaria.</AlertDescription>
      </Alert>

      <CommercialScopeSummary filters={filters} padariaNome={selectedBakery?.nome} totalPurchases={dashboard.overview.totalPurchases} totalValue={dashboard.overview.totalValue} />
      <CommercialDashboardFilters
        filters={filters}
        onChange={setFilters}
        onRefresh={dashboard.refresh}
        revealCustomerData={revealCustomerData}
        onToggleRevealCustomerData={() => setRevealCustomerData((current) => !current)}
        options={dashboard.options}
      />

      {dashboard.error && (
        <Alert variant="destructive">
          <AlertTitle>Falha ao carregar dados reais</AlertTitle>
          <AlertDescription>O painel tenta usar dados reais do GraphQL e mantém um fallback seguro quando a API não está disponível.</AlertDescription>
        </Alert>
      )}

      {dashboard.loading ? <LoadingDashboard /> : (
        <>
          <section className="space-y-4">
            <SectionHeader eyebrow="Resumo comercial" title="Principais indicadores" description="KPIs principais do período filtrado e do escopo de padaria escolhido." />
            <OverviewCards overview={dashboard.overview} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <HourlyPerformanceChart data={dashboard.charts.hourlyPerformance} />
            <DailyPerformanceChart daily={dashboard.charts.dailyPerformance} weekdays={dashboard.charts.weekdayPerformance} />
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Clientes" title="Segmentação comercial" description="Rankings com nome e WhatsApp sempre mascarados para manter privacidade." />
            <div className="grid gap-6 xl:grid-cols-2">
              <CustomerRankingTable title="Top clientes por valor" customers={dashboard.tables.topCustomersByValue} revealSensitiveData={revealCustomerData} />
              <CustomerRankingTable title="Top clientes por frequência" customers={dashboard.tables.topCustomersByFrequency} revealSensitiveData={revealCustomerData} />
              <CustomerRankingTable title="Clientes de alto ticket e VIP" customers={dashboard.tables.vipCustomers} revealSensitiveData={revealCustomerData} />
              <CustomerRankingTable title="Clientes em risco" customers={dashboard.tables.customersAtRisk} revealSensitiveData={revealCustomerData} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Produtos e categorias" title="Leitura comercial do OCR" description="Parser tolerante para extrair categorias, produtos e combos mesmo com OCR parcial." />
            <div className="grid gap-6 xl:grid-cols-2">
              <CategoryRankingChart data={dashboard.charts.categories} />
              <TicketRangeChart data={dashboard.charts.ticketRanges} />
            </div>
            <ProductRankingTable products={dashboard.charts.products} combos={dashboard.charts.combos} />
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Insights comerciais" title="Recomendações automáticas" description="Leituras automáticas parametrizadas para apoiar campanhas e ações de relacionamento." icon="sparkles" />
            <CommercialInsightsCards insights={dashboard.insights} />
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Qualidade dos dados" title="OCR, auditoria e suspeitas" description="Indicadores operacionais usando data de cadastro apenas para controle e auditoria." />
            <OcrQualityCard quality={dashboard.ocrQuality} paymentMethods={dashboard.charts.paymentMethods} />
            <SuspiciousPurchasesTable rows={dashboard.tables.suspiciousPurchases} />
          </section>
        </>
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon?: "sparkles" }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon === "sparkles" ? <Sparkles className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function LoadingDashboard() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, idx) => <Skeleton key={idx} className="h-32 rounded-2xl" />)}</div><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
}

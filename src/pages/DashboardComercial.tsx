import { Component, ReactNode, useMemo, useState } from "react";
import { addDays, subDays } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommercialDashboard } from "@/hooks/useCommercialDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { exportToXLSX } from "@/utils/xlsx";
import { calculateCustomerConsumptionProfile } from "@/utils/commercialMetrics";
import { CommercialDashboardFilters as FilterType } from "@/services/commercialDashboardService";
import {
  CategoryRankingChart,
  CommercialDashboardFilters,
  CommercialInsightsCards,
  CommercialScopeSummary,
  CustomerConsumptionModal,
  CustomerData,
  CustomerRankingTable,
  DailyPerformanceChart,
  HourlyPerformanceChart,
  OcrQualityCard,
  OverviewCards,
  ProductRankingTable,
  SuspiciousPurchasesTable,
  TicketRangeChart,
} from "@/components/admin/commercial-dashboard/CommercialDashboardWidgets";
import { AlertTriangle, BarChart3, Building2, Download, Sparkles } from "lucide-react";

const toIso = (date: Date, end = false) => {
  const next = new Date(date);
  next.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return next.toISOString();
};

interface DashboardComercialProps { scopeMode?: "admin" | "bakery" }

export default function DashboardComercial({ scopeMode = "admin" }: DashboardComercialProps) {
  const { user } = useAuth();
  const forcedPadariaId = scopeMode === "bakery" ? user?.padarias_id : undefined;
  const padariaNome = user?.padarias?.nome || user?.bakery_name || "Minha padaria";

  if (scopeMode === "bakery" && !forcedPadariaId) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Padaria não vinculada</AlertTitle>
        <AlertDescription>Não encontramos uma padaria vinculada ao seu usuário. Peça ao suporte para revisar o cadastro antes de acessar o Dashboard Comercial.</AlertDescription>
      </Alert>
    );
  }

  return (
    <DashboardComercialErrorBoundary>
      <DashboardComercialContent scopeMode={scopeMode} forcedPadariaId={forcedPadariaId} padariaNome={padariaNome} />
    </DashboardComercialErrorBoundary>
  );
}

function DashboardComercialContent({ scopeMode, forcedPadariaId, padariaNome }: { scopeMode: "admin" | "bakery"; forcedPadariaId?: string; padariaNome: string }) {
  const [filters, setFilters] = useState<FilterType>(() => ({
    startDate: toIso(subDays(new Date(), 30)),
    endDate: toIso(addDays(new Date(), 1), true),
  }));
  const [revealCustomerData, setRevealCustomerData] = useState(scopeMode === "bakery");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  const insightParams = useMemo(() => ({ ticketThreshold: 40, vipValueThreshold: 100, inactivityDays: 7, highTicketPercentile: 75, minOccurrencesForProductInsight: 3, minOccurrencesForComboInsight: 2 }), []);
  const effectiveFilters = useMemo(() => forcedPadariaId ? { ...filters, padariaId: forcedPadariaId } : filters, [filters, forcedPadariaId]);
  const scope = useMemo(() => ({ mode: scopeMode, forcedPadariaId }), [scopeMode, forcedPadariaId]);
  const dashboard = useCommercialDashboard(effectiveFilters, insightParams, scope);
  const selectedBakery = dashboard.options.padarias.find((padaria) => padaria.id === effectiveFilters.padariaId) || (forcedPadariaId ? { id: forcedPadariaId, nome: padariaNome } : undefined);
  const selectedCustomerProfile = useMemo(() => selectedCustomer ? calculateCustomerConsumptionProfile(selectedCustomer.clienteKey, dashboard.purchases) : null, [dashboard.purchases, selectedCustomer]);

  const visibleName = (customer: CustomerData) => revealCustomerData ? customer.nomeCompleto || customer.nome : customer.nome;
  const visibleWhatsapp = (customer: CustomerData) => revealCustomerData ? customer.whatsappCompleto || customer.whatsapp : customer.whatsapp;
  const exportSegment = (segmentName: string, customers: CustomerData[]) => {
    const rows = [
      ["Segmento", "Cliente", "WhatsApp", "Notas", "Valor total", "Ticket médio", "Maior compra", "Primeira compra", "Última compra", "Dias sem compra", "Horário preferido", "Dia preferido", "Categoria principal", "Status"],
      ...customers.map((customer) => [
        segmentName,
        visibleName(customer),
        visibleWhatsapp(customer),
        String(customer.purchases),
        brl(customer.totalValue),
        brl(customer.averageTicket),
        brl(customer.highestPurchase || 0),
        formatDate(customer.firstPurchase),
        formatDate(customer.lastPurchase),
        customer.daysSinceLastPurchase === null || customer.daysSinceLastPurchase === undefined ? "-" : String(customer.daysSinceLastPurchase),
        customer.preferredHour === null || customer.preferredHour === undefined ? "-" : `${customer.preferredHour}h`,
        customer.preferredWeekday || "-",
        customer.topCategory || "Não identificada",
        customer.status,
      ]),
    ];
    const scopeLabel = selectedBakery?.nome || "todas-padarias";
    exportToXLSX(`dashboard-comercial-${slug(segmentName)}-${slug(scopeLabel)}.xlsx`, segmentName.slice(0, 30), rows);
  };

  const exportAllSegments = () => {
    const segments: Array<[string, CustomerData[]]> = [
      ["Top clientes por valor", dashboard.exports.topCustomersByValue],
      ["Top clientes por frequência", dashboard.exports.topCustomersByFrequency],
      ["Clientes VIP e alto ticket", dashboard.exports.vipCustomers],
      ["Clientes em risco", dashboard.exports.customersAtRisk],
      ["Clientes recorrentes", dashboard.exports.recurringCustomers],
      ["Uma compra e ticket alto", dashboard.exports.onePurchaseHighTicket],
    ];
    const rows = [["Segmento", "Cliente", "WhatsApp", "Notas", "Valor total", "Ticket médio", "Maior compra", "Primeira compra", "Última compra", "Dias sem compra", "Horário preferido", "Dia preferido", "Categoria principal", "Status"]];
    segments.forEach(([segment, customers]) => customers.forEach((customer) => rows.push([segment, visibleName(customer), visibleWhatsapp(customer), String(customer.purchases), brl(customer.totalValue), brl(customer.averageTicket), brl(customer.highestPurchase || 0), formatDate(customer.firstPurchase), formatDate(customer.lastPurchase), customer.daysSinceLastPurchase === null || customer.daysSinceLastPurchase === undefined ? "-" : String(customer.daysSinceLastPurchase), customer.preferredHour === null || customer.preferredHour === undefined ? "-" : `${customer.preferredHour}h`, customer.preferredWeekday || "-", customer.topCategory || "Não identificada", customer.status])));
    exportToXLSX(`dashboard-comercial-segmentos-${slug(selectedBakery?.nome || "todas-padarias")}.xlsx`, "Segmentos", rows);
  };


  return (
    <div className="min-h-screen space-y-7 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-card via-background to-secondary/10 p-6 shadow-elevated md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">{scopeMode === "bakery" ? "Minha padaria" : "Admin experimental"}</Badge>
              <Badge variant="secondary">Dashboard Comercial</Badge>
              {dashboard.source === "mock" && <Badge variant="outline">Usando fallback mockado</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">Dashboard Comercial</h1>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              {scopeMode === "bakery" ? "Indicadores comerciais calculados somente com as notas fiscais cadastradas para a sua padaria." : "Indicadores comerciais calculados a partir das notas fiscais cadastradas, com visão consolidada do Admin ou filtro dedicado por padaria."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-card backdrop-blur">
              <div className="flex items-center gap-2 text-primary"><Building2 className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">Escopo atual</span></div>
              <p className="mt-2 text-xl font-bold">{selectedBakery?.nome || (scopeMode === "bakery" ? "Minha padaria" : "Todas as padarias")}</p>
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

      <CommercialScopeSummary filters={effectiveFilters} padariaNome={selectedBakery?.nome} totalPurchases={dashboard.overview.totalPurchases} totalValue={dashboard.overview.totalValue} scopeMode={scopeMode} />
      <CommercialDashboardFilters
        filters={effectiveFilters}
        onChange={(nextFilters) => setFilters(forcedPadariaId ? { ...nextFilters, padariaId: forcedPadariaId } : nextFilters)}
        onRefresh={dashboard.refresh}
        revealCustomerData={revealCustomerData}
        onToggleRevealCustomerData={() => setRevealCustomerData((current) => !current)}
        options={dashboard.options}
        scopeMode={scopeMode}
        forcedPadariaName={selectedBakery?.nome}
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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeader eyebrow="Clientes" title="Segmentação comercial" description={revealCustomerData ? "Rankings com nomes e WhatsApp completos conforme consentimento LGPD." : "Rankings com nome e WhatsApp mascarados para manter privacidade."} />
              <Button variant="outline" className="w-fit border-primary/20 bg-background" onClick={exportAllSegments}>
                <Download className="mr-2 h-4 w-4" /> Exportar todos os segmentos
              </Button>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <CustomerRankingTable title="Top clientes por valor" customers={dashboard.tables.topCustomersByValue} revealSensitiveData={revealCustomerData} onExport={() => exportSegment("Top clientes por valor", dashboard.exports.topCustomersByValue)} onViewProfile={setSelectedCustomer} />
              <CustomerRankingTable title="Top clientes por frequência" customers={dashboard.tables.topCustomersByFrequency} revealSensitiveData={revealCustomerData} onExport={() => exportSegment("Top clientes por frequência", dashboard.exports.topCustomersByFrequency)} onViewProfile={setSelectedCustomer} />
              <CustomerRankingTable title="Clientes de alto ticket e VIP" customers={dashboard.tables.vipCustomers} revealSensitiveData={revealCustomerData} onExport={() => exportSegment("Clientes VIP e alto ticket", dashboard.exports.vipCustomers)} onViewProfile={setSelectedCustomer} />
              <CustomerRankingTable title="Clientes em risco" customers={dashboard.tables.customersAtRisk} revealSensitiveData={revealCustomerData} onExport={() => exportSegment("Clientes em risco", dashboard.exports.customersAtRisk)} onViewProfile={setSelectedCustomer} />
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
          <CustomerConsumptionModal open={Boolean(selectedCustomer)} onOpenChange={(open) => !open && setSelectedCustomer(null)} profile={selectedCustomerProfile} revealSensitiveData={revealCustomerData} />
        </>
      )}
    </div>
  );
}

class DashboardComercialErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Erro ao renderizar Dashboard Comercial", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Não foi possível abrir o Dashboard Comercial</AlertTitle>
        <AlertDescription>Recarregue a página. Se o problema persistir, acione o suporte com a mensagem: {this.state.error.message}</AlertDescription>
      </Alert>
    );
  }
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

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date?: Date | null) {
  return date ? date.toLocaleDateString("pt-BR") : "-";
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "dashboard";
}

import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Lightbulb,
  LucideIcon,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommercialDashboardFilters } from "@/services/commercialDashboardService";

const BRAND_RED = "#880808";
const BRAND_ORANGE = "#F89818";
const BRAND_GOLD = "#F8A828";
const COLORS = [BRAND_RED, BRAND_ORANGE, BRAND_GOLD, "#16a34a", "#9333ea", "#0891b2", "#ca8a04", "#64748b"];

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;
const dateLabel = (date?: Date | null) => date ? date.toLocaleDateString("pt-BR") : "-";

interface OverviewData {
  totalValue: number;
  averageTicket: number;
  medianTicket: number;
  totalPurchases: number;
  uniqueCustomers: number;
  repurchaseRate: number;
  mostValuableHour: string;
  strongestCategory: string;
}
interface HourlyData { hour: number; label: string; purchases: number; totalValue: number; averageTicket: number; valueShare: number }
interface DailyData { label: string; totalValue: number; purchases: number }
interface WeekdayData { weekday: string; totalValue: number; purchases: number; averageTicket: number }
interface TicketRangeData { label: string; purchases: number; notesShare: number; totalValue: number; valueShare: number; repurchaseRate: number }
interface CategoryData { category: string; totalValue: number }
interface ProductData { product: string; category: string; purchases: number; totalValue: number }
interface ComboData { combo: string; purchases: number; averageTicket: number }
interface CustomerData { nome: string; whatsapp: string; nomeCompleto?: string; whatsappCompleto?: string; purchases: number; totalValue: number; averageTicket: number; status: string; lastPurchase: Date | null }
interface OcrQualityData { validRaw: number; rawLiteral: number; withItems: number; withoutItems: number; itemCoverage: number; possibleDuplicates: number }
interface PaymentMethodData { method: string; purchases: number; totalValue: number; averageTicket: number }
interface SuspiciousData { id: string; cliente: string; padaria: string; value: number; date: string; reason: string }

interface FiltersProps {
  filters: CommercialDashboardFilters;
  onChange: (filters: CommercialDashboardFilters) => void;
  onRefresh: () => void;
  revealCustomerData: boolean;
  onToggleRevealCustomerData: () => void;
  options: {
    padarias: Array<{ id: string; nome: string }>;
    clientes: Array<{ id: string; nome: string }>;
    atendentes: Array<{ id: string; nome: string }>;
    campanhas: Array<{ id: string; nome: string; data_inicio?: string | null; data_fim?: string | null }>;
  };
}

interface ScopeSummaryProps {
  filters: CommercialDashboardFilters;
  padariaNome?: string;
  totalPurchases: number;
  totalValue: number;
}

export function CommercialScopeSummary({ filters, padariaNome, totalPurchases, totalValue }: ScopeSummaryProps) {
  const scoped = Boolean(filters.padariaId);

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground shadow-elevated">
      <CardContent className="relative p-5 md:p-6">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-16 h-28 w-28 rounded-full bg-accent/30 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/75">Escopo administrativo</p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                {scoped ? padariaNome || "Padaria selecionada" : "Todas as padarias"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                {scoped
                  ? "Você está analisando uma padaria específica. Limpe o filtro para voltar à visão consolidada do Admin."
                  : "Visão consolidada do Admin com dados comerciais de todas as padarias participantes."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
              <p className="text-xs text-white/70">Notas no escopo</p>
              <p className="text-2xl font-bold">{totalPurchases.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
              <p className="text-xs text-white/70">Valor cadastrado</p>
              <p className="text-2xl font-bold">{brl(totalValue)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CommercialDashboardFilters({ filters, onChange, onRefresh, revealCustomerData, onToggleRevealCustomerData, options }: FiltersProps) {
  const update = (patch: CommercialDashboardFilters) => onChange({ ...filters, ...patch });
  const selectedBakery = options.padarias.find((item) => item.id === filters.padariaId);
  const selectedCampaign = options.campanhas.find((item) => item.id === filters.campaignId);

  const selectCampaign = (value: string) => {
    if (value === "all") {
      update({ campaignId: undefined });
      return;
    }

    const campaign = options.campanhas.find((item) => item.id === value);
    update({
      campaignId: value,
      startDate: campaign?.data_inicio || filters.startDate,
      endDate: campaign?.data_fim || filters.endDate,
    });
  };

  const clear = () => onChange({ startDate: filters.startDate, endDate: filters.endDate });

  return (
    <Card className="overflow-hidden border-primary/10 bg-card shadow-card">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" /> Filtros do Dashboard Comercial
            </CardTitle>
            <CardDescription>
              Primeiro escolha se deseja analisar todas as padarias ou uma padaria específica. Depois refine período, campanha e cliente.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground">
              {selectedBakery ? selectedBakery.nome : "Todas as padarias"}
            </Badge>
            {selectedCampaign && <Badge variant="secondary">{selectedCampaign.nome}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4 md:p-6">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-background p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="font-semibold">Escopo por padaria</h3>
              <p className="text-xs text-muted-foreground">Separado para o Admin alternar entre visão geral e análise individual.</p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label>Padaria analisada</Label>
              <Select value={filters.padariaId || "all"} onValueChange={(value) => update({ padariaId: value === "all" ? undefined : value })}>
                <SelectTrigger className="h-12 bg-background text-base font-medium">
                  <SelectValue placeholder="Todas as padarias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as padarias</SelectItem>
                  {options.padarias.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="h-12 border-primary/25" onClick={() => update({ padariaId: undefined })}>
              Ver todas as padarias
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-secondary" />
            <h3 className="font-semibold">Filtros avançados</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="date" value={filters.startDate?.slice(0, 10) || ""} onChange={(e) => update({ startDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="date" value={filters.endDate?.slice(0, 10) || ""} onChange={(e) => update({ endDate: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined })} />
            </div>
            <div className="space-y-2">
              <Label>Campanha</Label>
              <Select value={filters.campaignId || "all"} onValueChange={selectCampaign}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {options.campanhas.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={filters.clienteId || "all"} onValueChange={(value) => update({ clienteId: value === "all" ? undefined : value })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {options.clientes.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Atendente</Label>
              <Select value={filters.atendenteId || "all"} onValueChange={(value) => update({ atendenteId: value === "all" ? undefined : value })}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos atendentes</SelectItem>
                  {options.atendentes.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Ticket mín.</Label>
                <Input type="number" min="0" value={filters.minTicket ?? ""} onChange={(e) => update({ minTicket: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div className="space-y-2">
                <Label>Ticket máx.</Label>
                <Input type="number" min="0" value={filters.maxTicket ?? ""} onChange={(e) => update({ maxTicket: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button className="bg-gradient-to-r from-primary to-secondary shadow-card" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar dashboard
            </Button>
            <Button variant="outline" onClick={clear}>Limpar filtros avançados</Button>
            <Button
              variant={revealCustomerData ? "secondary" : "outline"}
              className="border-primary/25"
              onClick={onToggleRevealCustomerData}
            >
              {revealCustomerData ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {revealCustomerData ? "Ocultar dados dos clientes" : "Revelar nomes e WhatsApp"}
            </Button>
          </div>
          <div className="rounded-xl border border-primary/10 bg-muted/40 p-3 text-xs text-muted-foreground">
            {revealCustomerData
              ? "Dados completos de clientes visíveis para o Admin com base no consentimento LGPD informado."
              : "Por padrão, nomes e WhatsApp seguem mascarados. Use a opção acima quando precisar consultar os dados completos autorizados."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewCards({ overview }: { overview: OverviewData }) {
  const cards: Array<{ title: string; value: string; helper: string; icon: LucideIcon; tone: string }> = [
    { title: "Valor cadastrado", value: brl(overview.totalValue), helper: "Compras na campanha", icon: Receipt, tone: "from-primary/10 to-primary/5 text-primary" },
    { title: "Ticket médio", value: brl(overview.averageTicket), helper: "Média por nota", icon: TrendingUp, tone: "from-secondary/15 to-secondary/5 text-secondary" },
    { title: "Ticket mediano", value: brl(overview.medianTicket), helper: "Menos distorção", icon: BarChart3, tone: "from-accent/20 to-accent/5 text-accent-foreground" },
    { title: "Notas cadastradas", value: overview.totalPurchases.toLocaleString("pt-BR"), helper: "Volume registrado", icon: Receipt, tone: "from-primary/10 to-background text-primary" },
    { title: "Clientes únicos", value: overview.uniqueCustomers.toLocaleString("pt-BR"), helper: "Base no filtro", icon: Users, tone: "from-secondary/15 to-background text-secondary" },
    { title: "Taxa de recompra", value: pct(overview.repurchaseRate), helper: "Recorrência", icon: Users, tone: "from-accent/20 to-background text-accent-foreground" },
    { title: "Horário mais valioso", value: overview.mostValuableHour, helper: "Pico de valor", icon: Clock, tone: "from-primary/10 to-secondary/5 text-primary" },
    { title: "Categoria líder", value: overview.strongestCategory, helper: "OCR de itens", icon: Sparkles, tone: "from-secondary/15 to-accent/10 text-secondary" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, helper, icon: Icon, tone }) => (
        <Card key={title} className="group overflow-hidden border-primary/10 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
          <CardContent className="p-5">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 line-clamp-2 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function HourlyPerformanceChart({ data }: { data: HourlyData[] }) {
  const bestValue = [...data].sort((a, b) => b.totalValue - a.totalValue)[0];
  const bestVolume = [...data].sort((a, b) => b.purchases - a.purchases)[0];

  return (
    <DashboardCard title="Comportamento por horário" description="Usa a data/hora da compra extraída da nota fiscal." icon={Clock}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(v: number, n) => n === "totalValue" ? brl(v) : v} />
            <Bar dataKey="totalValue" name="Valor" radius={[6, 6, 0, 0]} fill={BRAND_RED} />
            <Bar dataKey="purchases" name="Notas" radius={[6, 6, 0, 0]} fill={BRAND_ORANGE} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2 md:grid-cols-3 text-sm">
        <Badge className="justify-center bg-primary text-primary-foreground">Maior valor: {bestValue?.label || "-"}</Badge>
        <Badge variant="secondary" className="justify-center">Maior fluxo: {bestVolume?.label || "-"}</Badge>
        <Badge variant="outline" className="justify-center border-accent/50">Oportunidade: fluxo alto + ticket menor</Badge>
      </div>
      <SimpleTable headers={["Hora", "Notas", "Valor", "Ticket", "% valor"]} rows={data.filter((h) => h.purchases > 0).sort((a, b) => b.totalValue - a.totalValue).slice(0, 8).map((h) => [h.label, h.purchases, brl(h.totalValue), brl(h.averageTicket), pct(h.valueShare)])} empty="Sem compras no período." />
    </DashboardCard>
  );
}

export function DailyPerformanceChart({ daily, weekdays }: { daily: DailyData[]; weekdays: WeekdayData[] }) {
  return (
    <DashboardCard title="Desempenho por dia" description="Valor, volume e ticket médio por data e dia da semana." icon={CalendarDays}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(v: number, n) => n === "totalValue" ? brl(v) : v} />
            <Line type="monotone" dataKey="totalValue" name="Valor" stroke={BRAND_RED} strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="purchases" name="Notas" stroke={BRAND_ORANGE} strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <WeekdayHeatmap data={weekdays} />
    </DashboardCard>
  );
}

export function WeekdayHeatmap({ data }: { data: WeekdayData[] }) {
  const max = Math.max(...data.map((d) => d.totalValue), 1);

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {data.map((day) => (
        <div key={day.weekday} className="rounded-xl border border-primary/10 p-3 shadow-sm" style={{ backgroundColor: `rgba(136, 8, 8, ${0.04 + (day.totalValue / max) * 0.16})` }}>
          <p className="text-xs font-medium capitalize">{day.weekday}</p>
          <p className="text-lg font-bold">{brl(day.totalValue)}</p>
          <p className="text-xs text-muted-foreground">{day.purchases} notas • ticket {brl(day.averageTicket)}</p>
        </div>
      ))}
    </div>
  );
}

export function TicketRangeChart({ data }: { data: TicketRangeData[] }) {
  return (
    <DashboardCard title="Faixas de ticket" description="Distribuição das compras cadastradas por valor." icon={BarChart3}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(v: number, n) => String(n).includes("Value") ? brl(v) : v} />
            <Bar dataKey="purchases" name="Notas" radius={[6, 6, 0, 0]} fill={BRAND_ORANGE} />
            <Bar dataKey="totalValue" name="Valor" radius={[6, 6, 0, 0]} fill={BRAND_RED} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SimpleTable headers={["Faixa", "Notas", "% notas", "Valor", "% valor", "Recompra"]} rows={data.map((r) => [r.label, r.purchases, pct(r.notesShare), brl(r.totalValue), pct(r.valueShare), pct(r.repurchaseRate)])} empty="Sem dados por faixa." />
    </DashboardCard>
  );
}

export function CategoryRankingChart({ data }: { data: CategoryData[] }) {
  return (
    <DashboardCard title="Categorias por OCR" description="Categorias estimadas a partir dos itens reconhecidos." icon={Sparkles}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 8)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="category" width={150} />
            <Tooltip formatter={(v: number, n) => n === "totalValue" ? brl(v) : v} />
            <Bar dataKey="totalValue" name="Valor" radius={[0, 6, 6, 0]}>
              {data.slice(0, 8).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}

export function ProductRankingTable({ products, combos }: { products: ProductData[]; combos: ComboData[] }) {
  return (
    <DashboardCard title="Produtos e combos" description="Ranking de produtos e associações frequentes detectadas no OCR." icon={Receipt}>
      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleTable headers={["Produto", "Categoria", "Notas", "Valor"]} rows={products.slice(0, 10).map((p) => [p.product, p.category, p.purchases, brl(p.totalValue)])} empty="Sem produtos extraídos." />
        <SimpleTable headers={["Combo", "Notas", "Ticket médio"]} rows={combos.slice(0, 10).map((c) => [c.combo, c.purchases, brl(c.averageTicket)])} empty="Sem combos suficientes." />
      </div>
    </DashboardCard>
  );
}

export function CustomerRankingTable({ title, customers, revealSensitiveData }: { title: string; customers: CustomerData[]; revealSensitiveData: boolean }) {
  return (
    <DashboardCard
      title={title}
      description={revealSensitiveData ? "Nomes e WhatsApp completos visíveis para Admin com consentimento LGPD." : "Dados pessoais mascarados para proteção de privacidade."}
      icon={Users}
    >
      <SimpleTable
        headers={["Cliente", "WhatsApp", "Notas", "Valor", "Ticket", "Status", "Última compra"]}
        rows={customers.map((c) => [
          revealSensitiveData ? c.nomeCompleto || c.nome : c.nome,
          revealSensitiveData ? c.whatsappCompleto || c.whatsapp : c.whatsapp,
          c.purchases,
          brl(c.totalValue),
          brl(c.averageTicket),
          c.status,
          dateLabel(c.lastPurchase),
        ])}
        empty="Sem clientes nesta segmentação."
      />
    </DashboardCard>
  );
}

export function CommercialInsightsCards({ insights }: { insights: string[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((insight, index) => (
        <Card key={insight} className="overflow-hidden border-primary/10 bg-gradient-to-br from-card to-primary/5 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Lightbulb className="h-4 w-4" />
              </span>
              Insight {index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{insight}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OcrQualityCard({ quality, paymentMethods }: { quality: OcrQualityData; paymentMethods: PaymentMethodData[] }) {
  return (
    <DashboardCard title="Qualidade dos dados" description="Auditoria de OCR, itens extraídos e pagamentos detectados." icon={ShieldCheck}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="OCR bruto válido" value={quality.validRaw} />
          <Metric label="OCR = raw" value={quality.rawLiteral} />
          <Metric label="Com itens" value={quality.withItems} />
          <Metric label="Sem itens" value={quality.withoutItems} />
          <Metric label="Cobertura de itens" value={pct(quality.itemCoverage)} />
          <Metric label="Possíveis duplicidades" value={quality.possibleDuplicates} />
        </div>
        <SimpleTable headers={["Pagamento", "Notas", "Valor", "Ticket"]} rows={paymentMethods.map((p) => [p.method, p.purchases, brl(p.totalValue), brl(p.averageTicket)])} empty="Pagamento não identificado." />
      </div>
    </DashboardCard>
  );
}

export function SuspiciousPurchasesTable({ rows }: { rows: SuspiciousData[] }) {
  return (
    <DashboardCard title="Compras suspeitas" description="Lista exclusiva para administração, com possíveis inconsistências ou duplicidades." icon={AlertTriangle} accent="orange">
      <SimpleTable headers={["ID", "Cliente", "Padaria", "Valor", "Data", "Motivo"]} rows={rows.map((r) => [r.id, r.cliente, r.padaria, brl(r.value), r.date, r.reason])} empty="Nenhuma suspeita relevante encontrada." />
    </DashboardCard>
  );
}

function DashboardCard({ title, description, icon: Icon, children, accent = "brand" }: { title: string; description: string; icon: LucideIcon; children: React.ReactNode; accent?: "brand" | "orange" }) {
  const iconClass = accent === "orange" ? "bg-orange-100 text-orange-700" : "bg-primary/10 text-primary";
  return (
    <Card className="overflow-hidden border-primary/10 bg-card shadow-card">
      <CardHeader className="border-b bg-gradient-to-r from-muted/60 to-background">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconClass}`}><Icon className="h-5 w-5" /></span>
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 md:p-6">{children}</CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-muted/60 to-background p-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function SimpleTable({ headers, rows, empty }: { headers: string[]; rows: Array<Array<string | number>>; empty: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-primary/10 bg-background/70">
      <Table>
        <TableHeader className="bg-muted/70">
          <TableRow>{headers.map((h) => <TableHead key={h} className="font-semibold text-foreground">{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row, idx) => (
            <TableRow key={idx} className="hover:bg-primary/5">
              {row.map((cell, cellIdx) => <TableCell key={`${idx}-${cellIdx}`} className={cellIdx > 1 ? "whitespace-nowrap" : undefined}>{cell}</TableCell>)}
            </TableRow>
          )) : (
            <TableRow><TableCell colSpan={headers.length} className="text-muted-foreground">{empty}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

import { AlertTriangle, BarChart3, Clock, Lightbulb, LucideIcon, Receipt, RefreshCw, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CommercialDashboardFilters } from "@/services/commercialDashboardService";


interface OverviewData { totalValue: number; averageTicket: number; medianTicket: number; totalPurchases: number; uniqueCustomers: number; repurchaseRate: number; mostValuableHour: string; strongestCategory: string }
interface HourlyData { hour: number; label: string; purchases: number; totalValue: number; averageTicket: number; valueShare: number }
interface DailyData { label: string; totalValue: number; purchases: number }
interface WeekdayData { weekday: string; totalValue: number; purchases: number; averageTicket: number }
interface TicketRangeData { label: string; purchases: number; notesShare: number; totalValue: number; valueShare: number; repurchaseRate: number }
interface CategoryData { category: string; totalValue: number }
interface ProductData { product: string; category: string; purchases: number; totalValue: number }
interface ComboData { combo: string; purchases: number; averageTicket: number }
interface CustomerData { nome: string; whatsapp: string; purchases: number; totalValue: number; averageTicket: number; status: string; lastPurchase: Date | null }
interface OcrQualityData { validRaw: number; rawLiteral: number; withItems: number; withoutItems: number; itemCoverage: number; possibleDuplicates: number }
interface PaymentMethodData { method: string; purchases: number; totalValue: number; averageTicket: number }
interface SuspiciousData { id: string; cliente: string; padaria: string; value: number; date: string; reason: string }

const COLORS = ["#2563eb", "#16a34a", "#f97316", "#9333ea", "#dc2626", "#0891b2", "#ca8a04", "#64748b"];
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;
const dateLabel = (date?: Date | null) => date ? date.toLocaleDateString("pt-BR") : "-";

interface FiltersProps {
  filters: CommercialDashboardFilters;
  onChange: (filters: CommercialDashboardFilters) => void;
  onRefresh: () => void;
  options: {
    padarias: Array<{ id: string; nome: string }>;
    clientes: Array<{ id: string; nome: string }>;
    atendentes: Array<{ id: string; nome: string }>;
    campanhas: Array<{ id: string; nome: string; data_inicio?: string | null; data_fim?: string | null }>;
  };
}

export function CommercialDashboardFilters({ filters, onChange, onRefresh, options }: FiltersProps) {
  const update = (patch: CommercialDashboardFilters) => onChange({ ...filters, ...patch });
  const selectCampaign = (value: string) => {
    if (value === "all") { update({ campaignId: undefined }); return; }
    const campaign = options.campanhas.find((item) => item.id === value);
    update({ campaignId: value, startDate: campaign?.data_inicio || filters.startDate, endDate: campaign?.data_fim || filters.endDate });
  };
  const clear = () => onChange({ startDate: filters.startDate, endDate: filters.endDate });

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Search className="h-4 w-4" /> Filtros do painel</CardTitle>
        <CardDescription>Filtre por período, padaria, cliente, atendente e faixa de ticket.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <div className="space-y-2"><Label>Início</Label><Input type="date" value={filters.startDate?.slice(0, 10) || ""} onChange={(e) => update({ startDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })} /></div>
        <div className="space-y-2"><Label>Fim</Label><Input type="date" value={filters.endDate?.slice(0, 10) || ""} onChange={(e) => update({ endDate: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined })} /></div>
        <div className="space-y-2"><Label>Padaria</Label><Select value={filters.padariaId || "all"} onValueChange={(value) => update({ padariaId: value === "all" ? undefined : value })}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as padarias</SelectItem>{options.padarias.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Campanha</Label><Select value={filters.campaignId || "all"} onValueChange={selectCampaign}><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as campanhas</SelectItem>{options.campanhas.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Cliente</Label><Select value={filters.clienteId || "all"} onValueChange={(value) => update({ clienteId: value === "all" ? undefined : value })}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os clientes</SelectItem>{options.clientes.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Atendente</Label><Select value={filters.atendenteId || "all"} onValueChange={(value) => update({ atendenteId: value === "all" ? undefined : value })}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos atendentes</SelectItem>{options.atendentes.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-2"><div className="space-y-2"><Label>Ticket mín.</Label><Input type="number" min="0" value={filters.minTicket ?? ""} onChange={(e) => update({ minTicket: e.target.value ? Number(e.target.value) : undefined })} /></div><div className="space-y-2"><Label>Ticket máx.</Label><Input type="number" min="0" value={filters.maxTicket ?? ""} onChange={(e) => update({ maxTicket: e.target.value ? Number(e.target.value) : undefined })} /></div></div>
        <div className="flex gap-2 md:col-span-2 xl:col-span-7"><Button onClick={onRefresh}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button><Button variant="outline" onClick={clear}>Limpar filtros</Button></div>
      </CardContent>
    </Card>
  );
}

export function OverviewCards({ overview }: { overview: OverviewData }) {
  const cards: Array<[string, string, LucideIcon]> = [
    ["Valor cadastrado", brl(overview.totalValue), Receipt],
    ["Ticket médio", brl(overview.averageTicket), BarChart3],
    ["Ticket mediano", brl(overview.medianTicket), BarChart3],
    ["Notas cadastradas", overview.totalPurchases.toLocaleString("pt-BR"), Receipt],
    ["Clientes únicos", overview.uniqueCustomers.toLocaleString("pt-BR"), Users],
    ["Taxa de recompra", pct(overview.repurchaseRate), Users],
    ["Horário mais valioso", overview.mostValuableHour, Clock],
    ["Categoria líder", overview.strongestCategory, Sparkles],
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([title, value, Icon]) => <Card key={title} className="bg-gradient-to-br from-background to-muted/30"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>)}</div>;
}

export function HourlyPerformanceChart({ data }: { data: HourlyData[] }) {
  const bestValue = [...data].sort((a, b) => b.totalValue - a.totalValue)[0];
  const bestVolume = [...data].sort((a, b) => b.purchases - a.purchases)[0];
  return <Card><CardHeader><CardTitle>Comportamento por horário</CardTitle><CardDescription>Usa a data/hora da compra extraída da nota fiscal.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip formatter={(v: number, n) => n === "totalValue" ? brl(v) : v} /><Bar dataKey="totalValue" name="Valor" fill="#2563eb" /><Bar dataKey="purchases" name="Notas" fill="#f97316" /></BarChart></ResponsiveContainer></div><div className="grid gap-2 md:grid-cols-3 text-sm"><Badge variant="secondary">Maior valor: {bestValue?.label || "-"}</Badge><Badge variant="outline">Maior fluxo: {bestVolume?.label || "-"}</Badge><Badge variant="outline">Oportunidade: compare fluxo alto com ticket menor</Badge></div><SimpleTable headers={["Hora", "Notas", "Valor", "Ticket", "% valor"]} rows={data.filter((h) => h.purchases > 0).sort((a, b) => b.totalValue - a.totalValue).slice(0, 8).map((h) => [h.label, h.purchases, brl(h.totalValue), brl(h.averageTicket), pct(h.valueShare)])} empty="Sem compras no período." /></CardContent></Card>;
}

export function DailyPerformanceChart({ daily, weekdays }: { daily: DailyData[]; weekdays: WeekdayData[] }) {
  return <Card><CardHeader><CardTitle>Desempenho por dia</CardTitle><CardDescription>Valor, volume e ticket médio por data e dia da semana.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip formatter={(v: number, n) => n === "totalValue" ? brl(v) : v} /><Line type="monotone" dataKey="totalValue" name="Valor" stroke="#2563eb" strokeWidth={2} /><Line type="monotone" dataKey="purchases" name="Notas" stroke="#f97316" strokeWidth={2} /></LineChart></ResponsiveContainer></div><WeekdayHeatmap data={weekdays} /></CardContent></Card>;
}

export function WeekdayHeatmap({ data }: { data: WeekdayData[] }) {
  const max = Math.max(...data.map((d) => d.totalValue), 1);
  return <div className="grid gap-2 md:grid-cols-7">{data.map((day) => <div key={day.weekday} className="rounded-lg border p-3" style={{ backgroundColor: `rgba(37, 99, 235, ${0.08 + (day.totalValue / max) * 0.24})` }}><p className="text-xs font-medium capitalize">{day.weekday}</p><p className="text-lg font-bold">{brl(day.totalValue)}</p><p className="text-xs text-muted-foreground">{day.purchases} notas • ticket {brl(day.averageTicket)}</p></div>)}</div>;
}

export function TicketRangeChart({ data }: { data: TicketRangeData[] }) {
  return <Card><CardHeader><CardTitle>Faixas de ticket</CardTitle><CardDescription>Distribuição das compras cadastradas por valor.</CardDescription></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip formatter={(v: number, n) => String(n).includes("Value") ? brl(v) : v} /><Bar dataKey="purchases" name="Notas" fill="#16a34a" /><Bar dataKey="totalValue" name="Valor" fill="#2563eb" /></BarChart></ResponsiveContainer></div><SimpleTable headers={["Faixa", "Notas", "% notas", "Valor", "% valor", "Recompra"]} rows={data.map((r) => [r.label, r.purchases, pct(r.notesShare), brl(r.totalValue), pct(r.valueShare), pct(r.repurchaseRate)])} empty="Sem dados por faixa." /></CardContent></Card>;
}

export function CategoryRankingChart({ data }: { data: CategoryData[] }) {
  return <Card><CardHeader><CardTitle>Categorias por OCR</CardTitle><CardDescription>Categorias estimadas a partir dos itens reconhecidos.</CardDescription></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.slice(0, 8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="category" width={150} /><Tooltip formatter={(v: number, n) => n === "totalValue" ? brl(v) : v} /><Bar dataKey="totalValue" name="Valor"><>{data.slice(0, 8).map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</></Bar></BarChart></ResponsiveContainer></div></CardContent></Card>;
}

export function ProductRankingTable({ products, combos }: { products: ProductData[]; combos: ComboData[] }) {
  return <Card><CardHeader><CardTitle>Produtos e combos</CardTitle><CardDescription>Ranking de produtos e associações frequentes detectadas no OCR.</CardDescription></CardHeader><CardContent className="grid gap-6 lg:grid-cols-2"><SimpleTable headers={["Produto", "Categoria", "Notas", "Valor"]} rows={products.slice(0, 10).map((p) => [p.product, p.category, p.purchases, brl(p.totalValue)])} empty="Sem produtos extraídos." /><SimpleTable headers={["Combo", "Notas", "Ticket médio"]} rows={combos.slice(0, 10).map((c) => [c.combo, c.purchases, brl(c.averageTicket)])} empty="Sem combos suficientes." /></CardContent></Card>;
}

export function CustomerRankingTable({ title, customers }: { title: string; customers: CustomerData[] }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>Dados pessoais mascarados para proteção de privacidade.</CardDescription></CardHeader><CardContent><SimpleTable headers={["Cliente", "WhatsApp", "Notas", "Valor", "Ticket", "Status", "Última compra"]} rows={customers.map((c) => [c.nome, c.whatsapp, c.purchases, brl(c.totalValue), brl(c.averageTicket), c.status, dateLabel(c.lastPurchase)])} empty="Sem clientes nesta segmentação." /></CardContent></Card>;
}

export function CommercialInsightsCards({ insights }: { insights: string[] }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{insights.map((insight, index) => <Card key={insight} className="border-primary/20"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="h-4 w-4 text-primary" /> Insight {index + 1}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{insight}</p></CardContent></Card>)}</div>;
}

export function OcrQualityCard({ quality, paymentMethods }: { quality: OcrQualityData; paymentMethods: PaymentMethodData[] }) {
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Qualidade dos dados</CardTitle><CardDescription>Auditoria de OCR, itens extraídos e pagamentos detectados.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="grid gap-3 sm:grid-cols-2"><Metric label="OCR bruto válido" value={quality.validRaw} /><Metric label="OCR = raw" value={quality.rawLiteral} /><Metric label="Com itens" value={quality.withItems} /><Metric label="Sem itens" value={quality.withoutItems} /><Metric label="Cobertura de itens" value={pct(quality.itemCoverage)} /><Metric label="Possíveis duplicidades" value={quality.possibleDuplicates} /></div><SimpleTable headers={["Pagamento", "Notas", "Valor", "Ticket"]} rows={paymentMethods.map((p) => [p.method, p.purchases, brl(p.totalValue), brl(p.averageTicket)])} empty="Pagamento não identificado." /></CardContent></Card>;
}

export function SuspiciousPurchasesTable({ rows }: { rows: SuspiciousData[] }) {
  return <Card className="border-orange-200"><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> Compras suspeitas</CardTitle><CardDescription>Lista exclusiva para administração, com possíveis inconsistências ou duplicidades.</CardDescription></CardHeader><CardContent><SimpleTable headers={["ID", "Cliente", "Padaria", "Valor", "Data", "Motivo"]} rows={rows.map((r) => [r.id, r.cliente, r.padaria, brl(r.value), r.date, r.reason])} empty="Nenhuma suspeita relevante encontrada." /></CardContent></Card>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>; }

function SimpleTable({ headers, rows, empty }: { headers: string[]; rows: Array<Array<string | number>>; empty: string }) {
  return <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow>{headers.map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length ? rows.map((row, idx) => <TableRow key={idx}>{row.map((cell, cellIdx) => <TableCell key={`${idx}-${cellIdx}`} className={cellIdx > 1 ? "whitespace-nowrap" : undefined}>{cell}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={headers.length} className="text-muted-foreground">{empty}</TableCell></TableRow>}</TableBody></Table></div>;
}

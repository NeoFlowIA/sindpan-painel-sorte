import { useMemo } from "react";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Store, Target, Users, Calendar, ArrowUpRight, AlertTriangle, CheckCircle2, UserX, PhoneOff, UsersRound } from "lucide-react";
import { useGraphQLQuery } from "@/hooks/useGraphQL";
import { GET_ADMIN_DASHBOARD_METRICS } from "@/graphql/queries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  });

const Index = () => {
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
    ["admin-dashboard-metrics"],
    GET_ADMIN_DASHBOARD_METRICS
  );

  const totalPadarias = (metricsData as any)?.padarias_aggregate?.aggregate?.count || 0;
  const totalCupons = (metricsData as any)?.cupons_aggregate?.aggregate?.count || 0;
  const totalClientes = (metricsData as any)?.clientes_aggregate?.aggregate?.count || 0;

  const calcularCrescimento = () => {
    if (!(metricsData as any)?.cupons) return { value: 0, isPositive: true };

    const agora = new Date();
    const trintaDiasAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sessentaDiasAtras = new Date(agora.getTime() - 60 * 24 * 60 * 60 * 1000);

    const cuponsUltimos30 = (metricsData as any).cupons.filter((c: any) => {
      const data = new Date(c.data_compra);
      return data >= trintaDiasAtras && data <= agora;
    }).length;

    const cupons30Anteriores = (metricsData as any).cupons.filter((c: any) => {
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

  const proximoSorteio = (metricsData as any)?.proximo_sorteio?.[0];
  const proximoSorteioData = proximoSorteio
    ? format(new Date(proximoSorteio.data_sorteio), "dd/MM", { locale: ptBR })
    : "--/--";
  const proximoSorteioLabel = proximoSorteio
    ? format(new Date(proximoSorteio.data_sorteio), "EEEE", { locale: ptBR })
    : "Não agendado";

  const financialData = useMemo(
    () => [
      { mes: "Mai", entradas: 42000, saidas: 28500 },
      { mes: "Jun", entradas: 45500, saidas: 29800 },
      { mes: "Jul", entradas: 47000, saidas: 31200 },
      { mes: "Ago", entradas: 48800, saidas: 32500 },
      { mes: "Set", entradas: 50200, saidas: 33900 }
    ],
    []
  );

  const baseEmpresas = {
    total: 146,
    associadas: 104,
    naoAssociadas: 42,
    novasMes: 6,
    saidas90d: 2
  };

  const inadimplentesTop10 = useMemo(
    () => [
      { id: 1, empresa: "Estilo Nordeste", atrasos: 3, valor: 4500, vencimento: "2025-09-10" },
      { id: 2, empresa: "Costura Viva", atrasos: 2, valor: 3200, vencimento: "2025-09-12" },
      { id: 3, empresa: "Confecções Aurora", atrasos: 2, valor: 2900, vencimento: "2025-09-14" },
      { id: 4, empresa: "ModaSul", atrasos: 1, valor: 850, vencimento: "2025-09-05" },
      { id: 5, empresa: "Aurora Kids", atrasos: 1, valor: 600, vencimento: "2025-09-08" }
    ].sort((a, b) => b.valor - a.valor),
    []
  );

  const saudeCadastros = {
    incompletos: 12,
    semLogo: 5,
    semResponsavel: 3,
    semWhatsapp: 2,
    semColaboradores: 4
  };

  const mapaInadimplencia = {
    emDia: 78,
    ate30: 12,
    ate60: 6,
    acima60: 4,
    totalAberto: 120_500
  };

  return (
    <div className="space-y-6 rounded-2xl bg-[#F7F8F4] p-4 md:p-6 border border-[#E1E8D3] text-[#1C1C1C]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-[#4B4B4B]">
            Visão ampliada de gestão e finanças das empresas vinculadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-[#4B4B4B]">Próximo sorteio</p>
            <p className="text-sm font-semibold">{proximoSorteioData}</p>
            <p className="text-xs text-[#4B4B4B]">{proximoSorteioLabel}</p>
          </div>
          <div className="hidden md:block h-12 w-px bg-[#E1E8D3]" aria-hidden />
          <div className="flex items-center gap-2 text-sm text-[#4B4B4B]">
            <CheckCircle2 className="w-4 h-4 text-[#7E8C5E]" />
            Atualizado automaticamente
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
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
              value={totalCupons.toLocaleString("pt-BR")}
              subtitle="Total no sistema"
              icon={Target}
              variant="secondary"
              trend={crescimento}
            />
            <KPICard
              title="Participantes Únicos"
              value={totalClientes.toLocaleString("pt-BR")}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-white border-[#E1E8D3] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Visão Geral Financeira</CardTitle>
              <CardDescription className="text-[#4B4B4B]">Entradas x saídas (últimos 5 meses)</CardDescription>
            </div>
            <Badge className="bg-[#7E8C5E] text-white">Saudável</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={financialData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid stroke="#E1E8D3" strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fill: "#4B4B4B" }} tickLine={false} axisLine={{ stroke: "#E1E8D3" }} />
                <YAxis tick={{ fill: "#4B4B4B" }} tickLine={false} axisLine={{ stroke: "#E1E8D3" }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E1E8D3", borderRadius: 8 }}
                />
                <Legend />
                <Area type="monotone" dataKey="entradas" stroke="#7E8C5E" fill="#7E8C5E33" strokeWidth={2.2} name="Entradas" />
                <Area type="monotone" dataKey="saidas" stroke="#E4B75E" fill="#E4B75E33" strokeWidth={2.2} name="Saídas" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="flex flex-col rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] p-3">
                <span className="text-xs text-[#4B4B4B]">Recebido no mês</span>
                <strong className="text-lg">{formatCurrency(50200)}</strong>
                <span className="text-xs text-[#7E8C5E] font-medium">+6% vs mês anterior</span>
              </div>
              <div className="flex flex-col rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] p-3">
                <span className="text-xs text-[#4B4B4B]">Saídas previstas</span>
                <strong className="text-lg">{formatCurrency(33900)}</strong>
                <span className="text-xs text-[#7E8C5E] font-medium">Fluxo controlado</span>
              </div>
              <div className="flex flex-col rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] p-3">
                <span className="text-xs text-[#4B4B4B]">Saldo projetado</span>
                <strong className="text-lg">{formatCurrency(16300)}</strong>
                <span className="text-xs text-[#7E8C5E] font-medium">Cobertura de 38 dias</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E1E8D3] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#F0F3E6] text-[#7E8C5E]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Base de Empresas</CardTitle>
                <CardDescription className="text-[#4B4B4B]">Visão rápida da carteira</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-[#E1E8D3] text-[#7E8C5E] bg-[#F7F8F4]">Atualizado hoje</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E1E8D3] bg-[#F7F8F4] p-4">
                <p className="text-sm text-[#4B4B4B]">Empresas cadastradas</p>
                <p className="text-3xl font-bold mt-1">{baseEmpresas.total}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-[#7E8C5E]">
                    <CheckCircle2 className="w-4 h-4" /> {baseEmpresas.associadas} associadas
                  </span>
                  <span className="flex items-center gap-1 text-[#4B4B4B]">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> {baseEmpresas.naoAssociadas} não associadas
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E1E8D3] bg-[#F7F8F4] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#4B4B4B]">Novas no mês</p>
                  <Badge className="bg-[#7E8C5E] text-white">+{baseEmpresas.novasMes}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#4B4B4B]">Saíram nos últimos 3 meses</p>
                  <Badge variant="outline" className="border-[#E1E8D3] text-[#1C1C1C] bg-white">{baseEmpresas.saidas90d}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4B4B4B]">
                  <ArrowUpRight className="w-4 h-4 text-[#7E8C5E]" />
                  Crescimento líquido positivo
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="bg-white border-[#E1E8D3] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Mapa de Inadimplência</CardTitle>
              <CardDescription className="text-[#4B4B4B]">Resumo consolidado por faixa</CardDescription>
            </div>
            <Badge variant="outline" className="border-[#E1E8D3] text-[#7E8C5E] bg-[#F7F8F4]">
              {formatCurrency(mapaInadimplencia.totalAberto)} em aberto
            </Badge>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{
                label: "Em dia",
                value: mapaInadimplencia.emDia,
                color: "bg-[#7E8C5E]",
                tone: "text-white"
              }, {
                label: "Até 30d",
                value: mapaInadimplencia.ate30,
                color: "bg-amber-200",
                tone: "text-amber-800"
              }, {
                label: "Até 60d",
                value: mapaInadimplencia.ate60,
                color: "bg-amber-300",
                tone: "text-amber-900"
              }, {
                label: "> 60d",
                value: mapaInadimplencia.acima60,
                color: "bg-red-200",
                tone: "text-red-800"
              }].map((item) => (
                <div key={item.label} className="rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] p-3">
                  <p className="text-xs text-[#4B4B4B]">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}%</p>
                  <span className={`inline-flex mt-2 w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${item.color} ${item.tone}`}>
                    {item.value >= 70 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} Status
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold">Distribuição dos atrasos</p>
              <div className="h-3 w-full rounded-full bg-[#E1E8D3] overflow-hidden" aria-label="Distribuição de atrasos">
                <div className="flex h-full w-full">
                  <span className="bg-[#7E8C5E]" style={{ width: `${mapaInadimplencia.emDia}%` }} aria-hidden />
                  <span className="bg-amber-200" style={{ width: `${mapaInadimplencia.ate30}%` }} aria-hidden />
                  <span className="bg-amber-300" style={{ width: `${mapaInadimplencia.ate60}%` }} aria-hidden />
                  <span className="bg-red-200" style={{ width: `${mapaInadimplencia.acima60}%` }} aria-hidden />
                </div>
              </div>
              <p className="text-xs text-[#4B4B4B]">Monitorar faixas críticas garante priorização das cobranças.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E1E8D3] shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Saúde dos Cadastros</CardTitle>
              <CardDescription className="text-[#4B4B4B]">Itens pendentes para completude</CardDescription>
            </div>
            <Badge className="bg-[#7E8C5E] text-white">Monitoramento ativo</Badge>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {[{
              label: "Empresas com dados incompletos",
              value: saudeCadastros.incompletos,
              icon: AlertTriangle,
            }, {
              label: "Sem logo",
              value: saudeCadastros.semLogo,
              icon: Building,
            }, {
              label: "Sem responsável",
              value: saudeCadastros.semResponsavel,
              icon: UserX,
            }, {
              label: "Sem WhatsApp",
              value: saudeCadastros.semWhatsapp,
              icon: PhoneOff,
            }, {
              label: "Sem colaboradores",
              value: saudeCadastros.semColaboradores,
              icon: UsersRound,
            }].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-[#E1E8D3] bg-[#F7F8F4] px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white border border-[#E1E8D3]">
                    <item.icon className="w-4 h-4 text-[#7E8C5E]" aria-hidden />
                  </div>
                  <p className="text-sm">{item.label}</p>
                </div>
                <Badge variant="secondary" className="bg-white text-[#1C1C1C] border-[#E1E8D3]">{item.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-[#E1E8D3] shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Empresas inadimplentes (Top 10)</CardTitle>
            <CardDescription className="text-[#4B4B4B]">Ordenado por valor total em atraso</CardDescription>
          </div>
          <Badge variant="outline" className="border-[#E1E8D3] bg-[#F7F8F4] text-[#1C1C1C]">
            Atualizado diariamente
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-[#E1E8D3] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F7F8F4]">
                <TableRow>
                  <TableHead className="text-[#4B4B4B]">Empresa</TableHead>
                  <TableHead className="text-[#4B4B4B]">Atrasos</TableHead>
                  <TableHead className="text-[#4B4B4B]">Valor total</TableHead>
                  <TableHead className="text-[#4B4B4B]">Último vencimento</TableHead>
                  <TableHead className="text-right text-[#4B4B4B]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inadimplentesTop10.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F7F8F4]">
                    <TableCell className="font-semibold">{item.empresa}</TableCell>
                    <TableCell>{item.atrasos} boletos</TableCell>
                    <TableCell className="font-bold text-[#1C1C1C]">{formatCurrency(item.valor)}</TableCell>
                    <TableCell>
                      {format(new Date(item.vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button asChild variant="outline" size="sm" className="border-[#E1E8D3]">
                        <Link to={`/empresas?id=${item.id}`}>Ver empresa</Link>
                      </Button>
                      <Button asChild size="sm" className="bg-[#7E8C5E] hover:bg-[#6f7a52] text-white">
                        <Link to={`/financeiro/boletos?empresa=${item.id}`}>Ver boletos</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between text-sm text-[#4B4B4B]">
            <span>Priorize negociações acima de 30 dias para reduzir risco.</span>
            <Link to="/financeiro" className="text-[#7E8C5E] font-semibold hover:underline">
              Ver todas no Financeiro
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#E1E8D3] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações rápidas</CardTitle>
          <CardDescription className="text-[#4B4B4B]">Atalhos para ações imediatas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="justify-start border-[#E1E8D3] bg-[#F7F8F4] text-[#1C1C1C] hover:bg-[#e8eadf]">
              <Link to="/financeiro/boletos">Registrar cobrança</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start border-[#E1E8D3] bg-[#F7F8F4] text-[#1C1C1C] hover:bg-[#e8eadf]">
              <Link to="/empresas">Atualizar cadastro</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start border-[#E1E8D3] bg-[#F7F8F4] text-[#1C1C1C] hover:bg-[#e8eadf]">
              <Link to="/sorteios">Ver agenda de sorteios</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start border-[#E1E8D3] bg-[#F7F8F4] text-[#1C1C1C] hover:bg-[#e8eadf]">
              <Link to="/relatorios">Exportar relatórios</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;

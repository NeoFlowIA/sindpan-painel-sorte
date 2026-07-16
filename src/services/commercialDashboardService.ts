import { graphqlClient } from "@/lib/graphql-client";
import { normalizePurchase, RawPurchase, NormalizedPurchase } from "@/utils/commercialMetrics";

export interface CommercialDashboardFilters {
  padariaId?: string;
  padariaCnpj?: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  clienteId?: string;
  atendenteId?: string;
  minTicket?: number;
  maxTicket?: number;
  includeAuditados?: boolean;
  includeOcrRaw?: boolean;
  groupBy?: string;
}

export interface CommercialDashboardScope {
  mode?: "admin" | "bakery";
  forcedPadariaId?: string;
}

export interface CommercialDashboardOptions {
  padarias: Array<{ id: string; nome: string; cnpj?: string | null }>;
  clientes: Array<{ id: string; nome: string }>;
  atendentes: Array<{ id: string; nome: string }>;
  campanhas: Array<{ id: string; nome: string; data_inicio?: string | null; data_fim?: string | null }>;
}

const GET_COMMERCIAL_PURCHASES = `
  query GetCommercialPurchases($startDate: timestamptz, $endDate: timestamptz, $padariaId: uuid, $clienteId: uuid, $atendenteId: uuid, $limit: Int = 5000) {
    compras(
      where: {
        create_at: {_gte: $startDate, _lte: $endDate}
        padaria_id: {_eq: $padariaId}
        cliente_id: {_eq: $clienteId}
        atendente_id: {_eq: $atendenteId}
      }
      limit: $limit
      order_by: {create_at: desc}
    ) {
      id
      valor_centavos
      data_compra
      create_at
      cnpj_extraido
      ocr_confidence
      ocr_raw
      image_url
      chave_acesso
      hash_idempotencia
      cliente_id
      padaria_id
      atendente_id
      cliente { id nome whatsapp }
      padaria { id nome cnpj }
      atendente { id nome }
    }
  }
`;

const GET_COMMERCIAL_PURCHASES_LOOSE = `
  query GetCommercialPurchasesLoose($startDate: timestamptz, $endDate: timestamptz, $limit: Int = 5000) {
    compras(where: {create_at: {_gte: $startDate, _lte: $endDate}}, limit: $limit, order_by: {create_at: desc}) {
      id
      valor_centavos
      data_compra
      create_at
      cnpj_extraido
      ocr_confidence
      ocr_raw
      image_url
      chave_acesso
      hash_idempotencia
      cliente_id
      padaria_id
      atendente_id
      cliente { id nome whatsapp }
      padaria { id nome cnpj }
      atendente { id nome }
    }
  }
`;

const GET_COMMERCIAL_OPTIONS = `
  query GetCommercialOptions {
    padarias(order_by: {nome: asc}) { id nome cnpj }
    clientes(order_by: {nome: asc}, limit: 1000) { id nome }
    atendentes(order_by: {nome: asc}, limit: 1000) { id nome }
    campanha(order_by: {data_inicio: desc}, limit: 100) { id Nome data_inicio data_fim }
  }
`;

const mockRaw = `\`\`\`json
[{"text":"PANIFICADORA MM LTDA\nCNPJ:01.755.085/0001-80\n# Código Descrição Qtde Un Valor unit. Valor total\n001 216 COXINHA GRANDE DE FRANGO 120G 1 UN X 8,50 8,50\n002 227 ENR DE SALSICHA 160G 1 UN X 7,10 7,10\n003 181 MARIA MALUCA 0,200 KG X 24,83 4,97\n004 1 PAO CARIOCA 0,258 KG X 21,55 5,56\nQtde. total de itens 004\nValor total R$ 26,13\nFORMA DE PAGAMENTO\nPIX - Dinâmico\n26/05/2026 10:05:54","cnpj":"01.755.085/0001-80","valor":26.13,"ok":true}]
\`\`\``;

const mockPurchases: RawPurchase[] = [
  { id: "mock-1", valor_centavos: 2613, data_compra: "2026-05-26T10:05:54", create_at: "2026-05-26T10:10:00", cnpj_extraido: "01755085000180", ocr_confidence: 0.92, ocr_raw: mockRaw, cliente_id: "c1", padaria_id: "p1", atendente_id: "a1", chave_acesso: "23260501755085000180650120001750581122524227", hash_idempotencia: "h1", cliente: { id: "c1", nome: "Maria Silva", whatsapp: "85999998888" }, padaria: { id: "p1", nome: "Panificadora MM", cnpj: "01755085000180" }, atendente: { id: "a1", nome: "Ana" } },
  { id: "mock-2", valor_centavos: 7850, data_compra: "2026-05-27T12:20:00", create_at: "2026-05-27T12:24:00", ocr_raw: "REFEICAO SELF SERVICE 45,00\nSUCO CAJU 8,00\nBOLO DE CHOCOLATE 24,50\nValor total R$ 78,50\nCartão de Debito\n27/05/2026 12:20:00", cliente_id: "c2", padaria_id: "p1", atendente_id: "a2", cliente: { id: "c2", nome: "João Pereira", whatsapp: "85988887777" }, padaria: { id: "p1", nome: "Panificadora MM", cnpj: "01755085000180" }, atendente: { id: "a2", nome: "Bia" } },
  { id: "mock-3", valor_centavos: 4250, data_compra: "2026-05-28T17:45:00", create_at: "2026-05-28T18:00:00", ocr_raw: "CAFE EXPRESSO 7,50\nCOXINHA 8,50\nPAO CARIOCA 6,00\nQUEIJO 20,50\nValor total R$ 42,50\nPIX", cliente_id: "c1", padaria_id: "p1", atendente_id: "a1", cliente: { id: "c1", nome: "Maria Silva", whatsapp: "85999998888" }, padaria: { id: "p1", nome: "Panificadora MM", cnpj: "01755085000180" }, atendente: { id: "a1", nome: "Ana" } },
  { id: "mock-4", valor_centavos: 980, data_compra: "2026-05-28T16:10:00", create_at: "2026-05-28T16:12:00", ocr_raw: "raw", cliente_id: "c3", padaria_id: "p2", atendente_id: "a3", cliente: { id: "c3", nome: "Carla Lima", whatsapp: "85977776666" }, padaria: { id: "p2", nome: "Padaria Experimental", cnpj: "00000000000000" }, atendente: { id: "a3", nome: "Carlos" } },
  { id: "mock-5", valor_centavos: 13690, data_compra: "2026-05-29T19:30:00", create_at: "2026-05-30T08:00:00", ocr_raw: "ALMOCO 65,00\nREFRIGERANTE COCA 12,00\nTORTA DOCE 58,90\nValor total R$ 136,90\nDinheiro", cliente_id: "c2", padaria_id: "p1", atendente_id: "a2", hash_idempotencia: "h5", cliente: { id: "c2", nome: "João Pereira", whatsapp: "85988887777" }, padaria: { id: "p1", nome: "Panificadora MM", cnpj: "01755085000180" }, atendente: { id: "a2", nome: "Bia" } },
  { id: "mock-6", valor_centavos: 13690, data_compra: "2026-05-29T19:31:00", create_at: "2026-05-30T08:02:00", ocr_raw: "Aprovado manualmente via painel de auditoria", cliente_id: "c2", padaria_id: "p1", atendente_id: "a2", hash_idempotencia: "h5", cliente: { id: "c2", nome: "João Pereira", whatsapp: "85988887777" }, padaria: { id: "p1", nome: "Panificadora MM", cnpj: "01755085000180" }, atendente: { id: "a2", nome: "Bia" } },
];

// A consulta do Hasura busca pelo cadastro (create_at), mas os filtros comerciais continuam usando data_compra.
function applyClientFilters(purchases: RawPurchase[], filters: CommercialDashboardFilters) {
  return purchases.filter((purchase) => {
    const value = Number(purchase.valor_centavos || 0) / 100;
    const date = purchase.data_compra ? new Date(purchase.data_compra) : null;
    if (filters.padariaId && String(purchase.padaria_id) !== filters.padariaId) return false;
    if (filters.padariaCnpj && (purchase.padaria?.cnpj || purchase.cnpj_extraido || "").replace(/\D/g, "") !== filters.padariaCnpj.replace(/\D/g, "")) return false;
    if (filters.clienteId && String(purchase.cliente_id) !== filters.clienteId) return false;
    if (filters.atendenteId && String(purchase.atendente_id) !== filters.atendenteId) return false;
    if (filters.startDate && date && date < new Date(filters.startDate)) return false;
    if (filters.endDate && date && date > new Date(filters.endDate)) return false;
    if (filters.minTicket !== undefined && value < filters.minTicket) return false;
    if (filters.maxTicket !== undefined && value > filters.maxTicket) return false;
    return true;
  });
}

export async function fetchCommercialPurchases(filters: CommercialDashboardFilters, scope: CommercialDashboardScope = {}): Promise<{ purchases: NormalizedPurchase[]; source: "api" | "mock" }> {
  const scopedFilters = scope.forcedPadariaId ? { ...filters, padariaId: scope.forcedPadariaId } : filters;
  const variables = {
    startDate: scopedFilters.startDate || null,
    endDate: scopedFilters.endDate || null,
    padariaId: scopedFilters.padariaId || null,
    clienteId: scopedFilters.clienteId || null,
    atendenteId: scopedFilters.atendenteId || null,
    limit: 5000,
  };

  try {
    let rawPurchases: RawPurchase[] = [];
    if (scope.forcedPadariaId) {
      const data = await graphqlClient.query<{ compras: RawPurchase[] }>(GET_COMMERCIAL_PURCHASES, variables);
      rawPurchases = data.compras || [];
    } else {
      try {
        const loose = await graphqlClient.query<{ compras: RawPurchase[] }>(GET_COMMERCIAL_PURCHASES_LOOSE, { startDate: variables.startDate, endDate: variables.endDate, limit: 5000 });
        rawPurchases = loose.compras || [];
      } catch (error) {
        console.warn("Consulta comercial ampla falhou; tentando consulta parametrizada compatível.", error);
        const data = await graphqlClient.query<{ compras: RawPurchase[] }>(GET_COMMERCIAL_PURCHASES, variables);
        rawPurchases = data.compras || [];
      }
    }
    return { purchases: applyClientFilters(rawPurchases, scopedFilters).map(normalizePurchase), source: "api" };
  } catch (error) {
    console.warn("Dashboard Comercial usando dados mockados de fallback.", error);
    return { purchases: applyClientFilters(mockPurchases, scopedFilters).map(normalizePurchase), source: "mock" };
  }
}

function scopeOptions(options: CommercialDashboardOptions, scope: CommercialDashboardScope): CommercialDashboardOptions {
  if (!scope.forcedPadariaId) return options;
  const scopedRaw = mockPurchases.filter((purchase) => String(purchase.padaria_id) === scope.forcedPadariaId);
  return {
    padarias: options.padarias.filter((padaria) => padaria.id === scope.forcedPadariaId),
    clientes: options.clientes.filter((cliente) => scopedRaw.some((purchase) => String(purchase.cliente_id) === cliente.id)),
    atendentes: options.atendentes.filter((atendente) => scopedRaw.some((purchase) => String(purchase.atendente_id) === atendente.id)),
    campanhas: options.campanhas,
  };
}

export async function fetchCommercialDashboardOptions(scope: CommercialDashboardScope = {}): Promise<CommercialDashboardOptions> {
  try {
    const data = await graphqlClient.query<CommercialDashboardOptions>(GET_COMMERCIAL_OPTIONS);
    return scopeOptions({ padarias: data.padarias || [], clientes: data.clientes || [], atendentes: data.atendentes || [], campanhas: ((data as unknown as { campanha?: Array<{ id: string; Nome?: string; nome?: string; data_inicio?: string | null; data_fim?: string | null }> }).campanha || []).map((c) => ({ id: String(c.id), nome: c.Nome || c.nome || `Campanha ${c.id}`, data_inicio: c.data_inicio, data_fim: c.data_fim })) }, scope);
  } catch {
    return scopeOptions({
      padarias: Array.from(new Map(mockPurchases.map((p) => [String(p.padaria_id), { id: String(p.padaria_id), nome: p.padaria?.nome || "Padaria", cnpj: p.padaria?.cnpj }])).values()),
      clientes: Array.from(new Map(mockPurchases.map((p) => [String(p.cliente_id), { id: String(p.cliente_id), nome: p.cliente?.nome || "Cliente" }])).values()),
      atendentes: Array.from(new Map(mockPurchases.map((p) => [String(p.atendente_id), { id: String(p.atendente_id), nome: p.atendente?.nome || "Atendente" }])).values()),
      campanhas: [{ id: "mock-campanha", nome: "Campanha experimental", data_inicio: "2026-05-01T00:00:00.000Z", data_fim: "2026-06-30T23:59:59.999Z" }],
    }, scope);
  }
}

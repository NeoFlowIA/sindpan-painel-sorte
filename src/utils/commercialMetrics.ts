import { differenceInCalendarDays, format, isValid, parse, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PaymentMethod = "PIX" | "Dinheiro" | "Cartão de crédito" | "Cartão de débito" | "Voucher/benefício" | "Não identificado";

export interface RawPurchase {
  id?: string | number;
  valor_centavos?: number | string | null;
  data_compra?: string | null;
  create_at?: string | null;
  created_at?: string | null;
  cnpj_extraido?: string | null;
  ocr_confidence?: number | string | null;
  ocr_raw?: string | null;
  image_url?: string | null;
  cliente_id?: string | number | null;
  padaria_id?: string | number | null;
  atendente_id?: string | number | null;
  chave_acesso?: string | null;
  hash_idempotencia?: string | null;
  cliente?: { id?: string | number; nome?: string | null; whatsapp?: string | null } | null;
  padaria?: { id?: string | number; nome?: string | null; cnpj?: string | null } | null;
  atendente?: { id?: string | number; nome?: string | null } | null;
}

export interface ParsedOcrItem {
  codigo?: string | null;
  descricaoOriginal: string;
  descricaoNormalizada: string;
  quantidade: number | null;
  unidade: string | null;
  valorUnitario: number | null;
  valorTotal: number | null;
  categoria: string;
  confidence: number;
}

export interface ParsedOcr {
  cnpj: string | null;
  valorTotal: number | null;
  dataCompra: string | null;
  formaPagamento: PaymentMethod;
  itens: ParsedOcrItem[];
  parserStatus: "parsed" | "partial" | "no_items_found" | "empty";
  parserConfidence: number;
  textoUtil: string;
}

export interface NormalizedPurchase extends RawPurchase {
  id: string;
  valorReais: number;
  dataCompra: Date | null;
  createAt: Date | null;
  clienteKey: string;
  clienteNomeMascarado: string;
  whatsappMascarado: string;
  clienteNomeCompleto: string;
  whatsappCompleto: string;
  padariaNome: string;
  padariaCnpj?: string | null;
  parsedOcr: ParsedOcr;
}

export interface TicketRange { label: string; min: number; max: number | null }
export interface InsightParams {
  ticketThreshold?: number;
  vipValueThreshold?: number;
  inactivityDays?: number;
  highTicketPercentile?: number;
  minOccurrencesForProductInsight?: number;
  minOccurrencesForComboInsight?: number;
}

export const DEFAULT_TICKET_RANGES: TicketRange[] = [
  { label: "até R$ 10", min: 0, max: 10 },
  { label: "R$ 10 a R$ 20", min: 10, max: 20 },
  { label: "R$ 20 a R$ 40", min: 20, max: 40 },
  { label: "R$ 40 a R$ 80", min: 40, max: 80 },
  { label: "acima de R$ 80", min: 80, max: null },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Pães, biscoitos e massas": ["PAO", "PÃO", "BISNAGA", "BRIOCHE", "CARIOCA", "CARIOQUINHA", "SOVADO", "LEITE", "TORRADA", "TAPIOCA", "MASSA"],
  "Refeições/pratos": ["REFEICAO", "REFEIÇÃO", "ALMOCO", "ALMOÇO", "JANTAR", "SELF SERVICE", "PRATO", "CALDO", "SOPA", "COMIDA"],
  "Salgados e lanches": ["COXINHA", "SALGADO", "ENROLADO", "ENR ", "PASTEL", "ESFIRRA", "EMPADA", "HAMBURGUER", "SANDUICHE", "LANCHE", "PIZZA"],
  "Doces e sobremesas": ["BOLO", "TORTA", "DOCE", "DOCINHO", "BEM CASADO", "CHOCOLATE", "PUDIM", "SOBREMESA", "MARIA MALUCA", "PAMONHA", "CANJICA"],
  "Bebidas frias": ["COCA", "REFRI", "REFRIGERANTE", "SUCO", "AGUA", "ÁGUA", "GUARANA", "GUARANÁ", "ENERGETICO", "ENERGÉTICO", "CAJU"],
  "Cafés/bebidas quentes": ["CAFE", "CAFÉ", "CAPPUCCINO", "CHOCOLATE QUENTE", "COADO", "EXPRESSO"],
  "Frios e complementos": ["QUEIJO", "PRESUNTO", "PATÊ", "PATE", "MORTADELA", "SALAME", "REQUEIJAO", "REQUEIJÃO"],
  Mercearia: ["ACUCAR", "AÇÚCAR", "ARROZ", "FEIJAO", "FEIJÃO", "FARINHA", "OLEO", "ÓLEO", "BISCOITO", "BOLACHA"],
};

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const PEAK_HOURS = Array.from({ length: 17 }, (_, index) => index + 6);

const stripAccents = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalizeToken = (text: string) => stripAccents(text).toUpperCase().replace(/\s+/g, " ").trim();
const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/R\$/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const percent = (part: number, total: number) => total > 0 ? (part / total) * 100 : 0;
const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
};
const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const direct = new Date(value);
  if (isValid(direct)) return direct;
  const br = parse(value, "dd/MM/yyyy HH:mm:ss", new Date());
  return isValid(br) ? br : null;
};

export function maskCustomerName(name?: string | null) {
  if (!name?.trim()) return "Cliente não identificado";
  return name.trim().split(/\s+/).map((part, idx) => idx === 0 ? `${part[0]}${"*".repeat(Math.max(1, part.length - 1))}` : `${part[0]}***`).join(" ");
}

export function maskWhatsapp(whatsapp?: string | null) {
  const digits = (whatsapp || "").replace(/\D/g, "");
  if (digits.length < 6) return "WhatsApp não informado";
  return `(**) *****-${digits.slice(-4)}`;
}

export function formatWhatsapp(whatsapp?: string | null) {
  const digits = (whatsapp || "").replace(/\D/g, "");
  if (!digits) return "WhatsApp não informado";
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return whatsapp?.trim() || digits;
}

function extractUsefulText(raw?: string | null): string {
  if (!raw || raw.trim().toLowerCase() === "raw") return "";
  let text = raw.trim().replace(/^```(?:json|txt)?/i, "").replace(/```$/g, "").trim();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) text = parsed.map((item) => item?.text || JSON.stringify(item)).join("\n");
    else if (parsed && typeof parsed === "object") text = (parsed as { text?: string }).text || JSON.stringify(parsed);
  } catch {
    text = text.replace(/^Aqui está o resultado do OCR[:\s]*/i, "");
  }
  return text.replace(/\\n/g, "\n").replace(/\\"/g, '"');
}

function categorize(description: string) {
  const normalized = normalizeToken(description);
  const found = Object.entries(CATEGORY_KEYWORDS).find(([, words]) => words.some((word) => normalized.includes(normalizeToken(word))));
  return found?.[0] || "Outros";
}

function normalizeDescription(description: string) {
  return description
    .replace(/\bENR\b/gi, "ENROLADO")
    .replace(/\bPAO\b/gi, "PÃO")
    .replace(/\b\d+(?:[,.]\d+)?\s*(G|GR|GRAMAS|ML)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function detectPayment(text: string): PaymentMethod {
  const normalized = normalizeToken(text);
  if (normalized.includes("PIX")) return "PIX";
  if (normalized.includes("DINHEIRO")) return "Dinheiro";
  if (normalized.includes("CREDITO") || normalized.includes("CARTAO CRED")) return "Cartão de crédito";
  if (normalized.includes("DEBITO") || normalized.includes("CARTAO DEB")) return "Cartão de débito";
  if (normalized.includes("VOUCHER") || normalized.includes("BENEFICIO") || normalized.includes("ALIMENTACAO")) return "Voucher/benefício";
  return "Não identificado";
}

function isNoiseLine(line: string) {
  const normalized = normalizeToken(line);
  return !normalized || ["CNPJ", "VALOR TOTAL", "FORMA DE PAGAMENTO", "CHAVE DE ACESSO", "NFC", "NFCE", "CONSUMIDOR", "PROTOCOLO", "TRIBUT", "DOCUMENTO AUXILIAR", "QTDE. TOTAL", "VALOR PAGO", "SEFAZ"].some((noise) => normalized.includes(noise));
}

function parseOcrItems(text: string): ParsedOcrItem[] {
  return text.split(/\n+/).map((line) => line.trim()).filter((line) => line && !isNoiseLine(line)).flatMap((line) => {
    const detailed = line.match(/^\d{1,4}\s+(\d+)\s+(.+?)\s+(\d+[,.]?\d*)\s+(UN|KG|G|LT|L|ML)\s+X\s+(\d+[,.]\d{2})\s+(\d+[,.]\d{2})$/i);
    if (detailed) {
      const [, codigo, descricao, qtd, unidade, unitario, total] = detailed;
      return [{ codigo, descricaoOriginal: descricao.trim(), descricaoNormalizada: normalizeDescription(descricao), quantidade: toNumber(qtd), unidade: unidade.toUpperCase(), valorUnitario: toNumber(unitario), valorTotal: toNumber(total), categoria: categorize(descricao), confidence: 0.9 }];
    }
    const simple = line.match(/^(.{4,80}?)\s+(\d+[,.]\d{2})$/);
    if (simple && !/^\d{10,}$/.test(simple[1].replace(/\D/g, ""))) {
      const descricao = simple[1].replace(/^\d+\s+/, "").trim();
      if (descricao.length >= 3) return [{ codigo: null, descricaoOriginal: descricao, descricaoNormalizada: normalizeDescription(descricao), quantidade: null, unidade: null, valorUnitario: null, valorTotal: toNumber(simple[2]), categoria: categorize(descricao), confidence: 0.55 }];
    }
    return [];
  });
}

export function parseOcrRaw(raw?: string | null): ParsedOcr {
  const text = extractUsefulText(raw);
  if (!text) return { cnpj: null, valorTotal: null, dataCompra: null, formaPagamento: "Não identificado", itens: [], parserStatus: "empty", parserConfidence: 0, textoUtil: "" };
  const cnpj = text.match(/CNPJ[:\s]*(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/i)?.[1]?.replace(/\D/g, "") || null;
  const valorTotal = toNumber(text.match(/Valor total\s*R?\$?\s*(\d+[,.]\d{2})/i)?.[1]);
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
  const parsedDate = dateMatch ? parse(dateMatch[1], "dd/MM/yyyy HH:mm:ss", new Date()) : null;
  const itens = parseOcrItems(text);
  const confidence = Math.min(1, (itens.length ? 0.45 : 0) + (cnpj ? 0.15 : 0) + (valorTotal ? 0.15 : 0) + (parsedDate && isValid(parsedDate) ? 0.1 : 0) + (detectPayment(text) !== "Não identificado" ? 0.1 : 0));
  return { cnpj, valorTotal: valorTotal || null, dataCompra: parsedDate && isValid(parsedDate) ? parsedDate.toISOString() : null, formaPagamento: detectPayment(text), itens, parserStatus: itens.length ? (confidence >= 0.7 ? "parsed" : "partial") : "no_items_found", parserConfidence: itens.length ? confidence : 0, textoUtil: text };
}

export function normalizePurchase(rawPurchase: RawPurchase): NormalizedPurchase {
  const clienteId = rawPurchase.cliente_id ?? rawPurchase.cliente?.id;
  const clienteKey = String(clienteId || `${rawPurchase.cliente?.nome || "sem-nome"}:${rawPurchase.cliente?.whatsapp || "sem-whatsapp"}`);
  const parsedOcr = parseOcrRaw(rawPurchase.ocr_raw);
  return {
    ...rawPurchase,
    id: String(rawPurchase.id || crypto.randomUUID?.() || Math.random()),
    valorReais: Number(rawPurchase.valor_centavos || 0) / 100,
    dataCompra: parseDate(rawPurchase.data_compra) || parseDate(parsedOcr.dataCompra),
    createAt: parseDate(rawPurchase.create_at || rawPurchase.created_at),
    clienteKey,
    clienteNomeMascarado: maskCustomerName(rawPurchase.cliente?.nome),
    whatsappMascarado: maskWhatsapp(rawPurchase.cliente?.whatsapp),
    clienteNomeCompleto: rawPurchase.cliente?.nome?.trim() || "Cliente não identificado",
    whatsappCompleto: formatWhatsapp(rawPurchase.cliente?.whatsapp),
    padariaNome: rawPurchase.padaria?.nome || "Padaria não identificada",
    padariaCnpj: rawPurchase.padaria?.cnpj || rawPurchase.cnpj_extraido || parsedOcr.cnpj,
    parsedOcr,
  };
}

export function calculateHourlyPerformance(purchases: NormalizedPurchase[]) {
  const eligiblePurchases = purchases.filter((p) => {
    const hour = p.dataCompra?.getHours();
    return hour !== undefined && hour >= 6 && hour <= 22;
  });
  const totalValue = eligiblePurchases.reduce((sum, p) => sum + p.valorReais, 0);
  return PEAK_HOURS.map((hour) => {
    const items = eligiblePurchases.filter((p) => p.dataCompra?.getHours() === hour);
    const customerCounts = new Map<string, number>();
    items.forEach((p) => customerCounts.set(p.clienteKey, (customerCounts.get(p.clienteKey) || 0) + 1));
    const value = items.reduce((sum, p) => sum + p.valorReais, 0);
    return { hour, label: `${hour}h`, purchases: items.length, totalValue: value, averageTicket: average(items.map((p) => p.valorReais)), uniqueCustomers: customerCounts.size, recurringCustomers: [...customerCounts.values()].filter((count) => count >= 2).length, valueShare: percent(value, totalValue), volumeShare: percent(items.length, eligiblePurchases.length) };
  });
}

export function calculateDailyPerformance(purchases: NormalizedPurchase[]) {
  const map = new Map<string, NormalizedPurchase[]>();
  purchases.forEach((p) => { if (p.dataCompra) { const key = format(p.dataCompra, "yyyy-MM-dd"); map.set(key, [...(map.get(key) || []), p]); } });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, label: format(new Date(`${date}T12:00:00`), "dd/MM"), weekday: format(new Date(`${date}T12:00:00`), "EEEE", { locale: ptBR }), totalValue: items.reduce((sum, p) => sum + p.valorReais, 0), purchases: items.length, uniqueCustomers: new Set(items.map((p) => p.clienteKey)).size, averageTicket: average(items.map((p) => p.valorReais)) }));
}

export function calculateWeekdayPerformance(purchases: NormalizedPurchase[]) {
  return WEEKDAYS.map((weekday, index) => {
    const items = purchases.filter((p) => p.dataCompra?.getDay() === index);
    return { weekday, weekdayIndex: index, totalValue: items.reduce((sum, p) => sum + p.valorReais, 0), purchases: items.length, averageTicket: average(items.map((p) => p.valorReais)) };
  });
}

export function calculateCustomerMetrics(purchases: NormalizedPurchase[], params: InsightParams = {}) {
  const byCustomer = new Map<string, NormalizedPurchase[]>();
  purchases.forEach((p) => byCustomer.set(p.clienteKey, [...(byCustomer.get(p.clienteKey) || []), p]));
  const highTicketCut = percentile(purchases.map((p) => p.valorReais), params.highTicketPercentile ?? 75);
  const today = new Date();
  return [...byCustomer.entries()].map(([key, items]) => {
    const sorted = items.filter((p) => p.dataCompra).sort((a, b) => Number(a.dataCompra) - Number(b.dataCompra));
    const totalValue = items.reduce((sum, p) => sum + p.valorReais, 0);
    const avg = average(items.map((p) => p.valorReais));
    const last = sorted.at(-1)?.dataCompra || null;
    const daysSinceLastPurchase = last ? differenceInCalendarDays(startOfDay(today), startOfDay(last)) : null;
    const categories = calculateCategoryMetrics(items).sort((a, b) => b.purchases - a.purchases);
    let status = items.length === 1 ? "Novo" : items.length <= 3 ? "Recorrente" : "VIP";
    if (totalValue >= (params.vipValueThreshold ?? 100) || items.length >= 4) status = "VIP";
    if (avg >= highTicketCut && items.length <= 3) status = "Alto ticket";
    if (items.length >= 2 && daysSinceLastPurchase !== null && daysSinceLastPurchase > (params.inactivityDays ?? 7)) status = "Em risco";
    return { clienteKey: key, nome: items[0].clienteNomeMascarado, whatsapp: items[0].whatsappMascarado, nomeCompleto: items[0].clienteNomeCompleto, whatsappCompleto: items[0].whatsappCompleto, purchases: items.length, totalValue, averageTicket: avg, highestPurchase: Math.max(...items.map((p) => p.valorReais)), firstPurchase: sorted[0]?.dataCompra || null, lastPurchase: last, daysSinceLastPurchase, preferredHour: mostFrequent(items.map((p) => p.dataCompra?.getHours()).filter((x): x is number => x !== undefined)), preferredWeekday: mostFrequent(items.map((p) => p.dataCompra ? WEEKDAYS[p.dataCompra.getDay()] : null).filter(Boolean) as string[]), topCategory: categories[0]?.category || "Não identificado", status };
  });
}

function mostFrequent<T>(values: T[]): T | null {
  const map = new Map<T, number>();
  values.forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}


export function calculateCustomerConsumptionProfile(customerKey: string, purchases: NormalizedPurchase[]) {
  const customerPurchases = purchases
    .filter((purchase) => purchase.clienteKey === customerKey)
    .sort((a, b) => Number(b.dataCompra || 0) - Number(a.dataCompra || 0));
  const customers = calculateCustomerMetrics(customerPurchases);
  const summary = customers[0] || null;
  const categories = calculateCategoryMetrics(customerPurchases).slice(0, 6);
  const products = calculateProductMetricsFromOCR(customerPurchases).slice(0, 8);
  const paymentMethods = calculatePaymentMethodMetrics(customerPurchases);
  const hourlyPattern = calculateHourlyPerformance(customerPurchases).filter((hour) => hour.purchases > 0);
  const weekdayPattern = calculateWeekdayPerformance(customerPurchases).filter((day) => day.purchases > 0);
  const combos = detectCombos(customerPurchases, 1).slice(0, 5);
  const preferredPayment = paymentMethods.sort((a, b) => b.purchases - a.purchases)[0]?.method || "Não identificado";
  const insights = [
    summary?.preferredHour !== null && summary?.preferredHour !== undefined ? `Compra com mais frequência por volta de ${summary.preferredHour}h.` : "Ainda não há horário preferido suficiente.",
    summary?.preferredWeekday ? `Dia com maior recorrência: ${summary.preferredWeekday}.` : "Ainda não há dia da semana preferido suficiente.",
    categories[0] ? `Categoria mais presente: ${categories[0].category}.` : "OCR ainda não identificou categorias confiáveis para este cliente.",
    preferredPayment !== "Não identificado" ? `Forma de pagamento mais comum: ${preferredPayment}.` : "Forma de pagamento ainda não identificada nas notas.",
  ];

  return {
    customerKey,
    summary,
    purchases: customerPurchases,
    recentPurchases: customerPurchases.slice(0, 8).map((purchase) => ({
      id: purchase.id,
      date: purchase.dataCompra ? format(purchase.dataCompra, "dd/MM/yyyy HH:mm") : "Sem data",
      value: purchase.valorReais,
      items: purchase.parsedOcr.itens.slice(0, 4).map((item) => item.descricaoNormalizada).join(", ") || "Itens não identificados",
      paymentMethod: purchase.parsedOcr.formaPagamento,
      ocrConfidence: purchase.parsedOcr.parserConfidence,
    })),
    categories,
    products,
    paymentMethods,
    hourlyPattern,
    weekdayPattern,
    combos,
    insights,
  };
}

export function calculateRepurchaseMetrics(purchases: NormalizedPurchase[]) {
  const customers = calculateCustomerMetrics(purchases);
  const recurringCustomers = customers.filter((c) => c.purchases >= 2).length;
  return { uniqueCustomers: customers.length, recurringCustomers, repurchaseRate: percent(recurringCustomers, customers.length) };
}

export function calculateCategoryMetrics(purchases: NormalizedPurchase[]) {
  const map = new Map<string, { purchaseIds: Set<string>; totalValue: number; items: number }>();
  purchases.forEach((p) => {
    const categories = new Set(p.parsedOcr.itens.map((item) => item.categoria));
    categories.forEach((category) => {
      const current = map.get(category) || { purchaseIds: new Set<string>(), totalValue: 0, items: 0 };
      current.purchaseIds.add(p.id); current.totalValue += p.valorReais; current.items += p.parsedOcr.itens.filter((item) => item.categoria === category).length; map.set(category, current);
    });
  });
  return [...map.entries()].map(([category, data]) => ({ category, purchases: data.purchaseIds.size, items: data.items, totalValue: data.totalValue, averageTicket: data.purchaseIds.size ? data.totalValue / data.purchaseIds.size : 0 })).sort((a, b) => b.totalValue - a.totalValue);
}

export function calculateProductMetricsFromOCR(purchases: NormalizedPurchase[]) {
  const map = new Map<string, { original: string; purchases: Set<string>; totalValue: number; categories: Set<string> }>();
  purchases.forEach((p) => p.parsedOcr.itens.forEach((item) => {
    const key = item.descricaoNormalizada;
    const current = map.get(key) || { original: item.descricaoOriginal, purchases: new Set<string>(), totalValue: 0, categories: new Set<string>() };
    current.purchases.add(p.id); current.totalValue += item.valorTotal || p.valorReais; current.categories.add(item.categoria); map.set(key, current);
  }));
  return [...map.entries()].map(([product, data]) => ({ product, original: data.original, purchases: data.purchases.size, totalValue: data.totalValue, category: [...data.categories][0] || "Outros" })).sort((a, b) => b.purchases - a.purchases);
}

export function calculateTicketRanges(purchases: NormalizedPurchase[], ranges = DEFAULT_TICKET_RANGES) {
  const totalValue = purchases.reduce((sum, p) => sum + p.valorReais, 0);
  return ranges.map((range) => {
    const items = purchases.filter((p) => p.valorReais >= range.min && (range.max === null || p.valorReais < range.max));
    const repurchase = calculateRepurchaseMetrics(items);
    const value = items.reduce((sum, p) => sum + p.valorReais, 0);
    return { ...range, purchases: items.length, totalValue: value, uniqueCustomers: repurchase.uniqueCustomers, notesShare: percent(items.length, purchases.length), valueShare: percent(value, totalValue), averageTicket: average(items.map((p) => p.valorReais)), repurchaseRate: repurchase.repurchaseRate };
  });
}

export function calculatePaymentMethodMetrics(purchases: NormalizedPurchase[]) {
  const methods: PaymentMethod[] = ["PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Voucher/benefício", "Não identificado"];
  return methods.map((method) => {
    const items = purchases.filter((p) => p.parsedOcr.formaPagamento === method);
    const totalValue = items.reduce((sum, p) => sum + p.valorReais, 0);
    return { method, purchases: items.length, totalValue, averageTicket: average(items.map((p) => p.valorReais)) };
  }).filter((m) => m.purchases > 0);
}

export function detectCombos(purchases: NormalizedPurchase[], minOccurrences = 2) {
  const map = new Map<string, { count: number; totalTicket: number }>();
  purchases.forEach((p) => {
    const categories = [...new Set(p.parsedOcr.itens.map((item) => item.categoria).filter((c) => c !== "Outros"))].sort();
    for (let i = 0; i < categories.length; i++) for (let j = i + 1; j < categories.length; j++) {
      const key = `${categories[i]} + ${categories[j]}`;
      const current = map.get(key) || { count: 0, totalTicket: 0 };
      current.count += 1; current.totalTicket += p.valorReais; map.set(key, current);
    }
  });
  return [...map.entries()].map(([combo, data]) => ({ combo, purchases: data.count, averageTicket: data.totalTicket / data.count })).filter((c) => c.purchases >= minOccurrences).sort((a, b) => b.purchases - a.purchases);
}

export function calculateOcrQualityMetrics(purchases: NormalizedPurchase[]) {
  const validRaw = purchases.filter((p) => !!p.parsedOcr.textoUtil).length;
  const rawLiteral = purchases.filter((p) => String(p.ocr_raw || "").trim().toLowerCase() === "raw").length;
  const withItems = purchases.filter((p) => p.parsedOcr.itens.length > 0).length;
  const cnpjMismatch = purchases.filter((p) => p.padaria?.cnpj && p.parsedOcr.cnpj && p.padaria.cnpj.replace(/\D/g, "") !== p.parsedOcr.cnpj).length;
  const suspiciousDate = purchases.filter((p) => !p.dataCompra || p.dataCompra.getFullYear() < 2020).length;
  const zeroValue = purchases.filter((p) => p.valorReais <= 0).length;
  const highTicketCut = percentile(purchases.map((p) => p.valorReais), 95);
  return { validRaw, rawLiteral, withItems, withoutItems: purchases.length - withItems, itemCoverage: percent(withItems, purchases.length), cnpjMismatch, suspiciousDate, zeroValue, highTicket: purchases.filter((p) => p.valorReais > Math.max(200, highTicketCut)).length, possibleDuplicates: detectSuspiciousPurchases(purchases).length };
}

export function detectSuspiciousPurchases(purchases: NormalizedPurchase[]) {
  const issues: Array<{ id: string; cliente: string; padaria: string; value: number; date: string; reason: string }> = [];
  const seen = new Map<string, string>();
  purchases.forEach((p) => {
    const date = p.dataCompra ? format(p.dataCompra, "dd/MM/yyyy HH:mm") : "sem data";
    const keys = [p.chave_acesso && `chave:${p.chave_acesso}`, p.hash_idempotencia && `hash:${p.hash_idempotencia}`, `aprox:${p.clienteKey}:${p.padaria_id}:${p.valorReais}:${p.dataCompra ? Math.round(p.dataCompra.getTime() / 600000) : "sem-data"}`].filter(Boolean) as string[];
    const duplicateKey = keys.find((key) => seen.has(key));
    if (duplicateKey) issues.push({ id: p.id, cliente: p.clienteNomeMascarado, padaria: p.padariaNome, value: p.valorReais, date, reason: duplicateKey.startsWith("aprox") ? "Possível duplicidade por cliente, padaria, valor e horário" : "Chave ou hash repetido" });
    keys.forEach((key) => seen.set(key, p.id));
    if (p.valorReais <= 0) issues.push({ id: p.id, cliente: p.clienteNomeMascarado, padaria: p.padariaNome, value: p.valorReais, date, reason: "Valor zerado" });
    if (!p.dataCompra) issues.push({ id: p.id, cliente: p.clienteNomeMascarado, padaria: p.padariaNome, value: p.valorReais, date, reason: "Data da compra ausente ou inválida" });
  });
  return issues.slice(0, 30);
}

export function calculateOverviewMetrics(purchases: NormalizedPurchase[]) {
  const repurchase = calculateRepurchaseMetrics(purchases);
  const hourly = calculateHourlyPerformance(purchases).sort((a, b) => b.totalValue - a.totalValue);
  const daily = calculateDailyPerformance(purchases).sort((a, b) => b.totalValue - a.totalValue);
  const categories = calculateCategoryMetrics(purchases);
  const products = calculateProductMetricsFromOCR(purchases);
  const quality = calculateOcrQualityMetrics(purchases);
  const values = purchases.map((p) => p.valorReais);
  return { totalValue: values.reduce((sum, v) => sum + v, 0), averageTicket: average(values), medianTicket: median(values), totalPurchases: purchases.length, uniqueCustomers: repurchase.uniqueCustomers, recurringCustomers: repurchase.recurringCustomers, repurchaseRate: repurchase.repurchaseRate, ocrItemCoverage: quality.itemCoverage, mostValuableHour: hourly[0]?.label || "Sem dados", mostValuableDay: daily[0]?.weekday || "Sem dados", strongestCategory: categories[0]?.category || "Não identificado", topValueProduct: products.sort((a, b) => b.totalValue - a.totalValue)[0]?.product || "Não identificado" };
}

export function calculateCommercialInsights(purchases: NormalizedPurchase[], params: InsightParams = {}) {
  const ticketThreshold = params.ticketThreshold ?? 40;
  const overview = calculateOverviewMetrics(purchases);
  const hourly = calculateHourlyPerformance(purchases);
  const highValueHour = [...hourly].sort((a, b) => b.totalValue - a.totalValue)[0];
  const highVolumeLowTicket = [...hourly].filter((h) => h.purchases > 0).sort((a, b) => b.purchases - a.purchases || a.averageTicket - b.averageTicket)[0];
  const ranges = calculateTicketRanges(purchases);
  const aboveThreshold = purchases.filter((p) => p.valorReais >= ticketThreshold).reduce((sum, p) => sum + p.valorReais, 0);
  const customers = calculateCustomerMetrics(purchases, params);
  const combos = detectCombos(purchases, params.minOccurrencesForComboInsight ?? 3);
  const insights = [
    highValueHour ? `O horário de ${highValueHour.label} concentra maior valor cadastrado (${Math.round(highValueHour.valueShare)}% do período).` : "Ainda não há volume suficiente para apontar o horário mais valioso.",
    highVolumeLowTicket ? `O horário de ${highVolumeLowTicket.label} tem alto fluxo, com ticket médio de R$ ${highVolumeLowTicket.averageTicket.toFixed(2).replace(".", ",")}.` : "Ainda não há dados suficientes para comparar fluxo por horário.",
    `Clientes recorrentes representam ${overview.repurchaseRate.toFixed(1).replace(".", ",")}% da base filtrada.`,
    `Compras acima de R$ ${ticketThreshold.toFixed(2).replace(".", ",")} concentram ${percent(aboveThreshold, overview.totalValue).toFixed(1).replace(".", ",")}% do valor cadastrado.`,
    overview.strongestCategory !== "Não identificado" ? `A categoria ${overview.strongestCategory} é o principal motor de valor identificado no OCR.` : "A cobertura de itens no OCR ainda é limitada; revise amostras para melhorar categorias.",
    `Há ${customers.filter((c) => c.purchases === 1 && c.averageTicket > overview.averageTicket).length} clientes com uma compra só e ticket acima da média.`,
    `Há ${customers.filter((c) => c.status === "Em risco").length} clientes recorrentes sem compra recente no critério atual.`,
    combos[0] ? `${combos[0].combo} aparece em ${combos[0].purchases} notas e tem ticket médio de R$ ${combos[0].averageTicket.toFixed(2).replace(".", ",")}.` : "Acompanhe combos após acumular mais notas com itens extraídos pelo OCR.",
    `A melhor alavanca comercial é incentivar compras acima de R$ ${ticketThreshold.toFixed(0)} com campanhas segmentadas.`,
  ];
  const strongestRange = [...ranges].sort((a, b) => b.purchases - a.purchases)[0];
  if (strongestRange) insights.push(`A faixa ${strongestRange.label} concentra maior volume de notas.`);
  return insights;
}

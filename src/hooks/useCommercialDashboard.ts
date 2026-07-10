import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CommercialDashboardFilters, CommercialDashboardScope, fetchCommercialDashboardOptions, fetchCommercialPurchases } from "@/services/commercialDashboardService";
import {
  calculateCategoryMetrics,
  calculateCommercialInsights,
  calculateCustomerMetrics,
  calculateDailyPerformance,
  calculateHourlyPerformance,
  calculateOcrQualityMetrics,
  calculateOverviewMetrics,
  calculatePaymentMethodMetrics,
  calculateProductMetricsFromOCR,
  calculateTicketRanges,
  calculateWeekdayPerformance,
  detectCombos,
  detectSuspiciousPurchases,
  InsightParams,
} from "@/utils/commercialMetrics";

export function useCommercialDashboard(filters: CommercialDashboardFilters, insightParams: InsightParams = {}, scope: CommercialDashboardScope = {}) {
  const purchasesQuery = useQuery({
    queryKey: ["commercial-dashboard", filters, scope],
    queryFn: () => fetchCommercialPurchases(filters, scope),
    staleTime: 60 * 1000,
  });

  const optionsQuery = useQuery({
    queryKey: ["commercial-dashboard-options", scope],
    queryFn: () => fetchCommercialDashboardOptions(scope),
    staleTime: 5 * 60 * 1000,
  });

  const dashboard = useMemo(() => {
    const purchases = purchasesQuery.data?.purchases || [];
    const customers = calculateCustomerMetrics(purchases, insightParams);
    const products = calculateProductMetricsFromOCR(purchases);
    const categories = calculateCategoryMetrics(purchases);
    const suspiciousPurchases = detectSuspiciousPurchases(purchases);

    return {
      source: purchasesQuery.data?.source || "api",
      purchases,
      overview: calculateOverviewMetrics(purchases),
      charts: {
        dailyPerformance: calculateDailyPerformance(purchases),
        hourlyPerformance: calculateHourlyPerformance(purchases),
        weekdayPerformance: calculateWeekdayPerformance(purchases),
        ticketRanges: calculateTicketRanges(purchases),
        categories,
        products,
        paymentMethods: calculatePaymentMethodMetrics(purchases),
        combos: detectCombos(purchases, insightParams.minOccurrencesForComboInsight ?? 2),
      },
      tables: {
        topCustomersByValue: [...customers].sort((a, b) => b.totalValue - a.totalValue).slice(0, 10),
        topCustomersByFrequency: [...customers].sort((a, b) => b.purchases - a.purchases).slice(0, 10),
        customersAtRisk: customers.filter((c) => c.status === "Em risco").slice(0, 10),
        vipCustomers: customers.filter((c) => c.status === "VIP" || c.status === "Alto ticket").sort((a, b) => b.totalValue - a.totalValue).slice(0, 10),
        recurringCustomers: customers.filter((c) => c.purchases >= 2).sort((a, b) => b.purchases - a.purchases).slice(0, 10),
        onePurchaseHighTicket: customers.filter((c) => c.purchases === 1 && c.averageTicket >= dashboardAverage(purchases)).slice(0, 10),
        suspiciousPurchases,
      },
      exports: {
        topCustomersByValue: [...customers].sort((a, b) => b.totalValue - a.totalValue),
        topCustomersByFrequency: [...customers].sort((a, b) => b.purchases - a.purchases),
        customersAtRisk: customers.filter((c) => c.status === "Em risco"),
        vipCustomers: customers.filter((c) => c.status === "VIP" || c.status === "Alto ticket").sort((a, b) => b.totalValue - a.totalValue),
        recurringCustomers: customers.filter((c) => c.purchases >= 2).sort((a, b) => b.purchases - a.purchases),
        onePurchaseHighTicket: customers.filter((c) => c.purchases === 1 && c.averageTicket >= dashboardAverage(purchases)),
      },
      insights: calculateCommercialInsights(purchases, insightParams),
      ocrQuality: calculateOcrQualityMetrics(purchases),
    };
  }, [insightParams, purchasesQuery.data?.purchases, purchasesQuery.data?.source]);

  const scopedOptions = useMemo(() => {
    const options = optionsQuery.data || { padarias: [], clientes: [], atendentes: [], campanhas: [] };
    const purchases = purchasesQuery.data?.purchases || [];
    if (!scope.forcedPadariaId) return options;
    return {
      padarias: options.padarias.filter((padaria) => padaria.id === scope.forcedPadariaId),
      clientes: Array.from(new Map(purchases.map((purchase) => [String(purchase.cliente_id || purchase.clienteKey), { id: String(purchase.cliente_id || purchase.clienteKey), nome: purchase.clienteNomeCompleto }])).values()),
      atendentes: Array.from(new Map(purchases.filter((purchase) => purchase.atendente_id).map((purchase) => [String(purchase.atendente_id), { id: String(purchase.atendente_id), nome: purchase.atendente?.nome || "Atendente" }])).values()),
      campanhas: options.campanhas,
    };
  }, [optionsQuery.data, purchasesQuery.data?.purchases, scope.forcedPadariaId]);

  return {
    ...dashboard,
    options: scopedOptions,
    loading: purchasesQuery.isLoading || optionsQuery.isLoading,
    error: purchasesQuery.error || optionsQuery.error,
    refresh: () => {
      purchasesQuery.refetch();
      optionsQuery.refetch();
    },
  };
}

function dashboardAverage(purchases: Array<{ valorReais: number }>) {
  return purchases.length ? purchases.reduce((sum, p) => sum + p.valorReais, 0) / purchases.length : 0;
}

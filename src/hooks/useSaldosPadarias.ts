import { useGraphQLQuery, useGraphQLMutation } from './useGraphQL';
import {
  GET_SALDO_CLIENTE_PADARIA,
  GET_SALDOS_CLIENTE,
  UPSERT_SALDO_CLIENTE_PADARIA,
  INSERT_SALDO_CLIENTE_PADARIA,
  ZERAR_SALDO_CLIENTE_PADARIA,
  ADICIONAR_SALDO_CLIENTE_PADARIA
} from '@/graphql/queries';

// Interfaces para tipagem
export interface SaldoClientePadaria {
  id: string;
  cliente_id: string;
  padaria_id: string;
  saldo_centavos: number;
  updated_at: string;
  padarias_saldos?: {
    id: string;
    nome: string;
  };
}

export interface SaldoClientePadariaInput {
  cliente_id: string;
  padaria_id: string;
  saldo_centavos: number;
}

// Hook para buscar saldo de um cliente em uma padaria específica
export function useSaldoClientePadaria(clienteId: string | null, padariaId: string | null) {
  return useGraphQLQuery<SaldoClientePadaria[]>(
    ['saldo-cliente-padaria', clienteId, padariaId],
    GET_SALDO_CLIENTE_PADARIA,
    {
      cliente_id: clienteId,
      padaria_id: padariaId
    },
    {
      enabled: !!(clienteId && padariaId)
    }
  );
}

// Hook para buscar todos os saldos de um cliente
export function useSaldosCliente(clienteId: string | null) {
  return useGraphQLQuery<SaldoClientePadaria[]>(
    ['saldos-cliente', clienteId],
    GET_SALDOS_CLIENTE,
    {
      cliente_id: clienteId
    },
    {
      enabled: !!clienteId
    }
  );
}

// Hook para inserir ou atualizar saldo de cliente em uma padaria
export function useUpsertSaldoClientePadaria() {
  return useGraphQLMutation(UPSERT_SALDO_CLIENTE_PADARIA);
}

// Hook para inserir saldo de cliente em uma padaria
export function useInsertSaldoClientePadaria() {
  return useGraphQLMutation(INSERT_SALDO_CLIENTE_PADARIA);
}

// Hook para zerar saldo de cliente em uma padaria
export function useZerarSaldoClientePadaria() {
  return useGraphQLMutation(ZERAR_SALDO_CLIENTE_PADARIA);
}

// Hook para adicionar saldo a um cliente em uma padaria
export function useAdicionarSaldoClientePadaria() {
  return useGraphQLMutation(ADICIONAR_SALDO_CLIENTE_PADARIA);
}

// Funções utilitárias para conversão de valores
export const saldoUtils = {
  // Converter reais para centavos
  reaisParaCentavos: (valor: number): number => {
    return Math.round(valor * 100);
  },

  // Converter centavos para reais
  centavosParaReais: (centavos: number): number => {
    return centavos / 100;
  },

  // Formatar saldo em reais para exibição
  formatarSaldo: (centavos: number): string => {
    const reais = saldoUtils.centavosParaReais(centavos);
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  // Calcular troco/saldo restante
  calcularTroco: (valorCompra: number, ticketMedio: number, saldoAnterior: number = 0): number => {
    const valorTotal = valorCompra + saldoAnterior;
    const cuponsGerados = Math.floor(valorTotal / ticketMedio);
    const valorUsado = cuponsGerados * ticketMedio;
    const troco = valorTotal - valorUsado;
    return troco > 0 ? saldoUtils.reaisParaCentavos(troco) : 0;
  }
};

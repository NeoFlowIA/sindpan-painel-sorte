import { useGraphQLQuery, useGraphQLMutation } from './useGraphQL';
import { 
  GET_CUPONS_BY_PADARIA, 
  GET_CUPONS_BY_CLIENTE, 
  CREATE_CUPOM, 
  UPDATE_CUPOM_STATUS,
  GET_PADARIA_TICKET_MEDIO,
  GET_CLIENTE_SALDO_DESCONTO,
  GET_CUPONS_CLIENTE_SALDO,
  RESET_CLIENTE_DESCONTO,
  GET_DASHBOARD_METRICS,
  GET_TOP_CLIENTES,
  GET_CUPONS_RECENTES
} from '@/graphql/queries';

// Tipos para cupons
export interface Cupom {
  id: number;
  numero_sorte: string;
  valor_compra: string; // Alterado para string conforme o banco
  data_compra: string;
  status: 'ativo' | 'inativo';
  cliente_id: number;
  padaria_id: string;
  valor_desconto?: string | null; // Saldo/desconto acumulado
  cliente?: {
    id: number;
    nome: string;
    cpf: string;
    whatsapp?: string;
  };
}

export interface CuponsResponse {
  cupons: Cupom[];
  cupons_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export interface CreateCupomInput {
  numero_sorte: string;
  valor_compra: string; // Alterado para string conforme o banco
  data_compra: string;
  status: 'ativo' | 'inativo';
  cliente_id: number;
  padaria_id: string; // Campo obrigatório
  valor_desconto?: string | null; // Saldo/desconto para próximas compras
}

export interface PadariaTicketMedio {
  padarias_by_pk: {
    id: string;
    ticket_medio: number;
    nome: string;
  };
}

// Hook para buscar cupons de uma padaria
export const useCuponsByPadaria = (padariaId: string, limit?: number, offset?: number) => {
  return useGraphQLQuery<CuponsResponse>(
    ['cupons-by-padaria', padariaId, String(limit || 50), String(offset || 0)],
    GET_CUPONS_BY_PADARIA,
    {
      padaria_id: padariaId,
      limit: limit || 50,
      offset: offset || 0,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      enabled: !!padariaId,
    }
  );
};

// Hook para buscar cupons de um cliente específico
export const useCuponsByCliente = (clienteId: number) => {
  return useGraphQLQuery<{ cupons: Cupom[] }>(
    ['cupons-by-cliente', String(clienteId)],
    GET_CUPONS_BY_CLIENTE,
    { cliente_id: clienteId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      enabled: !!clienteId,
    }
  );
};

// Hook para obter ticket médio da padaria
export const usePadariaTicketMedio = (padariaId: string) => {
  return useGraphQLQuery<PadariaTicketMedio>(
    ['padaria-ticket-medio', padariaId],
    GET_PADARIA_TICKET_MEDIO,
    { padaria_id: padariaId },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos (ticket médio não muda frequentemente)
      enabled: !!padariaId,
    }
  );
};

// Hook para obter saldo de desconto acumulado do cliente
export const useClienteSaldoDesconto = (clienteId: number | undefined) => {
  return useGraphQLQuery<{
    cupons: Array<{
      valor_desconto: string | null;
    }>;
  }>(
    ['cliente-saldo-desconto', String(clienteId || 0)],
    GET_CUPONS_CLIENTE_SALDO,
    { cliente_id: clienteId },
    {
      staleTime: 1 * 60 * 1000, // 1 minuto (saldo pode mudar frequentemente)
      enabled: !!clienteId,
    }
  );
};

// Hook para criar cupom
export const useCreateCupom = () => {
  return useGraphQLMutation<
    { insert_cupons_one: Cupom }, 
    { cupom: CreateCupomInput }
  >(
    CREATE_CUPOM,
    {
      onSuccess: () => {
        // Invalidar cache dos cupons para recarregar as listas
      },
      invalidateQueries: [
        ['cupons-by-padaria'], 
        ['cupons-by-cliente'],
        ['cliente-saldo-desconto'], // Invalidar saldo de desconto
        ['clientes'] // Também invalidar clientes pois eles têm agregação de cupons
      ],
    }
  );
};

// Hook para atualizar status do cupom
export const useUpdateCupomStatus = () => {
  return useGraphQLMutation<
    { update_cupons_by_pk: Cupom }, 
    { id: number; status: 'ativo' | 'inativo' }
  >(
    UPDATE_CUPOM_STATUS,
    {
      onSuccess: () => {
        // Invalidar cache dos cupons para recarregar as listas
      },
      invalidateQueries: [
        ['cupons-by-padaria'], 
        ['cupons-by-cliente']
      ],
    }
  );
};

// Hook para zerar saldo de desconto do cliente
export const useResetClienteDesconto = () => {
  return useGraphQLMutation<
    { update_cupons: { affected_rows: number } },
    { cliente_id: number }
  >(
    RESET_CLIENTE_DESCONTO,
    {
      invalidateQueries: [
        ['cliente-saldo-desconto'],
        ['cupons-by-cliente'],
      ],
    }
  );
};

// Função utilitária para gerar número da sorte único de 5 dígitos
export const gerarNumeroSorte = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Função utilitária para calcular quantos cupons podem ser gerados
export const calcularCuponsGerados = (
  valorCompra: number, 
  saldoDesconto: number, 
  ticketMedio: number
): number => {
  const valorTotal = valorCompra + saldoDesconto;
  return Math.floor(valorTotal / ticketMedio);
};

// Função utilitária para calcular novo saldo de desconto após gerar cupons
export const calcularNovoSaldoDesconto = (
  valorCompra: number, 
  saldoDesconto: number, 
  ticketMedio: number
): number => {
  const valorTotal = valorCompra + saldoDesconto;
  const cuponsGerados = Math.floor(valorTotal / ticketMedio);
  return valorTotal - (cuponsGerados * ticketMedio);
};

// Hook para métricas do dashboard
export const useDashboardMetrics = (padariaId: string) => {
  return useGraphQLQuery<{
    clientes_aggregate: { aggregate: { count: number } };
    cupons_aggregate: { aggregate: { count: number } };
    padarias_by_pk: { ticket_medio: number };
  }>(
    ['dashboard-metrics', padariaId],
    GET_DASHBOARD_METRICS,
    { padaria_id: padariaId },
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      enabled: !!padariaId,
    }
  );
};

// Hook para top 5 clientes
export const useTopClientes = (padariaId: string) => {
  return useGraphQLQuery<{
    clientes: Array<{
      id: number;
      nome: string;
      cpf: string;
      cupons: Array<{ id: number; data_compra: string }>;
    }>;
  }>(
    ['top-clientes', padariaId],
    GET_TOP_CLIENTES,
    { padaria_id: padariaId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      enabled: !!padariaId,
    }
  );
};

// Hook para cupons recentes
export const useCuponsRecentes = (padariaId: string) => {
  return useGraphQLQuery<{
    cupons: Array<{
      id: number;
      numero_sorte: string;
      valor_compra: string;
      data_compra: string;
      cliente: {
        id: number;
        nome: string;
        cpf: string;
      };
    }>;
  }>(
    ['cupons-recentes', padariaId],
    GET_CUPONS_RECENTES,
    { padaria_id: padariaId },
    {
      staleTime: 1 * 60 * 1000, // 1 minuto
      enabled: !!padariaId,
    }
  );
};

// Hook utilitário para estatísticas de cupons
export const useCuponsStats = (padariaId: string) => {
  const { data, isLoading, error } = useCuponsByPadaria(padariaId);
  
  return {
    totalCupons: data?.cupons_aggregate?.aggregate?.count || 0,
    cuponsAtivos: data?.cupons?.filter(cupom => cupom.status === 'ativo').length || 0,
    cuponsInativos: data?.cupons?.filter(cupom => cupom.status === 'inativo').length || 0,
    valorTotalCompras: data?.cupons?.reduce((acc, cupom) => acc + parseFloat(cupom.valor_compra || '0'), 0) || 0,
    isLoading,
    error,
  };
};

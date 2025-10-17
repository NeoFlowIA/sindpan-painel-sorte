import { useGraphQLQuery, useGraphQLMutation } from './useGraphQL';
import { 
  GET_CUPONS_BY_PADARIA, 
  GET_CUPONS_BY_CLIENTE, 
  CREATE_CUPOM, 
  UPDATE_CUPOM_STATUS,
  GET_PADARIA_TICKET_MEDIO,
  GET_CLIENTE_SALDO_DESCONTO,
  GET_CUPONS_CLIENTE_SALDO,
  GET_CLIENTE_SALDO_POR_PADARIA,
  GET_CUPONS_DISPONIVEIS_POR_PADARIA,
  VINCULAR_CUPOM_AO_CLIENTE,
  GET_DASHBOARD_METRICS,
  GET_TOP_CLIENTES,
  GET_CUPONS_RECENTES,
  GET_ESTATISTICAS_SEMANAIS,
  GET_CUPONS_POR_DIA_SEMANA,
  GET_EVOLUCAO_DIARIA_CUPONS,
  GET_CUPONS_PARA_SORTEIO,
  GET_HISTORICO_SORTEIOS,
  GET_PARTICIPANTES_SORTEIO
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
  campanha_id?: string | null; // ID da campanha vinculada
  sorteio_id?: string | null; // ID do próximo sorteio agendado
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

// Hook para obter saldo de desconto acumulado do cliente (TODOS os cupons)
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
      staleTime: 0, // Sempre buscar dados frescos do Hasura
      enabled: !!clienteId,
    }
  );
};

// Hook para obter saldo de desconto do cliente em uma padaria específica
export const useClienteSaldoPorPadaria = (clienteId: number | undefined, padariaId: string | undefined) => {
  return useGraphQLQuery<{
    cupons: Array<{
      id: string;
      valor_desconto: string | null;
    }>;
  }>(
    ['cliente-saldo-por-padaria', String(clienteId || 0), String(padariaId || '')],
    GET_CLIENTE_SALDO_POR_PADARIA,
    { cliente_id: clienteId, padaria_id: padariaId },
    {
      staleTime: 0, // Sempre buscar dados frescos do Hasura
      enabled: !!clienteId && !!padariaId,
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
// Hook para resetar desconto do cliente - DESABILITADO
// Vamos usar uma abordagem diferente sem mexer no Hasura
export const useResetClienteDesconto = () => {
  return {
    mutateAsync: async () => {
      // Simular sucesso sem fazer nada no banco
      console.log('Reset de desconto simulado - não implementado');
      return { affected_rows: 0 };
    },
    isLoading: false,
    error: null
  };
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
    clientes: Array<{ id: number }>;
    cupons: Array<{ id: number }>;
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

// Hook para estatísticas semanais
export const useEstatisticasSemanais = (padariaId: string) => {
  return useGraphQLQuery<{
    clientes: Array<{ id: number }>;
    cupons: Array<{ id: number; data_compra: string }>;
  }>(
    ['estatisticas-semanais', padariaId],
    GET_ESTATISTICAS_SEMANAIS,
    { padaria_id: padariaId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      enabled: !!padariaId,
    }
  );
};

// Hook para cupons por dia da semana
export const useCuponsPorDiaSemana = (padariaId: string) => {
  return useGraphQLQuery<{
    cupons: Array<{ data_compra: string }>;
  }>(
    ['cupons-por-dia-semana', padariaId],
    GET_CUPONS_POR_DIA_SEMANA,
    { padaria_id: padariaId },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      enabled: !!padariaId,
    }
  );
};

// Hook para evolução diária de cupons
export const useEvolucaoDiariaCupons = (padariaId: string) => {
  return useGraphQLQuery<{
    cupons: Array<{ data_compra: string }>;
  }>(
    ['evolucao-diaria-cupons', padariaId],
    GET_EVOLUCAO_DIARIA_CUPONS,
    { padaria_id: padariaId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
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

// ===== HOOKS PARA SORTEIO =====

// Tipos para sorteio
export interface CupomParaSorteio {
  id: number;
  numero_sorte: string;
  valor_compra: string;
  data_compra: string;
  cliente_id: number;
  cliente: {
    id: number;
    nome: string;
    cpf: string;
    whatsapp: string;
  };
}

export interface Sorteio {
  id: number;
  data_sorteio: string;
  numero_sorteado: string;
  ganhador_id: number;
  cliente: {
    id: number;
    nome: string;
    cpf: string;
    whatsapp: string;
  };
}

export interface ParticipanteSorteio {
  id: number;
  nome: string;
  cpf: string;
  whatsapp: string;
  cupons: Array<{
    id: number;
    numero_sorte: string;
  }>;
}

// Hook para obter cupons para sorteio
export const useCuponsParaSorteio = (padariaId: string) => {
  return useGraphQLQuery<{
    cupons: Array<CupomParaSorteio>;
  }>(
    ['cupons-para-sorteio', padariaId],
    GET_CUPONS_PARA_SORTEIO,
    { padaria_id: padariaId },
    {
      staleTime: 1 * 60 * 1000, // 1 minuto
      enabled: !!padariaId,
    }
  );
};

// Hook para obter histórico de sorteios
export const useHistoricoSorteios = () => {
  return useGraphQLQuery<{
    sorteios: Array<{
      id: string;
      data_sorteio: string;
      numero_sorteado: string;
      ganhador_id: number;
    }>;
  }>(
    ['historico-sorteios'],
    GET_HISTORICO_SORTEIOS,
    {},
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      enabled: true,
    }
  );
};

// Hook para obter participantes do sorteio
export const useParticipantesSorteio = () => {
  return useGraphQLQuery<{
    clientes: Array<{
      id: number;
      nome: string;
      cpf: string;
      whatsapp: string;
    }>;
  }>(
    ['participantes-sorteio'],
    GET_PARTICIPANTES_SORTEIO,
    {},
    {
      staleTime: 1 * 60 * 1000, // 1 minuto
      enabled: true,
    }
  );
};

// Hook removido - mutation não existe no Hasura
// Sistema de sorteio funcionará apenas no frontend

// ===== HOOKS PARA GERENCIAMENTO DE CUPONS DISPONÍVEIS =====

// Interface para cupom disponível
export interface CupomDisponivel {
  id: string;
  numero_sorte: string;
  serie: number;
  status: string;
}

// Hook para buscar cupons disponíveis de uma padaria
export const useCuponsDisponiveisPorPadaria = (padariaId: string | undefined) => {
  return useGraphQLQuery<{
    cupons: CupomDisponivel[];
  }>(
    ['cupons-disponiveis-padaria', padariaId],
    GET_CUPONS_DISPONIVEIS_POR_PADARIA,
    { padaria_id: padariaId },
    {
      staleTime: 1 * 60 * 1000, // 1 minuto
      enabled: !!padariaId,
    }
  );
};

// Hook para vincular cupom disponível ao cliente
export const useVincularCupom = () => {
  return useGraphQLMutation<
    { update_cupons_by_pk: any },
    {
      id: string;
      cliente_id: string;
      padaria_id: string;
      valor_compra: string;
      valor_desconto: string;
      data_compra: string;
      status: string;
      campanha_id?: number | null;
      sorteio_id?: string | null;
    }
  >(
    VINCULAR_CUPOM_AO_CLIENTE,
    {
      onSuccess: () => {
        // Invalidar cache dos cupons disponíveis
      },
      invalidateQueries: [
        ['cupons-disponiveis-padaria'],
        ['cupons-by-padaria'],
        ['cliente-saldo-por-padaria']
      ],
    }
  );
};

// Hook para alocar múltiplos cupons de uma vez
export const useAlocarCupons = (padariaId: string | undefined) => {
  const { data: cuponsDisponiveisData, refetch: refetchCuponsDisponiveis } = useCuponsDisponiveisPorPadaria(padariaId);
  const vincularCupomMutation = useVincularCupom();

  const alocarCupons = async (
    clienteId: string,
    quantidade: number,
    ticketMedio: number,
    valorCompra: number,
    saldoDesconto: number,
    dataCompra: string
  ) => {
    const cuponsDisponiveis = cuponsDisponiveisData?.cupons || [];
    
    if (cuponsDisponiveis.length < quantidade) {
      throw new Error(`Não há cupons disponíveis suficientes. Disponíveis: ${cuponsDisponiveis.length}, Necessários: ${quantidade}`);
    }

    const numerosSorte: string[] = [];
    const novoSaldoDesconto = (valorCompra + saldoDesconto) - (quantidade * ticketMedio);

    // Vincular cupons disponíveis ao cliente
    for (let i = 0; i < quantidade; i++) {
      const cupomDisponivel = cuponsDisponiveis[i];
      numerosSorte.push(cupomDisponivel.numero_sorte);

      const ehUltimoCupom = i === quantidade - 1;

      await vincularCupomMutation.mutateAsync({
        id: cupomDisponivel.id,
        cliente_id: clienteId,
        padaria_id: padariaId!,
        valor_compra: String(ticketMedio.toFixed(2)),
        valor_desconto: ehUltimoCupom ? String(novoSaldoDesconto.toFixed(2)) : "0",
        data_compra: dataCompra,
        status: "ativo",
        campanha_id: null,
        sorteio_id: null
      });
    }

    return {
      numerosSorte,
      quantidade,
      novoSaldoDesconto
    };
  };

  return {
    cuponsDisponiveis: cuponsDisponiveisData?.cupons || [],
    alocarCupons,
    isLoading: vincularCupomMutation.isLoading,
    error: vincularCupomMutation.error,
    refetchCuponsDisponiveis
  };
};

import { useGraphQLQuery, useGraphQLMutation } from './useGraphQL';
import { GET_PADARIAS, GET_PADARIAS_STATS, CREATE_PADARIA, UPDATE_PADARIA, DELETE_PADARIA } from '@/graphql/queries';

// Tipos baseados no schema Hasura
export interface Padaria {
  cnpj: string;
  email: string;
  endereco: string;
  nome: string;
  status: string;
  status_pagamento: string;
  telefone: string;
  ticket_medio: number;
}

export interface PadariasResponse {
  padarias: Padaria[];
}

export interface PadariasStatsResponse {
  padarias_aggregate: {
    aggregate: {
      count: number;
    };
  };
  padarias_ativas: {
    aggregate: {
      count: number;
    };
  };
  padarias_pendentes: {
    aggregate: {
      count: number;
    };
  };
  ticket_medio: {
    aggregate: {
      avg: {
        ticket_medio: number;
      };
    };
  };
}

// Hook para buscar todas as padarias
export const usePadarias = () => {
  return useGraphQLQuery<PadariasResponse>(
    ['padarias'],
    GET_PADARIAS,
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
};

// Hook para buscar estatísticas das padarias
export const usePadariasStats = () => {
  return useGraphQLQuery<PadariasStatsResponse>(
    ['padarias-stats'],
    GET_PADARIAS_STATS,
    undefined,
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
    }
  );
};

// Tipos para mutations
export interface CreatePadariaInput {
  cnpj: string;
  email?: string;
  endereco?: string;
  nome: string;
  status: string;
  status_pagamento?: string;
  telefone?: string;
  ticket_medio?: number;
}

export interface UpdatePadariaInput {
  email?: string;
  endereco?: string;
  nome?: string;
  status?: string;
  status_pagamento?: string;
  telefone?: string;
  ticket_medio?: number;
}

// Hook para criar padaria
export const useCreatePadaria = () => {
  return useGraphQLMutation<{ insert_padarias_one: Padaria }, { padaria: CreatePadariaInput }>(
    CREATE_PADARIA,
    {
      onSuccess: () => {
        // Invalidar cache das padarias para recarregar a lista
      },
      invalidateQueries: [['padarias'], ['padarias-stats']],
    }
  );
};

// Hook para atualizar padaria
export const useUpdatePadaria = () => {
  return useGraphQLMutation<{ update_padarias: { returning: Padaria[] } }, { cnpj: string; changes: UpdatePadariaInput }>(
    UPDATE_PADARIA,
    {
      onSuccess: () => {
        // Invalidar cache das padarias para recarregar a lista
      },
      invalidateQueries: [['padarias'], ['padarias-stats']],
    }
  );
};

// Hook para deletar padaria
export const useDeletePadaria = () => {
  return useGraphQLMutation<{ delete_padarias: { returning: Padaria[] } }, { cnpj: string }>(
    DELETE_PADARIA,
    {
      onSuccess: () => {
        // Invalidar cache das padarias para recarregar a lista
      },
      invalidateQueries: [['padarias'], ['padarias-stats']],
    }
  );
};

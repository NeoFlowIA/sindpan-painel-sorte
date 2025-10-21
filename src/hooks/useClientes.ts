import { useGraphQLQuery, useGraphQLMutation } from './useGraphQL';
import {
  GET_CLIENTES,
  GET_CLIENTE_BY_ID,
  CREATE_CLIENTE,
  UPDATE_CLIENTE,
  DELETE_CLIENTE,
  GET_PADARIA_BY_NAME,
  GET_CLIENTES_PARA_ANEXAR_PADARIA,
  ANEXAR_CLIENTE_A_PADARIA,
  UPDATE_CLIENTE_PADARIA,
} from '@/graphql/queries';

// Tipos baseados no schema real do Hasura
export interface Cupom {
  id: number;
  cliente_id: number;
  data_compra: string;
}

export interface Padaria {
  id: number;
  nome: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  whatsapp?: string;
  resposta_pergunta?: string;
  padaria_id: number;
  cupons: Cupom[];
  padaria: Padaria;
}

export interface ClientesResponse {
  clientes: Cliente[];
  clientes_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export interface ClienteResponse {
  clientes_by_pk: Cliente;
}

// Tipos para mutations
export interface CreateClienteInput {
  nome: string;
  cpf: string;
  whatsapp: string;
  resposta_pergunta?: string;
  padaria_id: number;
}

// Hook para buscar padaria pelo nome
export const usePadariaByName = (bakeryName: string) => {
  return useGraphQLQuery<{ padarias: Array<{ id: number; cnpj: string; nome: string }> }>(
    ['padaria-by-name', bakeryName],
    GET_PADARIA_BY_NAME,
    { nome: bakeryName },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
      enabled: !!bakeryName,
    }
  );
};

// Hook para buscar clientes de uma padaria específica
export const useClientes = (padariasId: string, limit?: number, offset?: number) => {
  return useGraphQLQuery<ClientesResponse>(
    ['clientes', padariasId, limit, offset],
    GET_CLIENTES,
    {
      padarias_id: padariasId,
      limit: limit || 50,
      offset: offset || 0,
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      enabled: !!padariasId, // Só executa se padariasId estiver definido
    }
  );
};

// Hook para buscar um cliente específico
export const useCliente = (clienteId: number) => {
  return useGraphQLQuery<ClienteResponse>(
    ['cliente', clienteId],
    GET_CLIENTE_BY_ID,
    { id: clienteId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      enabled: !!clienteId,
    }
  );
};

// Hook para criar cliente
export const useCreateCliente = () => {
  return useGraphQLMutation<
    { insert_clientes_one: Cliente }, 
    { cliente: CreateClienteInput }
  >(
    CREATE_CLIENTE,
    {
      onSuccess: () => {
        // Invalidar cache dos clientes para recarregar a lista
      },
      invalidateQueries: [['clientes']],
    }
  );
};

// Hook para atualizar cliente
export const useUpdateCliente = () => {
  return useGraphQLMutation<
    { update_clientes_by_pk: Cliente },
    { id: string; padaria_id: string }
  >(
    UPDATE_CLIENTE_PADARIA,
    {
      onSuccess: () => {
        // Invalidar cache dos clientes para recarregar a lista
      },
      invalidateQueries: [['clientes'], ['cliente']],
    }
  );
};

// Hook para deletar cliente
export const useDeleteCliente = () => {
  return useGraphQLMutation<
    { delete_clientes_by_pk: Cliente }, 
    { id: number }
  >(
    DELETE_CLIENTE,
    {
      onSuccess: () => {
        // Invalidar cache dos clientes para recarregar a lista
      },
      invalidateQueries: [['clientes']],
    }
  );
};

// Hook utilitário para obter estatísticas de clientes
export const useClientesStats = (padariaCnpj: string) => {
  const { data, isLoading, error } = useClientes(padariaCnpj);
  
  return {
    totalClientes: data?.clientes_aggregate?.aggregate?.count || 0,
    totalCupons: data?.clientes?.reduce((acc, cliente) => 
      acc + cliente.cupons_aggregate.aggregate.count, 0
    ) || 0,
    isLoading,
    error,
  };
};

// Hook combinado para buscar clientes usando o nome da padaria
export const useClientesByBakeryName = (bakeryName: string, limit?: number, offset?: number) => {
  const { data: padariaData, isLoading: padariaLoading, error: padariaError } = usePadariaByName(bakeryName);
  const padariaId = padariaData?.padarias?.[0]?.id;
  const padariaCnpj = padariaData?.padarias?.[0]?.cnpj;
  
  const { data: clientesData, isLoading: clientesLoading, error: clientesError } = useClientes(
    padariaId || 0, 
    limit, 
    offset
  );

  // Debug logs
  console.log('🔍 useClientesByBakeryName Debug:', {
    bakeryName,
    padariaData,
    padariaId,
    padariaCnpj,
    padariaLoading,
    padariaError,
    clientesData,
    clientesLoading,
    clientesError,
    limit,
    offset
  });
  
  return {
    clientes: clientesData?.clientes || [],
    totalClientes: clientesData?.clientes_aggregate?.aggregate?.count || 0,
    isLoading: padariaLoading || clientesLoading,
    error: padariaError || clientesError,
    padariaCnpj,
    padariaId,
  };
};

// ===== HOOKS PARA LÓGICA DE ANEXAR CLIENTES =====

// Interface para cliente que pode ser anexado
export interface ClienteParaAnexar {
  id: string;
  nome: string;
  cpf: string;
  whatsapp?: string;
  padaria_id?: string;
  padaria?: {
    id: string;
    nome: string;
  };
  cupons: Array<{
    id: string;
    data_compra: string;
    valor_compra: string;
  }>;
}

// Hook para buscar clientes que podem ser anexados a uma padaria
export const useClientesParaAnexar = (padariaId: string) => {
  return useGraphQLQuery<{
    clientes: ClienteParaAnexar[];
  }>(
    ['clientes-para-anexar', padariaId],
    GET_CLIENTES_PARA_ANEXAR_PADARIA,
    { padaria_id: padariaId },
    {
      staleTime: 2 * 60 * 1000, // 2 minutos
      enabled: !!padariaId,
    }
  );
};

// Hook para anexar cliente a uma padaria
export const useAnexarClienteAPadaria = () => {
  return useGraphQLMutation<
    { update_clientes_by_pk: ClienteParaAnexar },
    { cliente_id: string; padaria_id: string }
  >(
    ANEXAR_CLIENTE_A_PADARIA,
    {
      onSuccess: () => {
        // Invalidar cache dos clientes para recarregar as listas
      },
      invalidateQueries: [
        ['clientes'],
        ['clientes-para-anexar'],
        ['clientes-by-padaria']
      ],
    }
  );
};

// Hook para lógica de anexar clientes automaticamente baseado na quantidade de cupons
export const useAnexarClientesAutomatico = (padariaId: string, limiteCupons: number = 3) => {
  const { data: clientesData, refetch } = useClientesParaAnexar(padariaId);
  const anexarClienteMutation = useAnexarClienteAPadaria();

  const anexarClientesAutomatico = async () => {
    if (!clientesData?.clientes) return;

    const clientesParaAnexar = clientesData.clientes.filter(cliente => {
      // Cliente deve ter mais cupons na padaria do que o limite definido
      return cliente.cupons.length >= limiteCupons;
    });

    console.log('🔍 Clientes para anexar automaticamente:', {
      padariaId,
      limiteCupons,
      totalClientes: clientesData.clientes.length,
      clientesParaAnexar: clientesParaAnexar.length,
      clientes: clientesParaAnexar.map(c => ({
        id: c.id,
        nome: c.nome,
        cupons: c.cupons.length,
        padariaAtual: c.padaria?.nome || 'Nenhuma'
      }))
    });

    // Anexar cada cliente que atende aos critérios
    const promises = clientesParaAnexar.map(cliente => 
      anexarClienteMutation.mutateAsync({
        cliente_id: cliente.id,
        padaria_id: padariaId
      })
    );

    try {
      await Promise.all(promises);
      console.log(`✅ ${clientesParaAnexar.length} clientes anexados automaticamente à padaria`);
      return clientesParaAnexar.length;
    } catch (error) {
      console.error('❌ Erro ao anexar clientes automaticamente:', error);
      throw error;
    }
  };

  return {
    clientesParaAnexar: clientesData?.clientes?.filter(cliente => 
      cliente.cupons.length >= limiteCupons
    ) || [],
    anexarClientesAutomatico,
    isLoading: anexarClienteMutation.isLoading,
    error: anexarClienteMutation.error
  };
};

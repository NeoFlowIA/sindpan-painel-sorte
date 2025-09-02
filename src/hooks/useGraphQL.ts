import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';

// Hook para queries GraphQL
export const useGraphQLQuery = <T = any>(
  queryKey: string[],
  query: string,
  variables?: Record<string, any>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await graphqlClient.query<T>(query, variables);
      return result;
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutos
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled ?? true,
  });
};

// Hook para mutations GraphQL
export const useGraphQLMutation = <T = any, V = Record<string, any>>(
  mutation: string,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: string[][];
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: V) => {
      const result = await graphqlClient.mutate<T>(mutation, variables as Record<string, any>);
      return result;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

// Hook para testar conectividade
export const useGraphQLHealth = () => {
  return useGraphQLQuery(
    ['graphql-health'],
    `query HealthCheck { __typename }`,
    undefined,
    {
      refetchInterval: 30000, // Verificar a cada 30 segundos
      staleTime: 10000, // 10 segundos
    }
  );
};

// Hook para obter informações do schema
export const useGraphQLSchema = () => {
  return useGraphQLQuery(
    ['graphql-schema'],
    `query SchemaInfo {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
      }
    }`,
    undefined,
    {
      staleTime: 60 * 60 * 1000, // 1 hora (schema não muda frequentemente)
    }
  );
};
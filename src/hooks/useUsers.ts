import { useGraphQLQuery } from './useGraphQL';
import { GET_USER, GET_USERS } from '@/graphql/queries';

// Tipos baseados no schema Hasura
export interface User {
  id: string;
  email?: string;
  cnpj?: string;
  bakery_name: string;
  role: 'admin' | 'bakery';
  created_at: string;
}

export interface UserResponse {
  users: User[];
}

// Hook para buscar usuário por email ou CNPJ
export const useUser = (
  identifier: { email?: string; cnpj?: string },
  enabled: boolean = true
) => {
  const key = identifier.email || identifier.cnpj || 'unknown';
  return useGraphQLQuery<UserResponse>(
    ['user', key],
    GET_USER,
    identifier,
    {
      enabled: enabled && (!!identifier.email || !!identifier.cnpj),
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
};

// Hook para buscar todos os usuários (admin only)
export const useUsers = () => {
  return useGraphQLQuery<UserResponse>(
    ['users'],
    GET_USERS,
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
    }
  );
};


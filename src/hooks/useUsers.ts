import { useGraphQLQuery } from './useGraphQL';
import { GET_USER, GET_USERS, GET_USER_BY_EMAIL_WITH_PADARIA } from '@/graphql/queries';

// Tipos baseados no schema Hasura
export interface User {
  id: string;
  email?: string;
  cnpj?: string;
  bakery_name: string;
  role: 'admin' | 'bakery';
  padarias_id?: string; // UUID da padaria
  password_hash?: string;
  padarias?: {
    nome: string;
    id: string;
  } | null;
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
  const hasCnpj = !!identifier.cnpj;
  const query = hasCnpj ? GET_USER : GET_USER_BY_EMAIL_WITH_PADARIA;
  const variables = hasCnpj
    ? {
        ...(identifier.cnpj ? { cnpj: identifier.cnpj } : {}),
        ...(identifier.email ? { email: identifier.email } : {}),
      }
    : { email: identifier.email! };

  return useGraphQLQuery<UserResponse>(
    ['user', key],
    query,
    variables,
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


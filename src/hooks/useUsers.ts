import { useGraphQLQuery } from './useGraphQL';
import {
  GET_USER_BY_CNPJ_WITH_PADARIA,
  GET_USERS,
  GET_USER_BY_EMAIL_WITH_PADARIA,
} from '@/graphql/queries';

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
  identifier: { email?: string | null; cnpj?: string | null },
  enabled: boolean = true
) => {
  const email = identifier.email ?? undefined;
  const cnpj = identifier.cnpj ?? undefined;
  const key = email || cnpj || 'unknown';
  const hasCnpj = !!cnpj;
  const query = hasCnpj ? GET_USER_BY_CNPJ_WITH_PADARIA : GET_USER_BY_EMAIL_WITH_PADARIA;
  const variables = hasCnpj ? { cnpj: cnpj! } : { email: email! };

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


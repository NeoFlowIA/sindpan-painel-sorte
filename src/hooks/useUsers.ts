import { useGraphQLQuery } from './useGraphQL';
import { GET_USER_BY_EMAIL, GET_USERS } from '@/graphql/queries';

// Tipos baseados no schema Hasura
export interface User {
  id: string;
  email: string;
  bakery_name: string;
  role: 'admin' | 'bakery';
  created_at: string;
}

export interface UserResponse {
  users: User[];
}

// Hook para buscar usuário por email
export const useUserByEmail = (email: string, enabled: boolean = true) => {
  return useGraphQLQuery<UserResponse>(
    ['user', email],
    GET_USER_BY_EMAIL,
    { email },
    {
      enabled: enabled && !!email,
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


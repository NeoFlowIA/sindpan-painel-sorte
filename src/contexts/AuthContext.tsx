import React, { createContext, useContext, useEffect, useState } from 'react';
import { sindpanAuthApi, User as SindpanUser, SindpanApiError, LoginData, RegisterData } from '@/services/sindpanAuthApi';
import { useUser } from '@/hooks/useUsers';
import { graphqlClient } from '@/lib/graphql-client';
import { toast } from 'sonner';

interface User {
  id: string;
  email?: string;
  cnpj?: string;
  bakery_name?: string;
  role: 'admin' | 'bakery';
  padarias_id?: string; // UUID da padaria
  padarias?: {
    nome: string;
    id: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBakery: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (identifier: string, password: string, bakeryName: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [sindpanUser, setSindpanUser] = useState<SindpanUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = sindpanAuthApi.isAuthenticated();
  const isAdmin = user?.role === 'admin';
  const isBakery = user?.role === 'bakery';

  // Buscar dados do usuário no Hasura quando temos email ou CNPJ
  const { data: hasuraUserData, isLoading: hasuraLoading } = useUser(
    { email: sindpanUser?.email, cnpj: sindpanUser?.cnpj },
    !!(sindpanUser?.email || sindpanUser?.cnpj)
  );

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Combinar dados do SINDPAN com dados do Hasura
  useEffect(() => {
    if (sindpanUser && hasuraUserData?.users?.[0] && !hasuraLoading) {
      const hasuraUser = hasuraUserData.users[0];
      const combinedUser: User = {
        id: sindpanUser.id,
        email: sindpanUser.email,
        cnpj: hasuraUser.cnpj || sindpanUser.cnpj,
        bakery_name: sindpanUser.bakery_name,
        role: hasuraUser.role,
        padarias_id: hasuraUser.padarias_id, // UUID da padaria vinculada
        padarias: undefined // Temporariamente undefined até confirmar relacionamento
      };
      
      console.log('🔍 AuthContext - Combined User (Com padarias_id da FK):', combinedUser);
      setUser(combinedUser);
    } else if (!sindpanUser) {
      setUser(null);
    }
  }, [sindpanUser, hasuraUserData, hasuraLoading]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('sindpan_access_token');
      
      if (!token) {
        setSindpanUser(null);
        setUser(null);
        return;
      }

      // Decodificar token mock
      try {
        const tokenData = JSON.parse(atob(token));
        
        // Verificar se token expirou
        if (tokenData.exp && Date.now() > tokenData.exp) {
          console.log('🔍 Token expired');
          localStorage.removeItem('sindpan_access_token');
          setSindpanUser(null);
          setUser(null);
          return;
        }

        // Buscar dados atualizados do usuário no Hasura
        const hasuraResponse = await graphqlClient.query<{
          users: Array<{
            id: string;
            email: string;
            cnpj: string;
            bakery_name: string;
            role: string;
          }>;
        }>(
          `
          query GetUserById($id: uuid!) {
            users(where: {id: {_eq: $id}}) {
              id
              email
              cnpj
              bakery_name
              role
            }
          }
          `,
          { id: tokenData.userId }
        );

        const userData = hasuraResponse.users?.[0];
        
        if (userData) {
          const mockSindpanUser: SindpanUser = {
            id: userData.id,
            email: userData.email || undefined,
            cnpj: userData.cnpj || undefined,
            bakery_name: userData.bakery_name,
            role: userData.role,
          };
          setSindpanUser(mockSindpanUser);
        } else {
          // Usuário não existe mais
          localStorage.removeItem('sindpan_access_token');
          setSindpanUser(null);
          setUser(null);
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        localStorage.removeItem('sindpan_access_token');
        setSindpanUser(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setSindpanUser(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Login attempt with identifier:', identifier);

      // Buscar usuário diretamente no Hasura
      // Determinar se é email ou CNPJ e montar query apropriada
      const isEmail = identifier.includes('@');
      
      const hasuraResponse = await graphqlClient.query<{
        users: Array<{
          id: string;
          email: string;
          cnpj: string;
          bakery_name: string;
          role: string;
          padarias_id: string;
          password_hash: string;
        }>;
      }>(
        isEmail
          ? `
            query CheckUserByEmail($email: String!) {
              users(where: {email: {_eq: $email}}) {
                id
                email
                cnpj
                bakery_name
                role
                padarias_id
                password_hash
              }
            }
            `
          : `
            query CheckUserByCnpj($cnpj: String!) {
              users(where: {cnpj: {_eq: $cnpj}}) {
                id
                email
                cnpj
                bakery_name
                role
                padarias_id
                password_hash
              }
            }
            `,
        isEmail ? { email: identifier } : { cnpj: identifier }
      );

      console.log('🔍 Hasura response:', hasuraResponse);

      const hasuraUser = hasuraResponse.users?.[0];
      
      if (!hasuraUser) {
        toast.error('Erro no login', {
          description: 'Usuário não encontrado',
        });
        throw new Error('Usuário não encontrado');
      }

      // TODO: Implementar validação real de senha com bcrypt
      // Por enquanto, aceita qualquer senha para desenvolvimento
      console.log('⚠️ ATENÇÃO: Validação de senha desabilitada (desenvolvimento)');

      // Criar token JWT simples (mock para desenvolvimento)
      const mockToken = btoa(JSON.stringify({
        userId: hasuraUser.id,
        email: hasuraUser.email,
        role: hasuraUser.role,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      }));

      // Armazenar token
      sindpanAuthApi.logout(); // Limpa token antigo
      localStorage.setItem('sindpan_access_token', mockToken);

      // Criar objeto SindpanUser
      const mockSindpanUser: SindpanUser = {
        id: hasuraUser.id,
        email: hasuraUser.email,
        cnpj: hasuraUser.cnpj,
        bakery_name: hasuraUser.bakery_name,
        role: hasuraUser.role,
      };

      setSindpanUser(mockSindpanUser);

      toast.success('Login realizado com sucesso', {
        description: hasuraUser.role === 'admin' 
          ? 'Bem-vindo ao painel administrativo!' 
          : 'Carregando seus dados...',
      });

    } catch (error) {
      console.error('Login failed:', error);

      let errorMessage = 'Erro no login';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error('Erro no login', {
        description: errorMessage,
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (identifier: string, password: string, bakeryName: string) => {
    try {
      setIsLoading(true);

      console.log('🔍 Register attempt:', { identifier, bakeryName });

      // Verificar se usuário já existe
      const isEmail = identifier.includes('@');
      
      const checkResponse = await graphqlClient.query<{
        users: Array<{ id: string }>;
      }>(
        isEmail
          ? `
            query CheckExistingUserByEmail($email: String!) {
              users(where: {email: {_eq: $email}}) {
                id
              }
            }
            `
          : `
            query CheckExistingUserByCnpj($cnpj: String!) {
              users(where: {cnpj: {_eq: $cnpj}}) {
                id
              }
            }
            `,
        isEmail ? { email: identifier } : { cnpj: identifier }
      );

      if (checkResponse.users && checkResponse.users.length > 0) {
        toast.error('Erro no cadastro', {
          description: 'Identificador já está cadastrado',
        });
        throw new Error('Identificador já está cadastrado');
      }

      // Criar novo usuário no Hasura
      // TODO: Hash real da senha com bcrypt
      const passwordHash = btoa(password); // Mock - NÃO usar em produção!

      const insertResponse = await graphqlClient.mutate<{
        insert_users_one: {
          id: string;
          email: string;
          cnpj: string;
          bakery_name: string;
          role: string;
        };
      }>(
        isEmail
          ? `
            mutation InsertUserWithEmail($email: String!, $bakery_name: String!, $password_hash: String!) {
              insert_users_one(object: {
                email: $email,
                bakery_name: $bakery_name,
                password_hash: $password_hash,
                role: "bakery"
              }) {
                id
                email
                cnpj
                bakery_name
                role
              }
            }
            `
          : `
            mutation InsertUserWithCnpj($cnpj: String!, $bakery_name: String!, $password_hash: String!) {
              insert_users_one(object: {
                cnpj: $cnpj,
                bakery_name: $bakery_name,
                password_hash: $password_hash,
                role: "bakery"
              }) {
                id
                email
                cnpj
                bakery_name
                role
              }
            }
            `,
        isEmail
          ? {
              email: identifier,
              bakery_name: bakeryName,
              password_hash: passwordHash
            }
          : {
              cnpj: identifier,
              bakery_name: bakeryName,
              password_hash: passwordHash
            }
      );

      const newUser = insertResponse.insert_users_one;

      // Criar objeto SindpanUser
      const mockSindpanUser: SindpanUser = {
        id: newUser.id,
        email: newUser.email || undefined,
        cnpj: newUser.cnpj || undefined,
        bakery_name: newUser.bakery_name,
        role: newUser.role,
      };

      // Criar token
      const mockToken = btoa(JSON.stringify({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        exp: Date.now() + (24 * 60 * 60 * 1000)
      }));

      localStorage.setItem('sindpan_access_token', mockToken);
      setSindpanUser(mockSindpanUser);

      toast.success('Cadastro realizado com sucesso', {
        description: 'Padaria ' + bakeryName + ' foi cadastrada no sistema!',
      });
    } catch (error) {
      console.error('Registration failed:', error);

      let errorMessage = 'Erro no cadastro';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error('Erro no cadastro', {
        description: errorMessage,
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sindpanAuthApi.logout();
    setSindpanUser(null);
    setUser(null);

    toast.success('Logout realizado', {
      description: 'Você foi desconectado com sucesso',
    });
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isBakery,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

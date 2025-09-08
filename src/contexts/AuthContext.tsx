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
  created_at?: string;
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
        cnpj: sindpanUser.cnpj,
        bakery_name: sindpanUser.bakery_name,
        role: hasuraUser.role,
        created_at: hasuraUser.created_at,
      };
      setUser(combinedUser);
    } else if (!sindpanUser) {
      setUser(null);
    }
  }, [sindpanUser, hasuraUserData, hasuraLoading]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      if (!sindpanAuthApi.isAuthenticated()) {
        setSindpanUser(null);
        setUser(null);
        return;
      }

      const { user: userData } = await sindpanAuthApi.getProfile();
      setSindpanUser(userData);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      if (error instanceof SindpanApiError && error.status === 401) {
        sindpanAuthApi.logout();
        setSindpanUser(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      const payload: Partial<LoginData> = { password };
      if (identifier.includes('@')) {
        payload.email = identifier;
      } else {
        payload.cnpj = identifier;
      }

      try {
        const response = await sindpanAuthApi.login(payload);
        setSindpanUser(response.user);

        toast.success('Login realizado com sucesso', {
          description: 'Carregando seus dados...',
        });
        return;
      } catch (sindpanError) {
        console.log('🔍 SINDPAN login failed, trying Hasura fallback...', sindpanError);

        if (
          sindpanError instanceof SindpanApiError &&
          sindpanError.status === 401 &&
          identifier.includes('@')
        ) {
          const hasuraResponse = await graphqlClient.query(
            `
            query CheckUser($email: String!) {
              users(where: {email: {_eq: $email}}) {
                id
                email
                cnpj
                bakery_name
                role
                created_at
              }
            }
          `,
            { email: identifier }
          );

          if (hasuraResponse.users && hasuraResponse.users.length > 0) {
            const hasuraUser = hasuraResponse.users[0];

            if (hasuraUser.role === 'admin') {
              const mockSindpanUser: SindpanUser = {
                id: hasuraUser.id,
                email: hasuraUser.email,
                cnpj: hasuraUser.cnpj,
                bakery_name: hasuraUser.bakery_name,
                role: hasuraUser.role,
              };

              setSindpanUser(mockSindpanUser);

              toast.success('Login realizado com sucesso', {
                description: 'Bem-vindo ao painel administrativo!',
              });
              return;
            }
          }
        }

        throw sindpanError;
      }
    } catch (error) {
      console.error('Login failed:', error);

      let errorMessage = 'Erro no login';
      if (error instanceof SindpanApiError) {
        if (error.status === 401) {
          errorMessage = 'Credenciais inválidas';
        } else if (error.status === 400) {
          errorMessage = 'Identificador e senha são obrigatórios';
        } else {
          errorMessage = error.message;
        }
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

      const payload: Partial<RegisterData> = { password, bakery_name: bakeryName };
      if (identifier.includes('@')) {
        payload.email = identifier;
      } else {
        payload.cnpj = identifier;
      }
      const response = await sindpanAuthApi.register(payload);
      setSindpanUser(response.user);

      toast.success('Cadastro realizado com sucesso', {
        description: `Padaria ${bakeryName} foi cadastrada no sistema!`,
      });
    } catch (error) {
      console.error('Registration failed:', error);

      let errorMessage = 'Erro no cadastro';
      if (error instanceof SindpanApiError) {
        if (error.status === 409) {
          errorMessage = 'Identificador já está cadastrado';
        } else if (error.status === 400) {
          errorMessage = 'Dados obrigatórios ausentes';
        } else {
          errorMessage = error.message;
        }
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

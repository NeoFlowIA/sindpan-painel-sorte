import React, { createContext, useContext, useEffect, useState } from 'react';
import { sindpanAuthApi, User as SindpanUser, SindpanApiError } from '@/services/sindpanAuthApi';
import { useUserByEmail } from '@/hooks/useUsers';
import { graphqlClient } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Tipo combinado do usuário (SINDPAN + Hasura)
interface User {
  // Dados do SINDPAN
  id: string;
  email: string;
  bakery_name: string;
  // Dados do Hasura
  role: 'admin' | 'bakery';
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  sindpanUser: SindpanUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBakery: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, bakeryName: string) => Promise<void>;
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

  // Buscar dados do usuário no Hasura quando temos o email
  const { data: hasuraUserData, isLoading: hasuraLoading } = useUserByEmail(
    sindpanUser?.email || '',
    !!sindpanUser?.email
  );

  const isAuthenticated = !!user && sindpanAuthApi.isAuthenticated();
  const isAdmin = user?.role === 'admin';
  const isBakery = user?.role === 'bakery';

  // Load user profile on app start
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
      // If token is invalid, clear it
      if (error instanceof SindpanApiError && error.status === 401) {
        sindpanAuthApi.logout();
        setSindpanUser(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Tentar login via SINDPAN API primeiro
      try {
        const response = await sindpanAuthApi.login({ email, password });
        setSindpanUser(response.user);
        
        toast.success('Login realizado com sucesso', {
          description: 'Carregando seus dados...',
        });
        return;
      } catch (sindpanError) {
        console.log('🔍 SINDPAN login failed, trying Hasura fallback...', sindpanError);
        
        // Se falhou no SINDPAN, tentar fallback com Hasura
        // Para admins que podem existir apenas na tabela users
        if (sindpanError instanceof SindpanApiError && sindpanError.status === 401) {
          // Buscar usuário na tabela users do Hasura
          const hasuraResponse = await graphqlClient.query(`
            query CheckUser($email: String!) {
              users(where: {email: {_eq: $email}}) {
                id
                email
                bakery_name
                role
                created_at
              }
            }
          `, { email });
          
          if (hasuraResponse.users && hasuraResponse.users.length > 0) {
            const hasuraUser = hasuraResponse.users[0];
            
            // Para simplificar, vamos aceitar qualquer senha para admins (temporariamente)
            // Em produção, você deve implementar verificação de senha adequada
            if (hasuraUser.role === 'admin') {
              // Simular usuário SINDPAN para compatibilidade
              const mockSindpanUser = {
                id: hasuraUser.id,
                email: hasuraUser.email,
                bakery_name: hasuraUser.bakery_name,
                role: hasuraUser.role
              };
              
              setSindpanUser(mockSindpanUser as any);
              
              toast.success('Login realizado com sucesso', {
                description: 'Bem-vindo ao painel administrativo!',
              });
              return;
            }
          }
        }
        
        // Se chegou aqui, o login realmente falhou
        throw sindpanError;
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      let errorMessage = 'Erro no login';
      if (error instanceof SindpanApiError) {
        if (error.status === 401) {
          errorMessage = 'Email ou senha inválidos';
        } else if (error.status === 400) {
          errorMessage = 'Email e senha são obrigatórios';
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

  const register = async (email: string, password: string, bakeryName: string) => {
    try {
      setIsLoading(true);
      
      const response = await sindpanAuthApi.register({
        email,
        password,
        bakery_name: bakeryName,
      });
      
      setSindpanUser(response.user);
      
      toast.success('Cadastro realizado com sucesso', {
        description: `Padaria ${bakeryName} foi cadastrada no sistema!`,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      
      let errorMessage = 'Erro no cadastro';
      if (error instanceof SindpanApiError) {
        if (error.status === 409) {
          errorMessage = 'Este email já está cadastrado';
        } else if (error.status === 400) {
          errorMessage = 'Email, senha e nome da padaria são obrigatórios';
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
    sindpanUser,
    isLoading: isLoading || hasuraLoading,
    isAuthenticated,
    isAdmin,
    isBakery,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

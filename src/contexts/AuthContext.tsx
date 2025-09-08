import React, { createContext, useContext, useEffect, useState } from 'react';
import { sindpanAuthApi, User as ApiUser, SindpanApiError, LoginData, RegisterData } from '@/services/sindpanAuthApi';
import { toast } from 'sonner';

interface User extends ApiUser {
  role: 'admin' | 'bakery';
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = sindpanAuthApi.isAuthenticated();
  const isAdmin = user?.role === 'admin';
  const isBakery = user?.role === 'bakery';

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);

      if (!sindpanAuthApi.isAuthenticated()) {
        setUser(null);
        return;
      }

      const { user: userData } = await sindpanAuthApi.getProfile();
      setUser(userData as User);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      if (error instanceof SindpanApiError && error.status === 401) {
        sindpanAuthApi.logout();
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

      const response = await sindpanAuthApi.login(payload);
      setUser(response.user as User);

      toast.success('Login realizado com sucesso', {
        description: 'Carregando seus dados...',
      });
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
      setUser(response.user as User);

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

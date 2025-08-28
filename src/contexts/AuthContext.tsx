import React, { createContext, useContext, useEffect, useState } from 'react';
import { sindpanAuthApi, User, SindpanApiError } from '@/services/sindpanAuthApi';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  const isAuthenticated = !!user && sindpanAuthApi.isAuthenticated();

  // Load user profile on app start
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
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // If token is invalid, clear it
      if (error instanceof SindpanApiError && error.status === 401) {
        sindpanAuthApi.logout();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await sindpanAuthApi.login({ email, password });
      setUser(response.user);
      
      toast.success('Login realizado com sucesso', {
        description: `Bem-vindo${response.user.role === 'bakery' ? ' ao portal da sua padaria' : ' ao painel administrativo'}!`,
      });
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
      
      setUser(response.user);
      
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

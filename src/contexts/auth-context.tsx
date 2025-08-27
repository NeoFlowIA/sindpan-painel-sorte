import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: 'bakery' | 'admin';
  bakery_name?: string;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, bakery_name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_TOKEN_KEY = 'auth_token';

// Mock data for demo mode
const mockUsers: Record<string, User> = {
  'paoquente@exemplo.com': {
    id: '0f5a-111',
    email: 'paoquente@exemplo.com',
    role: 'bakery',
    bakery_name: 'Padaria Pão Quente',
    created_at: '2025-08-27T14:00:00.000Z'
  },
  'admin@sindpan.org.br': {
    id: '9ab3-222',
    email: 'admin@sindpan.org.br',
    role: 'admin',
    bakery_name: null,
    created_at: '2025-08-20T10:00:00.000Z'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    loading: true
  });
  const navigate = useNavigate();

  // Check if API is available
  const isApiAvailable = Boolean(import.meta.env.VITE_API_BASE);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (!storedToken) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (!isApiAvailable) {
        // Demo mode - use mock data
        const mockUser = Object.values(mockUsers)[0];
        setState({
          token: storedToken,
          user: mockUser,
          loading: false
        });
        return;
      }

      try {
        const response = await apiFetch('/auth/me');
        const user = await response.json();
        
        setState({
          token: storedToken,
          user,
          loading: false
        });
      } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setState({
          token: null,
          user: null,
          loading: false
        });
      }
    };

    initializeAuth();
  }, [isApiAvailable]);

  const login = async (email: string, password: string) => {
    if (!isApiAvailable) {
      // Demo mode
      const mockUser = mockUsers[email];
      if (!mockUser || password !== 'demo123') {
        throw new Error('Credenciais inválidas.');
      }
      
      const mockToken = 'demo-token-' + Date.now();
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      setState({
        token: mockToken,
        user: mockUser,
        loading: false
      });
      
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao sistema SINDPAN.'
      });
      navigate('/perfil');
      return;
    }

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Credenciais inválidas.');
      }

      const { user, accessToken } = await response.json();
      
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      setState({
        token: accessToken,
        user,
        loading: false
      });

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao sistema SINDPAN.'
      });
      navigate('/perfil');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, bakery_name?: string) => {
    if (!isApiAvailable) {
      // Demo mode - create new user
      const newUser: User = {
        id: 'new-' + Date.now(),
        email,
        role: 'bakery',
        bakery_name,
        created_at: new Date().toISOString()
      };
      
      const mockToken = 'demo-token-' + Date.now();
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      setState({
        token: mockToken,
        user: newUser,
        loading: false
      });
      
      toast({
        title: 'Cadastro criado!',
        description: 'Sua conta foi criada com sucesso.'
      });
      navigate('/perfil');
      return;
    }

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, bakery_name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conta.');
      }

      const { user, accessToken } = await response.json();
      
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      setState({
        token: accessToken,
        user,
        loading: false
      });

      toast({
        title: 'Cadastro criado!',
        description: 'Sua conta foi criada com sucesso.'
      });
      navigate('/perfil');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setState({
      token: null,
      user: null,
      loading: false
    });
    navigate('/entrar');
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
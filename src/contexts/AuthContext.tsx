import React, { createContext, useContext, useEffect, useState } from 'react';
import bcrypt from 'bcryptjs';
import { sindpanAuthApi, User as SindpanUser } from '@/services/sindpanAuthApi';
import { useUser } from '@/hooks/useUsers';
import { graphqlClient } from '@/lib/graphql-client';
import { toast } from 'sonner';
import { GET_PADARIA_BY_CNPJ, UPSERT_PADARIA_USER } from '@/graphql/queries';

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
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBakery: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (identifier: string, password: string, bakeryName: string) => Promise<void>;
  setupBakeryAccess: (params: { cnpj: string; password: string }) => Promise<void>;
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

  const normalizeCnpj = (value: string) => value.replace(/\D/g, '');
  const createSessionToken = (payload: Omit<SindpanUser, 'role'> & { role: string }) => {
    return btoa(
      JSON.stringify({
        userId: payload.id,
        email: payload.email,
        role: payload.role,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
    );
  };

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
        padarias: hasuraUser.padarias ?? null
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
            padarias_id?: string;
            padarias?: { id: string; nome: string } | null;
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
              padarias_id
              padarias {
                id
                nome
              }
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
      const normalizedIdentifier = isEmail ? identifier : normalizeCnpj(identifier);

      const hasuraResponse = await graphqlClient.query<{
        users: Array<{
          id: string;
          email: string | null;
          cnpj: string | null;
          bakery_name: string | null;
          role: string;
          padarias_id: string | null;
          password_hash: string | null;
          padarias?: { id: string; nome: string } | null;
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
                padarias {
                  id
                  nome
                }
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
                padarias {
                  id
                  nome
                }
              }
            }
            `,
        isEmail ? { email: normalizedIdentifier } : { cnpj: normalizedIdentifier }
      );

      console.log('🔍 Hasura response:', hasuraResponse);

      const hasuraUser = hasuraResponse.users?.[0];

      if (!hasuraUser) {
        toast.error('Erro no login', {
          description: 'Usuário não encontrado',
        });
        throw new Error('Usuário não encontrado');
      }

      if (!hasuraUser.password_hash) {
        toast.error('Erro no login', {
          description: 'Defina uma senha no primeiro acesso antes de entrar.',
        });
        throw new Error('Senha não configurada');
      }

      const isPasswordValid = await bcrypt.compare(password, hasuraUser.password_hash);

      if (!isPasswordValid) {
        toast.error('Erro no login', {
          description: 'CNPJ ou senha inválidos',
        });
        throw new Error('Senha inválida');
      }

      if (!hasuraUser.padarias_id) {
        toast.error('Erro no login', {
          description: 'Padaria ainda não vinculada. Conclua o primeiro acesso.',
        });
        throw new Error('Padaria não vinculada');
      }

      // Criar token JWT simples (mock para desenvolvimento)
      const mockSindpanUser: SindpanUser = {
        id: hasuraUser.id,
        email: hasuraUser.email || undefined,
        cnpj: hasuraUser.cnpj || undefined,
        bakery_name: hasuraUser.bakery_name || undefined,
        role: hasuraUser.role,
      };

      const mockToken = createSessionToken({
        id: mockSindpanUser.id,
        email: mockSindpanUser.email,
        role: mockSindpanUser.role,
      });

      // Armazenar token
      sindpanAuthApi.logout(); // Limpa token antigo
      localStorage.setItem('sindpan_access_token', mockToken);

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

  const setupBakeryAccess = async ({ cnpj, password }: { cnpj: string; password: string }) => {
    try {
      setIsLoading(true);

      const sanitizedCnpj = normalizeCnpj(cnpj);

      if (sanitizedCnpj.length !== 14) {
        throw new Error('Informe um CNPJ válido com 14 dígitos');
      }

      const padariaResponse = await graphqlClient.query<{
        padarias: Array<{
          id: string;
          nome: string;
          cnpj: string;
          status: string;
          email: string | null;
        }>;
      }>(GET_PADARIA_BY_CNPJ, { cnpj: sanitizedCnpj });

      const padaria = padariaResponse.padarias?.[0];

      if (!padaria) {
        throw new Error('Padaria não encontrada. Verifique o CNPJ informado.');
      }

      if (padaria.status && padaria.status !== 'ativa') {
        throw new Error('Padaria ainda não está ativa. Entre em contato com o SINDPAN.');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const upsertResponse = await graphqlClient.mutate<{
        insert_users_one: {
          email: string | null;
          id: string;
          cnpj: string;
          bakery_name: string | null;
          role: string;
          padarias_id: string;
          password_hash: string;
        };
      }>(UPSERT_PADARIA_USER, {
        cnpj: sanitizedCnpj,
        padarias_id: padaria.id,
        password_hash: passwordHash,
        bakery_name: padaria.nome,
        email: padaria.email ?? null,
      });

      const upsertedUser = upsertResponse.insert_users_one;

      if (!upsertedUser) {
        throw new Error('Não foi possível atualizar o usuário da padaria.');
      }

      const mockSindpanUser: SindpanUser = {
        id: upsertedUser.id,
        email: upsertedUser.email || undefined,
        cnpj: sanitizedCnpj,
        bakery_name: upsertedUser.bakery_name || padaria.nome,
        role: upsertedUser.role,
      };

      const mockToken = createSessionToken({
        id: mockSindpanUser.id,
        email: mockSindpanUser.email,
        role: mockSindpanUser.role,
      });

      sindpanAuthApi.logout();
      localStorage.setItem('sindpan_access_token', mockToken);
      setSindpanUser(mockSindpanUser);
      setUser({
        id: mockSindpanUser.id,
        email: mockSindpanUser.email,
        cnpj: mockSindpanUser.cnpj,
        bakery_name: mockSindpanUser.bakery_name,
        role: mockSindpanUser.role as 'admin' | 'bakery',
        padarias_id: upsertedUser.padarias_id,
        padarias: {
          id: padaria.id,
          nome: padaria.nome,
        },
      });

      toast.success('Senha definida com sucesso', {
        description: 'Agora você pode acessar o portal com o seu CNPJ e senha.',
      });
    } catch (error) {
      console.error('Primeiro acesso falhou:', error);

      let errorMessage = 'Não foi possível concluir o primeiro acesso';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error('Erro no primeiro acesso', {
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
        isEmail ? { email: identifier } : { cnpj: normalizeCnpj(identifier) }
      );

      if (checkResponse.users && checkResponse.users.length > 0) {
        toast.error('Erro no cadastro', {
          description: 'Identificador já está cadastrado',
        });
        throw new Error('Identificador já está cadastrado');
      }

      const passwordHash = await bcrypt.hash(password, 10);

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
              cnpj: normalizeCnpj(identifier),
              bakery_name: bakeryName,
              password_hash: passwordHash
            }
      );

      const newUser = insertResponse.insert_users_one;

      // Criar objeto SindpanUser
      const mockSindpanUser: SindpanUser = {
        id: newUser.id,
        email: newUser.email || undefined,
        cnpj: isEmail ? undefined : normalizeCnpj(identifier),
        bakery_name: newUser.bakery_name,
        role: newUser.role,
      };

      // Criar token
      const mockToken = createSessionToken({
        id: mockSindpanUser.id,
        email: mockSindpanUser.email,
        role: mockSindpanUser.role,
      });

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
    setupBakeryAccess,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

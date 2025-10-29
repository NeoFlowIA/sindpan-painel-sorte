// Cliente GraphQL simples usando fetch
import { hasuraConfig } from '@/config/hasura';
import { sindpanAuthApi } from '@/services/sindpanAuthApi';

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

// Verifica se o token JWT está expirado
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

class GraphQLClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async request<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    const token = sindpanAuthApi.getToken();

    // Log para debug
    console.log('GraphQL Request:', {
      hasToken: !!token,
      tokenExpired: token ? isTokenExpired(token) : 'no token',
      endpoint: this.endpoint,
      query: query.substring(0, 200) + '...',
      variables
    });

    const body: GraphQLRequest = {
      query,
      variables,
      operationName,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': 'mysecretkey',
    };

    // Adicionar token se disponível e válido
    if (token && !isTokenExpired(token)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      // Em desenvolvimento, o proxy cuida do CORS
      // Em produção, usamos CORS direto
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result: GraphQLResponse<T> = await response.json();
    
    // Log apenas se houver erros
    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL Errors:', result.errors);
    }

    return result;
  }

  // Método de conveniência para queries
  async query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await this.request<T>(query, variables);

    if (response.errors && response.errors.length > 0) {
      console.error('GraphQL Query Errors:', {
        errors: response.errors,
        query: query.substring(0, 200),
        variables
      });
      throw new Error(`GraphQL Error: ${response.errors[0].message}`);
    }

    return response.data as T;
  }

  // Método de conveniência para mutations
  async mutate<T = unknown>(mutation: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await this.request<T>(mutation, variables);

    if (response.errors && response.errors.length > 0) {
      console.error('GraphQL Mutation Errors:', {
        errors: response.errors,
        mutation: mutation.substring(0, 200),
        variables
      });
      throw new Error(`GraphQL Error: ${response.errors[0].message}`);
    }

    return response.data as T;
  }
}

// Função para obter a URL do GraphQL
const getGraphQLEndpoint = (): string => {
  if (!hasuraConfig.endpoint) {
    throw new Error('HASURA_ENDPOINT is not configured');
  }

  return hasuraConfig.endpoint;
};

// Cliente GraphQL configurado
export const graphqlClient = new GraphQLClient(getGraphQLEndpoint());

export default graphqlClient;

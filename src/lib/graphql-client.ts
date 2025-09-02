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

    // Não chamar o Hasura se não houver token ou se estiver expirado
    if (!token || isTokenExpired(token)) {
      throw new Error('Authentication token missing or expired');
    }

    const body: GraphQLRequest = {
      query,
      variables,
      operationName,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();
    return result;
  }

  // Método de conveniência para queries
  async query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await this.request<T>(query, variables);

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message);
    }

    return response.data as T;
  }

  // Método de conveniência para mutations
  async mutate<T = unknown>(mutation: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await this.request<T>(mutation, variables);

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message);
    }

    return response.data as T;
  }
}

// Função para obter a URL do GraphQL baseada no ambiente
const getGraphQLEndpoint = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    // No navegador, usar o proxy local
    return '/graphql';
  }
  if (!hasuraConfig.endpoint) {
    throw new Error('HASURA_ENDPOINT is not configured');
  }
  return hasuraConfig.endpoint;
};

// Cliente GraphQL configurado
export const graphqlClient = new GraphQLClient(getGraphQLEndpoint());

export default graphqlClient;

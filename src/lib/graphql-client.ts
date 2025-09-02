// Cliente GraphQL simples usando fetch
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

class GraphQLClient {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string, headers: Record<string, string> = {}) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  async request<T = any>(
    query: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    const body: GraphQLRequest = {
      query,
      variables,
      operationName,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();
      return result;
    } catch (error) {
      console.error('GraphQL Request Error:', error);
      throw error;
    }
  }

  // Método de conveniência para queries
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await this.request<T>(query, variables);
    
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message);
    }
    
    return response.data as T;
  }

  // Método de conveniência para mutations
  async mutate<T = any>(mutation: string, variables?: Record<string, any>): Promise<T> {
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
  // Fallback para a URL direta (endpoint correto)
  return 'https://neotalks-hasura.t2wird.easypanel.host/v1/graphql';
};

// Importar configuração do Hasura
import { hasuraConfig } from '@/config/hasura';

// Cliente GraphQL configurado
export const graphqlClient = new GraphQLClient(getGraphQLEndpoint(), hasuraConfig.getHeaders());

export default graphqlClient;

// Configurações do Hasura
export const hasuraConfig = {
  // Endpoint GraphQL
  endpoint: 'https://neotalks-hasura.t2wird.easypanel.host/v1/graphql',
  
  // Chave de admin (você precisa fornecer a chave real)
  adminSecret: 'mysecretkey', // TODO: Adicionar a chave real aqui
  
  // Headers padrão
  getHeaders: () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Se tiver a chave de admin, adicionar
    if (hasuraConfig.adminSecret) {
      headers['x-hasura-admin-secret'] = hasuraConfig.adminSecret;
    }
    
    return headers;
  }
};


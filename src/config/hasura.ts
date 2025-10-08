// Configurações do Hasura
// Em desenvolvimento, SEMPRE usa o proxy /graphql para evitar problemas de CORS
// Em produção, usa a URL completa do Hasura
export const hasuraConfig = {
  endpoint: import.meta.env.DEV 
    ? '/graphql' // Proxy local em desenvolvimento
    : (import.meta.env.HASURA_ENDPOINT || 'https://infra-hasura-sindpan.k3p3ex.easypanel.host/v1/graphql'),
};


// Configurações do Hasura
// O endpoint é lido exclusivamente da variável de ambiente HASURA_ENDPOINT
export const hasuraConfig = {
  endpoint: import.meta.env.VITE_HASURA_ENDPOINT || process.env.HASURA_ENDPOINT || '',
};


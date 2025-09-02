// Configurações do Hasura
// O endpoint é lido exclusivamente da variável de ambiente HASURA_ENDPOINT
// Em desenvolvimento, se a variável não estiver definida, caímos no proxy local
export const hasuraConfig = {
  endpoint:
    // valor injetado pelo build (define em `vite.config.ts`)
    import.meta.env.HASURA_ENDPOINT ||
    // fallback apenas para desenvolvimento
    (import.meta.env.DEV ? '/graphql' : ''),
};


# Integração GraphQL - API Hasura

## Configuração Inicial

A integração com a API GraphQL Hasura foi configurada com uma solução simples e eficiente:

### 🔧 Configuração

- **Endpoint**: `https://neotalks-hasura.t2wird.easypanel.host/v1beta1/relay`
- **Cliente**: Fetch API nativo + React Query
- **Proxy Local**: `/graphql` (para desenvolvimento)
- **CORS**: Configurado corretamente para localhost

### 📁 Arquivos Criados

1. **`src/lib/graphql-client.ts`** - Cliente GraphQL simples usando fetch
2. **`src/hooks/useGraphQL.ts`** - Hooks customizados para React Query
3. **`src/graphql/queries.ts`** - Queries GraphQL como strings
4. **`src/components/GraphQLHealthCheck.tsx`** - Componente de teste de conectividade

### 🚀 Como Usar

#### 1. Testando a Conexão

O componente `GraphQLHealthCheck` foi adicionado ao dashboard principal para verificar:
- ✅ Status da conexão
- 📊 Informações do schema
- 🔍 Detalhes do endpoint

#### 2. Criando Queries

```typescript
// Em src/graphql/queries.ts
export const GET_USERS = `
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;
```

#### 3. Usando nos Componentes

```typescript
import { useGraphQLQuery } from '@/hooks/useGraphQL';
import { GET_USERS } from '@/graphql/queries';

const MyComponent = () => {
  const { data, isLoading, error } = useGraphQLQuery(
    ['users'], // Query key para React Query
    GET_USERS   // Query string
  );
  
  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  
  return (
    <div>
      {data?.users?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
};
```

### 🛠️ Configuração de CORS

Para desenvolvimento local:
- **Proxy configurado** no `vite.config.ts` (simplificado)
- **CORS habilitado** no servidor Vite
- **Fetch API** com modo CORS
- **Host específico** (localhost) para evitar conflitos

### 📋 Próximos Passos

1. **Definir o schema das tabelas** - Aguardando especificações
2. **Criar queries específicas** - Baseado nas necessidades do dashboard
3. **Implementar mutations** - Para operações de escrita
4. **Configurar autenticação** - Se necessário
5. **Gerar tipos TypeScript** - Usando GraphQL Code Generator

### 🔍 Debug e Monitoramento

- Logs detalhados no proxy (desenvolvimento)
- Health check visual no dashboard
- Error handling configurado
- Cache otimizado do Apollo Client

### ⚡ Comandos Úteis

```bash
# Instalar dependências GraphQL (apenas graphql)
npm install graphql

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar aplicação
http://localhost:8080
```

## Status Atual

✅ **Configuração inicial completa**
✅ **Cliente GraphQL simples configurado**
✅ **Proxy CORS configurado e funcionando**  
✅ **Componente de teste criado**
✅ **Servidor funcionando em localhost:8080**
⏳ **Aguardando definição das tabelas/queries específicas**

### 🎯 Vantagens da Nova Configuração

- ✅ **Mais simples**: Sem dependências complexas
- ✅ **Melhor CORS**: Configuração otimizada para localhost
- ✅ **React Query**: Cache inteligente e gerenciamento de estado
- ✅ **TypeScript**: Suporte completo sem configurações extras
- ✅ **Debugging**: Logs claros e simples

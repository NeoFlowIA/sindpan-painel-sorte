# 🔐 Sistema de Autenticação com Roles

## ✅ **Implementação Completa**

O sistema de autenticação foi implementado com controle de acesso baseado em roles, integrando as APIs SINDPAN e Hasura.

### 🏗️ **Arquitetura**

```
┌─────────────────┐    ┌─────────────────┐
│   SINDPAN API   │    │   HASURA API    │
│                 │    │                 │
│ • Autenticação  │    │ • Dados User    │
│ • JWT Tokens    │    │ • Role (admin)  │
│ • User Profile  │    │ • Role (bakery) │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────┬───────────────┘
                 │
         ┌─────────────────┐
         │  AuthContext    │
         │                 │
         │ • Combina dados │
         │ • Gerencia roles│
         │ • Controla acesso│
         └─────────────────┘
```

### 📋 **Schema da Tabela Users**

```graphql
type Users {
  id: String!
  email: String!
  bakery_name: String!
  role: String!  # "admin" | "bakery"
  created_at: String!
  password_hash: String!
}
```

### 🔄 **Fluxo de Autenticação**

#### 1. **Login**
```
1. Usuário insere email/senha
2. Sistema autentica via SINDPAN API
3. Recebe dados básicos + JWT token
4. Busca dados completos na tabela users (Hasura)
5. Combina dados SINDPAN + Hasura
6. Redireciona baseado na role:
   - admin → Dashboard Administrativo (/)
   - bakery → Portal da Padaria (/padaria/dashboard)
```

#### 2. **Verificação de Acesso**
```
1. ProtectedRoute verifica autenticação
2. Verifica se user tem role necessária
3. Permite acesso ou redireciona
```

### 🛡️ **Componentes de Proteção**

#### `<AdminRoute>`
- Acesso apenas para `role: "admin"`
- Redireciona bakery para `/padaria/dashboard`

#### `<BakeryRoute>`
- Acesso apenas para `role: "bakery"`
- Redireciona admin para `/`

#### `<ProtectedRoute>`
- Componente genérico para proteção
- Suporta roles específicas ou qualquer usuário autenticado

### 📁 **Arquivos Implementados**

#### 1. **`src/hooks/useUsers.ts`** *(novo)*
```typescript
- useUserByEmail() // Busca user por email no Hasura
- useUsers()       // Lista todos os usuários (admin only)
```

#### 2. **`src/contexts/AuthContext.tsx`** *(atualizado)*
```typescript
interface AuthContextType {
  user: User | null;           // Dados combinados
  sindpanUser: SindpanUser;    // Dados do SINDPAN
  isAuthenticated: boolean;
  isAdmin: boolean;            // Shortcut para role
  isBakery: boolean;           // Shortcut para role
  // ... outros métodos
}
```

#### 3. **`src/pages/Login.tsx`** *(novo)*
- Página de login unificada
- Redireciona automaticamente baseado na role
- Design responsivo e moderno

#### 4. **`src/components/ProtectedRoute.tsx`** *(novo)*
- Sistema de proteção de rotas
- Verificação de roles
- Loading states

#### 5. **`src/App.tsx`** *(atualizado)*
- Rotas protegidas por role
- Roteamento baseado em permissões

### 🎯 **Rotas e Permissões**

#### **Públicas**
- `/login` - Página de login unificada

#### **Admin Only** (`role: "admin"`)
- `/` - Dashboard principal
- `/padarias` - Gestão de padarias
- `/participantes` - Gestão de participantes
- `/sorteios` - Gestão de sorteios
- `/relatorios` - Relatórios
- `/configuracoes` - Configurações

#### **Bakery Only** (`role: "bakery"`)
- `/padaria/dashboard` - Dashboard da padaria
- `/padaria/sorteio` - Sorteios da padaria

#### **Legado** *(ainda funcionais)*
- `/padaria/login` - Login específico da padaria
- `/padaria/cadastro` - Cadastro de padaria

### 🔧 **Como Usar**

#### No Componente
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAdmin, isBakery, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <LoginPrompt />;
  
  return (
    <div>
      <h1>Olá, {user?.bakery_name}!</h1>
      {isAdmin && <AdminPanel />}
      {isBakery && <BakeryPanel />}
    </div>
  );
}
```

#### Proteção de Rotas
```typescript
// Rota apenas para admin
<Route path="/admin" element={
  <AdminRoute>
    <AdminPanel />
  </AdminRoute>
} />

// Rota apenas para padaria
<Route path="/bakery" element={
  <BakeryRoute>
    <BakeryPanel />
  </BakeryRoute>
} />
```

### 🎨 **UX/UI**

#### **Página de Login**
- ✅ Design moderno com gradiente
- ✅ Logo SINDPAN
- ✅ Campo de senha com toggle de visibilidade
- ✅ Loading states
- ✅ Mensagens de erro claras
- ✅ Informações sobre redirecionamento

#### **Loading States**
- ✅ Verificação de autenticação
- ✅ Carregamento de dados do usuário
- ✅ Verificação de permissões

### 📊 **Dados Integrados**

O sistema combina dados de duas fontes:

#### **SINDPAN API**
```typescript
{
  id: string;
  email: string;
  bakery_name: string;
}
```

#### **Hasura Users**
```typescript
{
  id: string;
  email: string;
  bakery_name: string;
  role: 'admin' | 'bakery';
  created_at: string;
}
```

#### **Resultado Final**
```typescript
{
  id: string;           // SINDPAN
  email: string;        // SINDPAN
  bakery_name: string;  // SINDPAN
  role: 'admin' | 'bakery'; // Hasura
  created_at: string;   // Hasura
}
```

### 🚀 **Como Testar**

1. **Acesse**: `http://localhost:8080`
2. **Será redirecionado**: Para `/login`
3. **Faça login**: Com credenciais válidas
4. **Será redirecionado**: Baseado na role:
   - Admin → Dashboard principal
   - Bakery → Portal da padaria

### 🔍 **Debugging**

Para verificar o sistema:
```typescript
// No console do navegador
console.log('User:', user);
console.log('Is Admin:', isAdmin);
console.log('Is Bakery:', isBakery);
```

### 🎉 **Status Final**

**✅ SISTEMA DE AUTENTICAÇÃO COMPLETO!**

- ✅ Login unificado
- ✅ Roteamento baseado em roles
- ✅ Proteção de rotas
- ✅ Integração SINDPAN + Hasura
- ✅ UX/UI moderno
- ✅ Loading states
- ✅ Error handling

**O sistema está pronto para produção!**


# 📋 Separação de Responsabilidades - Tabelas

## 🎯 **Conceito Implementado**

O sistema agora separa corretamente as responsabilidades entre as tabelas `padarias` e `users`.

### 📊 **Estrutura das Tabelas**

#### **Tabela `padarias`**
```graphql
type Padarias {
  cnpj: String!        # Chave primária
  nome: String!        # Nome da padaria
  email: String        # Email de contato
  endereco: String     # Endereço físico
  telefone: String     # Telefone de contato
  ticket_medio: Float  # Ticket médio de vendas
  status: String       # ativo, pendente, inativo
  status_pagamento: String # pago, em_aberto, atrasado
}
```

#### **Tabela `users`**
```graphql
type Users {
  id: String!          # Chave primária
  email: String!       # Email para login
  password_hash: String! # Senha hasheada
  bakery_name: String! # Nome da padaria (referência)
  role: String!        # admin, bakery
  created_at: String   # Data de criação
}
```

### 🔄 **Fluxos de Criação**

#### **1. Admin Cria Padaria** (Dashboard Administrativo)
```
📍 Local: /padarias (Dashboard Admin)
👤 Quem: Usuário com role "admin"
📋 Ação: Adicionar nova padaria ao sistema

Fluxo:
1. Admin preenche dados da padaria
2. Sistema salva APENAS na tabela `padarias`
3. Padaria fica disponível no sistema
4. Padaria pode se cadastrar depois para ter acesso

Tabelas afetadas:
✅ padarias (nova entrada)
❌ users (não criado)
```

#### **2. Padaria Se Cadastra** (Portal de Cadastro)
```
📍 Local: /padaria/cadastro
👤 Quem: Representante da padaria
📋 Ação: Criar conta de acesso

Fluxo:
1. Padaria preenche dados de login
2. Sistema cria entrada na tabela `users`
3. Sistema pode atualizar dados na tabela `padarias`
4. Padaria ganha acesso ao portal

Tabelas afetadas:
✅ users (nova entrada com password_hash)
✅ padarias (pode ser atualizada se já existir)
```

### 🏪 **Modal Admin - Criar Padaria**

#### **Campos do Formulário**
- ✅ **Nome** (obrigatório)
- ✅ **CNPJ** (obrigatório)
- ✅ **Endereço** (obrigatório)
- ✅ **Email** (opcional)
- ✅ **Telefone** (opcional)
- ✅ **Ticket Médio** (opcional)
- ✅ **Status** (ativo, pendente, inativo)
- ✅ **Status Pagamento** (pago, em_aberto, atrasado)
- ✅ **Observações** (opcional)

#### **O que NÃO tem mais**
- ❌ Campo de senha
- ❌ Criação na tabela users
- ❌ Integração com SINDPAN API
- ❌ Campos de notificação

### 🔐 **Portal de Cadastro da Padaria**

#### **Responsabilidade**
- Criar entrada na tabela `users` com `password_hash`
- Permitir que a padaria tenha acesso ao sistema
- Vincular com dados existentes na tabela `padarias`

#### **Campos Necessários**
- Email (para login)
- Senha (será hasheada)
- Nome da padaria (para vincular)
- Role automática: "bakery"

### 🎯 **Benefícios da Separação**

#### **Para Admins**
- ✅ Cadastro rápido de padarias
- ✅ Foco nos dados operacionais
- ✅ Não precisa gerenciar senhas
- ✅ Controle total sobre status

#### **Para Padarias**
- ✅ Controle sobre suas credenciais
- ✅ Processo de cadastro próprio
- ✅ Segurança das senhas
- ✅ Autonomia para criar conta

### 📋 **Mutations Atualizadas**

#### **Admin - Criar Padaria**
```graphql
mutation CreatePadaria($padaria: padarias_insert_input!) {
  insert_padarias_one(object: $padaria) {
    cnpj
    email
    endereco
    nome
    status
    status_pagamento
    telefone
    ticket_medio
  }
}
```

#### **Padaria - Auto Cadastro** *(a ser implementado)*
```graphql
mutation CreateUser($user: users_insert_input!) {
  insert_users_one(object: $user) {
    id
    email
    bakery_name
    role
    created_at
  }
}
```

### 🔄 **Fluxo Completo**

```
1. 👨‍💼 Admin cria padaria → Tabela `padarias`
2. 📧 Admin informa padaria sobre o sistema
3. 🏪 Padaria acessa portal de cadastro
4. 🔐 Padaria cria conta → Tabela `users`
5. 🎯 Padaria faz login e acessa dashboard
```

### 🎉 **Status Atual**

- ✅ **Modal Admin**: Atualizado para criar apenas padarias
- ✅ **Validação**: Campos corretos e obrigatórios
- ✅ **Mutation**: Direcionada para tabela padarias
- ✅ **UX**: Mensagens claras sobre próximos passos
- ✅ **Separação**: Responsabilidades bem definidas

### 📝 **Próximos Passos**

1. **Testar**: Criação de padaria pelo admin
2. **Verificar**: Se dados aparecem na tabela padarias
3. **Implementar**: Portal de auto-cadastro da padaria (se necessário)

**🎉 Agora o sistema está correto: admins criam padarias, padarias criam suas próprias contas!**


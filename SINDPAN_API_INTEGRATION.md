# Integração API SINDPAN Auth

## Visão Geral

Este projeto foi integrado com a API de autenticação do SINDPAN para fornecer um sistema de login seguro e gerenciamento de padarias. A integração utiliza JWT (JSON Web Tokens) para autenticação e autorização.

## Base URL da API

```
https://neotalks-sindpan-auth.t2wird.easypanel.host
```

## Endpoints Utilizados

### 1. Health Check
```
GET /health
```
Verifica se a API está funcionando.

**Resposta:**
```json
{
  "ok": true
}
```

### 2. Cadastro de Padaria
```
POST /auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "padaria@exemplo.com",
  "password": "senha123",
  "bakery_name": "Padaria Pão Quente"
}
```

**Resposta (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "padaria@exemplo.com",
    "role": "bakery",
    "bakery_name": "Padaria Pão Quente"
  },
  "accessToken": "jwt.aqui"
}
```

**Erros possíveis:**
- `400`: Email, senha e nome da padaria são obrigatórios
- `409`: Email já está cadastrado

### 3. Login
```
POST /auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "role": "bakery",
    "bakery_name": "Padaria Pão Quente"
  },
  "accessToken": "jwt.aqui"
}
```

### 4. Perfil do Usuário Autenticado
```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Resposta (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "role": "bakery",
    "bakery_name": "Padaria Pão Quente",
    "created_at": "2025-08-27T14:00:00.000Z"
  }
}
```

## Como Funciona no Sistema

### Autenticação

1. **Login**: Usuários fazem login com email e senha
2. **JWT Token**: A API retorna um token JWT que é armazenado no localStorage
3. **Autorização**: O token é enviado em todas as requisições autenticadas
4. **Expiração**: Tokens expiram conforme configurado na API (padrão: 15m)

### Roles (Papéis)

- **bakery**: Usuário de padaria - acesso ao portal da padaria
- **admin**: Administrador - acesso ao painel administrativo

### Proteção de Rotas

O sistema implementa proteção de rotas baseada em:
- **Autenticação**: Verifica se o usuário está logado
- **Autorização**: Verifica se o usuário tem a role correta para a página

### Fluxo de Registro

1. Administradores podem cadastrar novas padarias através do modal "Nova Padaria"
2. Padarias podem se auto-cadastrar através da página de registro
3. Credenciais são validadas pela API SINDPAN
4. Após registro bem-sucedido, o usuário é automaticamente logado

## Arquivos da Integração

### Serviço da API
- `src/services/sindpanAuthApi.ts`: Cliente da API com todos os endpoints

### Contexto de Autenticação
- `src/contexts/AuthContext.tsx`: Gerenciamento global do estado de autenticação

### Componentes
- `src/pages/padaria/Login.tsx`: Página de login atualizada
- `src/pages/padaria/Register.tsx`: Nova página de cadastro
- `src/components/padaria/PadariaLayout.tsx`: Layout com proteção de rotas
- `src/components/padaria/CriarPadariaModal.tsx`: Modal de cadastro para admins
- `src/components/ApiHealthCheck.tsx`: Verificação de status da API
- `src/components/ApiIntegrationInfo.tsx`: Informações sobre a integração

## Funcionalidades Implementadas

### ✅ Autenticação JWT
- Login seguro com email/senha
- Tokens armazenados no localStorage
- Verificação automática de expiração

### ✅ Cadastro de Padarias
- Interface para administradores
- Auto-cadastro para padarias
- Validação em tempo real

### ✅ Proteção de Rotas
- Redirecionamento automático baseado em role
- Verificação de autenticação em todas as rotas protegidas

### ✅ Gerenciamento de Estado
- Contexto global de autenticação
- Sincronização automática com a API
- Tratamento de erros

### ✅ Interface de Usuário
- Componente de status da API
- Informações sobre a integração
- Feedback visual para operações

## Configuração

### Variáveis de Ambiente
Não são necessárias configurações adicionais. A URL da API está definida diretamente no código.

### Dependências
Todas as dependências necessárias já estão incluídas no `package.json`.

## Testando a Integração

### 1. Verificar Status da API
Vá para **Configurações** no painel administrativo e verifique o status da conexão.

### 2. Teste de Cadastro
1. No painel administrativo, vá para **Padarias**
2. Clique em "Nova Padaria"
3. Preencha os dados obrigatórios (nome, email, senha)
4. Teste o cadastro

### 3. Teste de Login
1. Vá para `/padaria/login`
2. Use as credenciais cadastradas
3. Verifique se o login funciona corretamente

### 4. Teste de Auto-Cadastro
1. Vá para `/padaria/cadastro`
2. Preencha o formulário
3. Teste se a padaria consegue se registrar

## Troubleshooting

### Erro de Conexão
- Verificar se a API está online no health check
- Verificar conectividade de rede
- Consultar logs do navegador

### Erro de Autenticação
- Verificar se as credenciais estão corretas
- Limpar localStorage se necessário
- Verificar se o token não expirou

### Problemas de CORS
Se houver problemas de CORS, a API precisa ser configurada para aceitar requisições do domínio da aplicação.

## Próximos Passos

Para melhorar a integração, considere:

1. **Refresh Tokens**: Implementar renovação automática de tokens
2. **Caching**: Cache de dados do usuário para melhor performance
3. **Logs**: Sistema de logs mais detalhado para debugging
4. **Validação**: Validações mais robustas nos formulários
5. **Notificações**: Sistema de notificações em tempo real

## Suporte

Para dúvidas sobre a integração, consulte:
- Este documento
- Logs do navegador (F12 → Console)
- Status da API na página de configurações

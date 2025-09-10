// Queries GraphQL como strings simples

// Query básica para testar a conexão
export const TEST_CONNECTION = `
  query TestConnection {
    __typename
  }
`;

// Query para descobrir tabelas disponíveis
export const DISCOVER_SCHEMA = `
  query DiscoverSchema {
    __schema {
      types {
        name
        kind
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
`;

// Query para buscar informações do schema (útil para debug)
export const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
      }
      mutationType {
        name
      }
      subscriptionType {
        name
      }
    }
  }
`;

// Aqui você pode adicionar suas queries específicas conforme as tabelas
// Exemplo de estrutura para queries futuras:

// export const GET_USERS = `
//   query GetUsers {
//     users {
//       id
//       name
//       email
//     }
//   }
// `;

// export const CREATE_USER = `
//   mutation CreateUser($input: UserInput!) {
//     createUser(input: $input) {
//       id
//       name
//       email
//     }
//   }
// `;

// Queries para dashboard (exemplo)
export const GET_DASHBOARD_STATS = `
  query GetDashboardStats {
    padarias: padarias_aggregate {
      aggregate {
        count
      }
    }
    cupons: cupons_aggregate {
      aggregate {
        count
      }
    }
    participantes: participantes_aggregate {
      aggregate {
        count
      }
    }
  }
`;

// Query para listar padarias (baseada no schema real)
export const GET_PADARIAS = `
  query GetPadarias {
    padarias {
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
`;

// Query para estatísticas das padarias
export const GET_PADARIAS_STATS = `
  query GetPadariasStats {
    padarias_aggregate {
      aggregate {
        count
      }
    }
    padarias_ativas: padarias_aggregate(where: {status: {_eq: "ativa"}}) {
      aggregate {
        count
      }
    }
    padarias_pendentes: padarias_aggregate(where: {status: {_eq: "pendente"}}) {
      aggregate {
        count
      }
    }
    ticket_medio: padarias_aggregate {
      aggregate {
        avg {
          ticket_medio
        }
      }
    }
  }
`;

// Mutation para criar nova padaria
export const CREATE_PADARIA = `
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
`;

// Mutation para atualizar padaria
export const UPDATE_PADARIA = `
  mutation UpdatePadaria($cnpj: String!, $changes: padarias_set_input!) {
    update_padarias(where: {cnpj: {_eq: $cnpj}}, _set: $changes) {
      returning {
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
  }
`;

// Mutation para deletar padaria
export const DELETE_PADARIA = `
  mutation DeletePadaria($cnpj: String!) {
    delete_padarias(where: {cnpj: {_eq: $cnpj}}) {
      returning {
        cnpj
        nome
      }
    }
  }
`;


// Query para buscar dados do usuário por email ou CNPJ
export const GET_USER = `
  query GetUser($email: String, $cnpj: String) {
    users(where: {_or: [{email: {_eq: $email}}, {cnpj: {_eq: $cnpj}}]}) {
      id
      email
      cnpj
      bakery_name
      role
      padarias_id
      cnpj
    }
  }
`;

// Query para quando o campo padarias_id for criado no Hasura
export const GET_USER_BY_EMAIL_WITH_PADARIA = `
  query GetUserByEmailWithPadaria($email: String!) {
    users(where: {email: {_eq: $email}}) {
      id
      email
      bakery_name
      role
      padarias_id
      cnpj
    }
  }
`;

// Query para listar todos os usuários (admin only)
export const GET_USERS = `
  query GetUsers {
    users {
      id
      email
      cnpj
      bakery_name
      role
      padarias_id
      cnpj
    }
  }
`;

// Query para listar participantes
export const GET_PARTICIPANTES = `
  query GetParticipantes($limit: Int, $offset: Int) {
    participantes(limit: $limit, offset: $offset, order_by: {created_at: desc}) {
      id
      nome
      email
      telefone
      cpf
      created_at
      cupons_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const GET_NEXT_SORTEIO = `
  query GetNextSorteio {
    sorteios(
      where: {data_sorteio: {_gt: "now()"}},
      order_by: {data_sorteio: asc},
      limit: 1
    ) {
      id
      data_sorteio
    }
  }
`;

export const SCHEDULE_SORTEIO = `
  mutation ScheduleSorteio($id: uuid!, $data: timestamptz!) {
    insert_sorteios_one(object: {id: $id, data_sorteio: $data}) {
      id
      data_sorteio
    }
  }
`;

export const UPDATE_SORTEIO = `
  mutation UpdateSorteio($id: uuid!, $data: timestamptz!) {
    update_sorteios_by_pk(pk_columns: {id: $id}, _set: {data_sorteio: $data}) {
      id
      data_sorteio
    }
  }
`;

// Query para buscar padaria pelo nome (tabela correta: padarias)
export const GET_PADARIA_BY_NAME = `
  query GetPadariaByName($nome: String!) {
    padarias(where: {nome: {_eq: $nome}}, limit: 1) {
      id
      cnpj
      nome
      endereco
      telefone
      email
      status
      status_pagamento
      ticket_medio
    }
  }
`;

// ===== QUERIES PARA CLIENTES =====

// Query de teste para verificar conectividade
export const TEST_HASURA_CONNECTION = `
  query TestConnection {
    __typename
  }
`;

// Query simplificada para testar a estrutura das tabelas
export const GET_CLIENTES_SIMPLE = `
  query GetClientesSimple {
    clientes {
      id
      nome
      cpf
      whatsapp
      padaria_id
    }
  }
`;

// Query para listar todas as padarias (tabela correta: padarias)
export const GET_ALL_PADARIAS_SIMPLE = `
  query GetAllPadariasSimple {
    padarias {
      id
      nome
      cnpj
    }
  }
`;

// Query para buscar padaria por nome com busca flexível
export const GET_PADARIA_BY_NAME_FLEXIBLE = `
  query GetPadariaByNameFlexible($nome: String!) {
    padarias(where: {nome: {_ilike: $nome}}, limit: 5) {
      id
      cnpj
      nome
      endereco
      telefone
      email
      status
      status_pagamento
      ticket_medio
    }
  }
`;

// Query para criar uma nova padaria se não existir
export const CREATE_PADARIA_IF_NOT_EXISTS = `
  mutation CreatePadariaIfNotExists($nome: String!) {
    insert_padarias(
      objects: {nome: $nome, status: "ativa"}
      on_conflict: {constraint: padarias_nome_key, update_columns: []}
    ) {
      returning {
        id
        nome
      }
    }
  }
`;

// Query para buscar clientes com cupons baseada na estrutura real do Hasura
// Query para buscar clientes filtrando pelo id da padaria
export const GET_CLIENTES = `
  query GetClientes($padaria_id: uuid!, $limit: Int, $offset: Int) {
    clientes(
      where: {padaria_id: {_eq: $padaria_id}}, 
      limit: $limit, 
      offset: $offset,
      order_by: {id: desc}
    ) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
      
    }
    clientes_aggregate(where: {padaria_id: {_eq: $padaria_id}}) {
      aggregate {
        count
      }
    }
  }
`;

// Query simplificada para todos os clientes (tabela correta: clientes)
export const GET_ALL_CLIENTES_WITH_CUPONS = `
  query GetAllClientesWithCupons {
    clientes {
      id
      nome
      cpf
      padaria_id
      whatsapp
      resposta_pergunta
      cupons {
        cliente_id
        data_compra
        id
      }
    }
  }
`;

// Query para buscar um cliente específico
export const GET_CLIENTE_BY_ID = `
  query GetClienteById($id: Int!) {
    clientes_by_pk(id: $id) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
      created_at
      cupons_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// Mutation para criar novo cliente (com ID manual)
export const CREATE_CLIENTE = `
  mutation CreateCliente($cliente: clientes_insert_input!) {
    insert_clientes_one(object: $cliente) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
    }
  }
`;

// Mutation de teste mais simples (sem retornar id)
export const CREATE_CLIENTE_SIMPLE = `
  mutation CreateClienteSimple($nome: String!, $cpf: String!, $padaria_id: uuid!) {
    insert_clientes_one(object: {
      nome: $nome,
      cpf: $cpf,
      padaria_id: $padaria_id
    }) {
      nome
      cpf
      padaria_id
    }
  }
`;

// Mutation alternativa usando insert múltiplo
export const CREATE_CLIENTE_BULK = `
  mutation CreateClienteBulk($cliente: [clientes_insert_input!]!) {
    insert_clientes(objects: $cliente) {
      returning {
        nome
        cpf
        padaria_id
      }
    }
  }
`;

// Query para obter o próximo ID disponível
export const GET_NEXT_CLIENTE_ID = `
  query GetNextClienteId {
    clientes_aggregate {
      aggregate {
        max {
          id
        }
      }
    }
  }
`;

// Mutation de teste ultra simples (apenas nome)
export const CREATE_CLIENTE_TEST = `
  mutation CreateClienteTest($nome: String!) {
    insert_clientes_one(object: {
      nome: $nome
    }) {
      nome
    }
  }
`;

// Query para buscar cliente por CPF
export const GET_CLIENTE_BY_CPF = `
  query GetClienteByCpf($cpf: String!) {
    clientes(where: {cpf: {_eq: $cpf}}) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
      padaria {
        id
        nome
      }
    }
  }
`;

// Query para buscar cliente por WhatsApp
export const GET_CLIENTE_BY_WHATSAPP = `
  query GetClienteByWhatsapp($whatsapp: String!) {
    clientes(where: {whatsapp: {_eq: $whatsapp}}) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
      padaria {
        id
        nome
      }
    }
  }
`;

// Query para buscar cliente por CPF ou WhatsApp
export const GET_CLIENTE_BY_CPF_OR_WHATSAPP = `
  query GetClienteByCpfOrWhatsapp($cpf: String, $whatsapp: String) {
    clientes(where: {_or: [{cpf: {_eq: $cpf}}, {whatsapp: {_eq: $whatsapp}}]}) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
      padaria {
        id
        nome
      }
    }
  }
`;

// Mutation para atualizar cliente
export const UPDATE_CLIENTE = `
  mutation UpdateCliente($id: Int!, $changes: clientes_set_input!) {
    update_clientes_by_pk(pk_columns: {id: $id}, _set: $changes) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
      
    }
  }
`;

// Mutation para deletar cliente
export const DELETE_CLIENTE = `
  mutation DeleteCliente($id: Int!) {
    delete_clientes_by_pk(id: $id) {
      id
      nome
    }
  }
`;
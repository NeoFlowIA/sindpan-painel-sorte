// Queries GraphQL como strings simples

// Query básica para testar a conexão
export const TEST_CONNECTION = `
  query TestConnection {
    __typename
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
      created_at
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
      created_at
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
// Queries e mutations para cadastro de cupons e clientes
export const GET_PADARIA_TICKET_MEDIO = `
  query GetPadariaTicketMedio($id: uuid!) {
    padarias_by_pk(id: $id) {
      id
      ticket_medio
    }
  }
`;

export const GET_CLIENTE = `
  query GetCliente($padariaId: uuid!, $cpf: String, $whatsapp: String) {
    clientes(where: {
      padaria_id: {_eq: $padariaId},
      _or: [{cpf: {_eq: $cpf}}, {whatsapp: {_eq: $whatsapp}}]
    }) {
      id
      nome
      cpf
      whatsapp
      clientes_padarias_saldos(where: {padaria_id: {_eq: $padariaId}}) {
        saldo_centavos
      }
    }
  }
`;

export const CREATE_CLIENTE = `
  mutation CreateCliente($cliente: clientes_insert_input!) {
    insert_clientes_one(object: $cliente) {
      id
      nome
      cpf
      whatsapp
    }
  }
`;

export const CADASTRAR_CUPOM = `
  mutation CadastrarCupom(
    $compra: compras_insert_input!,
    $cupons: [cupons_insert_input!]!,
    $saldo: clientes_padarias_saldos_insert_input!
  ) {
    insert_compras_one(object: $compra) { id }
    insert_cupons(objects: $cupons) { affected_rows }
    insert_clientes_padarias_saldos_one(
      object: $saldo,
      on_conflict: {
        constraint: clientes_padarias_saldos_cliente_id_padaria_id_key,
        update_columns: saldo_centavos
      }
    ) {
      saldo_centavos
    }
  }
`;

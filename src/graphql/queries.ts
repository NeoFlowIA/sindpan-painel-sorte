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
    padarias {
      id
    }
    cupons {
      id
    }
    participantes {
      id
    }
  }
`;

// Query para listar padarias (baseada no schema real)
export const GET_PADARIAS = `
  query GetPadarias {
    padarias {
      id
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

// Query para ranking de padarias (leaderboard)
export const GET_PADARIAS_RANKING = `
  query GetPadariasRanking {
    padarias(
      limit: 10,
      order_by: {cupons_aggregate: {count: desc}}
    ) {
      id
      nome
      status
      cupons_aggregate {
        aggregate {
          count
        }
      }
      cupons(order_by: {data_compra: desc}, limit: 1) {
        numero_sorte
        data_compra
      }
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
      password_hash
      padarias {
        id
        nome
      }
    }
  }
`;

export const GET_USER_BY_CNPJ_WITH_PADARIA = `
  query GetUserByCnpjWithPadaria($cnpj: String!) {
    users(where: {cnpj: {_eq: $cnpj}}) {
      id
      email
      bakery_name
      role
      padarias_id
      cnpj
      password_hash
      padarias {
        id
        nome
      }
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
      password_hash
      padarias {
        id
        nome
      }
    }
  }
`;

export const GET_PADARIA_BY_CNPJ = `
  query GetPadariaByCnpj($cnpj: String!) {
    padarias(where: {cnpj: {_eq: $cnpj}}, limit: 1) {
      id
      nome
      cnpj
      status
    }
  }
`;

export const UPSERT_PADARIA_USER = `
  mutation UpsertPadariaUser(
    $cnpj: String!
    $padarias_id: uuid!
    $password_hash: String!
    $bakery_name: String!
  ) {
    insert_users_one(
      object: {
        cnpj: $cnpj
        padarias_id: $padarias_id
        role: "bakery"
        password_hash: $password_hash
        bakery_name: $bakery_name
      }
      on_conflict: {
        constraint: users_cnpj_key
        update_columns: [padarias_id, password_hash, role, bakery_name]
      }
    ) {
      id
      email
      cnpj
      bakery_name
      role
      padarias_id
      password_hash
    }
  }
`;

// Query para listar participantes
export const GET_PARTICIPANTES = `
  query GetParticipantes($limit: Int, $offset: Int) {
    cliente(limit: $limit, offset: $offset) {
      id
      nome
      
      whatsapp
      cpf
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
      campanha_id
      campanha {
        id
        Nome
      }
    }
  }
`;

export const SCHEDULE_SORTEIO = `
  mutation ScheduleSorteio($id: uuid!, $data: timestamptz!, $campanhaId: Int!) {
    insert_sorteios_one(object: {id: $id, data_sorteio: $data, campanha_id: $campanhaId}) {
      id
      data_sorteio
      campanha_id
    }
  }
`;

export const UPDATE_SORTEIO = `
  mutation UpdateSorteio($id: uuid!, $data: timestamptz!, $campanhaId: Int!) {
    update_sorteios_by_pk(pk_columns: {id: $id}, _set: {data_sorteio: $data, campanha_id: $campanhaId}) {
      id
      data_sorteio
      campanha_id
    }
  }
`;

export const LIST_CAMPANHAS = `
  query ListCampanhas {
    campanha(order_by: {data_inicio: desc}) {
      id
      Nome
      data_inicio
      data_fim
      ativo
    }
  }
`;

// Query para buscar a campanha ativa atual (somente campanhas com ativo = true E dentro do período)
export const GET_CAMPANHA_ATIVA = `
  query GetCampanhaAtiva($hoje: timestamptz!) {
    campanha(
      where: {
        ativo: {_eq: true},
        data_inicio: {_lte: $hoje},
        data_fim: {_gte: $hoje}
      },
      order_by: {data_inicio: desc},
      limit: 1
    ) {
      id
      Nome
      data_inicio
      data_fim
      ativo
    }
  }
`;

// Query para buscar o próximo sorteio agendado
export const GET_PROXIMO_SORTEIO_AGENDADO = `
  query GetProximoSorteioAgendado {
    sorteios(
      where: {
        data_sorteio: {_gte: "now()"}
      },
      order_by: {data_sorteio: asc},
      limit: 1
    ) {
      id
      data_sorteio
      campanha_id
      campanha {
        id
        Nome
      }
    }
  }
`;

export const CREATE_CAMPANHA = `
  mutation CreateCampanha($obj: campanha_insert_input!) {
    insert_campanha_one(object: $obj) {
      id
    }
  }
`;

export const UPDATE_CAMPANHA = `
  mutation UpdateCampanha($id: Int!, $set: campanha_set_input!) {
    update_campanha_by_pk(pk_columns: {id: $id}, _set: $set) {
      id
    }
  }
`;

export const DEACTIVATE_CAMPANHAS = `
  mutation DeactivateCampanhas($ids: [Int!]!) {
    update_campanha(where: {id: {_in: $ids}}, _set: {ativo: false}) {
      affected_rows
    }
  }
`;

// Mutation para desativar uma campanha específica
export const DEACTIVATE_CAMPANHA = `
  mutation DeactivateCampanha($id: Int!) {
    update_campanha_by_pk(pk_columns: {id: $id}, _set: {ativo: false}) {
      id
      Nome
      ativo
    }
  }
`;

// Mutation para ativar uma campanha específica
export const ACTIVATE_CAMPANHA = `
  mutation ActivateCampanha($id: Int!) {
    update_campanha_by_pk(pk_columns: {id: $id}, _set: {ativo: true}) {
      id
      Nome
      ativo
    }
  }
`;

// Mutation para excluir uma campanha (primeiro remove sorteios e cupons relacionados)
export const DELETE_CAMPANHA = `
  mutation DeleteCampanha($id: Int!) {
    delete_sorteios: delete_sorteios(where: {campanha_id: {_eq: $id}}) {
      affected_rows
    }
    delete_cupons: delete_cupons(where: {campanha_id: {_eq: $id}}) {
      affected_rows
    }
    delete_campanha: delete_campanha_by_pk(id: $id) {
      id
      Nome
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
      padaria {
        id
        nome
      }
        cupons {
        cliente_id
        data_compra
        id
      }
      
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

// Query para buscar um cliente específico - SIMPLIFICADA
export const GET_CLIENTE_BY_ID = `
  query GetClienteById($id: uuid!) {
    clientes_by_pk(id: $id) {
      id
      nome
      cpf
      whatsapp
      resposta_pergunta
      padaria_id
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
      cupons {
        id
        numero_sorte
        status
        padaria_id
        valor_compra
        valor_desconto
        data_compra
      }
    }
  }
`;

// Mutation para atualizar cliente
export const UPDATE_CLIENTE = `
  mutation UpdateCliente($id: uuid!, $changes: clientes_set_input!) {
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
  mutation DeleteCliente($id: uuid!) {
    delete_clientes_by_pk(id: $id) {
      id
      nome
    }
  }
`;

// ===== QUERIES E MUTATIONS PARA CUPONS =====

// Query para listar cupons de uma padaria
export const GET_CUPONS_BY_PADARIA = `
  query GetCuponsByPadaria($padaria_id: uuid!, $limit: Int, $offset: Int) {
    cupons(
      where: {padaria_id: {_eq: $padaria_id}}, 
      limit: $limit, 
      offset: $offset,
      order_by: {data_compra: desc}
    ) {
      id
      numero_sorte
      valor_compra
      data_compra
      status
      cliente_id
      padaria_id
      valor_desconto
      cliente {
        id
        nome
        cpf
        whatsapp
      }
    }
  }
`;

// Query para buscar cupons de um cliente específico
export const GET_CUPONS_BY_CLIENTE = `
  query GetCuponsByCliente($cliente_id: uuid!) {
    cupons(where: {cliente_id: {_eq: $cliente_id}}, order_by: {data_compra: desc}) {
      id
      numero_sorte
      valor_compra
      data_compra
      status
      cliente_id
      padaria_id
      valor_desconto
    }
  }
`;

// Mutation para criar novo cupom
export const CREATE_CUPOM = `
  mutation CreateCupom($cupom: cupons_insert_input!) {
    insert_cupons_one(object: $cupom) {
      id
      numero_sorte
      valor_compra
      data_compra
      status
      campanha_id
      sorteio_id
      cliente_id
      padaria_id
      valor_desconto
      cliente {
        id
        nome
        cpf
        whatsapp
      }
      campanha {
        id
        Nome
      }
      sorteio {
        id
        data_sorteio
      }
    }
  }
`;

// Mutation para atualizar status do cupom
export const UPDATE_CUPOM_STATUS = `
  mutation UpdateCupomStatus($id: uuid!, $status: String!) {
    update_cupons_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
      id
      numero_sorte
      status
    }
  }
`;

// Query para obter valor mínimo da padaria (ticket médio)
export const GET_PADARIA_TICKET_MEDIO = `
  query GetPadariaTicketMedio($padaria_id: uuid!) {
    padarias_by_pk(id: $padaria_id) {
      id
      ticket_medio
      nome
    }
  }
`;

// Mutation para zerar valor_desconto de todos os cupons ativos do cliente
// Removendo a mutation que não funciona
// Vamos usar uma abordagem diferente sem mexer no Hasura

// Query para métricas do dashboard - SIMPLIFICADA
export const GET_DASHBOARD_METRICS = `
  query GetDashboardMetrics($padaria_id: uuid!) {
    clientes(where: {padaria_id: {_eq: $padaria_id}}) {
      id
    }
    cupons(where: {padaria_id: {_eq: $padaria_id}}) {
      id
    }
    padarias_by_pk(id: $padaria_id) {
      ticket_medio
    }
  }
`;

// Query para top 5 clientes com mais cupons
export const GET_TOP_CLIENTES = `
  query GetTopClientes($padaria_id: uuid!) {
    clientes(
      where: {padaria_id: {_eq: $padaria_id}}
      limit: 50
    ) {
      id
      nome
      cpf
      cupons(
        where: {status: {_eq: "ativo"}}
        order_by: {data_compra: desc}
      ) {
        id
        data_compra
      }
    }
  }
`;

// Query para cupons recentes
export const GET_CUPONS_RECENTES = `
  query GetCuponsRecentes($padaria_id: uuid!) {
    cupons(
      where: {padaria_id: {_eq: $padaria_id}}
      order_by: {data_compra: desc}
      limit: 5
    ) {
      id
      numero_sorte
      valor_compra
      data_compra
      cliente {
        id
        nome
        cpf
      }
    }
  }
`;

// Query para estatísticas semanais - SIMPLIFICADA
export const GET_ESTATISTICAS_SEMANAIS = `
  query GetEstatisticasSemanais($padaria_id: uuid!) {
    clientes(
      where: {padaria_id: {_eq: $padaria_id}}
    ) {
      id
    }
    cupons(
      where: {padaria_id: {_eq: $padaria_id}}
    ) {
      id
      data_compra
    }
  }
`;

// Query para cupons por dia da semana - SIMPLIFICADA
export const GET_CUPONS_POR_DIA_SEMANA = `
  query GetCuponsPorDiaSemana($padaria_id: uuid!) {
    cupons(
      where: {padaria_id: {_eq: $padaria_id}}
    ) {
      data_compra
    }
  }
`;

// Query para evolução diária de cupons - SIMPLIFICADA
export const GET_EVOLUCAO_DIARIA_CUPONS = `
  query GetEvolucaoDiariaCupons($padaria_id: uuid!) {
    cupons(
      where: {padaria_id: {_eq: $padaria_id}}
    ) {
      data_compra
    }
  }
`;

// Query para obter saldo acumulado de desconto do cliente - SIMPLIFICADA
export const GET_CLIENTE_SALDO_DESCONTO = `
  query GetClienteSaldoDesconto($cliente_id: uuid!) {
    cupons(where: {cliente_id: {_eq: $cliente_id}, status: {_eq: "ativo"}}) {
      valor_desconto
    }
  }
`;

// Query alternativa para obter cupons do cliente e calcular saldo manualmente
export const GET_CUPONS_CLIENTE_SALDO = `
  query GetCuponsClienteSaldo($cliente_id: uuid!) {
    cupons(where: {cliente_id: {_eq: $cliente_id}, status: {_eq: "ativo"}}) {
      valor_desconto
    }
  }
`;

// Query para obter saldo de desconto do cliente em uma padaria específica
export const GET_CLIENTE_SALDO_POR_PADARIA = `
  query GetClienteSaldoPorPadaria($cliente_id: uuid!, $padaria_id: uuid!) {
    cupons(
      where: {
        cliente_id: {_eq: $cliente_id}, 
        padaria_id: {_eq: $padaria_id},
        status: {_eq: "ativo"}
      },
      order_by: {data_compra: desc},
      limit: 1
    ) {
      id
      valor_desconto
    }
  }
`;

// Mutation para zerar saldo de cupons anteriores (antes de criar novos)
export const ZERAR_SALDO_CUPONS_ANTERIORES = `
  mutation ZerarSaldoCuponsAnteriores($cliente_id: uuid!, $padaria_id: uuid!) {
    update_cupons(
      where: {
        cliente_id: {_eq: $cliente_id},
        padaria_id: {_eq: $padaria_id},
        status: {_eq: "ativo"},
        valor_desconto: {_neq: "0"}
      },
      _set: {valor_desconto: "0"}
    ) {
      affected_rows
    }
  }
`;

// Query para buscar cupons disponíveis (sem cliente vinculado) - ordem aleatória
export const GET_CUPONS_DISPONIVEIS = `
  query GetCuponsDisponiveis {
    cupons(
      where: {
        status: {_eq: "disponivel"},
        cliente_id: {_is_null: true}
      },
      order_by: {id: asc}
    ) {
      id
      numero_sorte
      serie
      status
    }
  }
`;

// Query para buscar cupons disponíveis de uma padaria específica
export const GET_CUPONS_DISPONIVEIS_POR_PADARIA = `
  query GetCuponsDisponiveisPorPadaria($padaria_id: uuid!) {
    cupons(
      where: {
        status: {_eq: "disponivel"},
        cliente_id: {_is_null: true},
        padaria_id: {_eq: $padaria_id}
      },
      order_by: {id: asc}
    ) {
      id
      numero_sorte
      serie
      status
    }
  }
`;

// Mutation para vincular cupom disponível ao cliente
export const VINCULAR_CUPOM_AO_CLIENTE = `
  mutation VincularCupomAoCliente(
    $id: uuid!,
    $cliente_id: uuid!,
    $padaria_id: uuid!,
    $valor_compra: String!,
    $valor_desconto: String!,
    $data_compra: timestamptz!,
    $status: String!,
    $campanha_id: Int,
    $sorteio_id: uuid
  ) {
    update_cupons_by_pk(
      pk_columns: {id: $id},
      _set: {
        cliente_id: $cliente_id,
        padaria_id: $padaria_id,
        valor_compra: $valor_compra,
        valor_desconto: $valor_desconto,
        data_compra: $data_compra,
        status: $status,
        campanha_id: $campanha_id,
        sorteio_id: $sorteio_id
      }
    ) {
      id
      numero_sorte
      serie
      status
      cliente_id
      campanha_id
      valor_compra
      valor_desconto
    }
  }
`;

// ===== QUERIES E MUTATIONS PARA SORTEIO =====

// Query para obter todos os cupons de uma padaria para sorteio
export const GET_CUPONS_PARA_SORTEIO = `
  query GetCuponsParaSorteio($padaria_id: uuid!) {
    cupons(
      where: {
        padaria_id: {_eq: $padaria_id}
        status: {_eq: "ativo"}
      }
      order_by: {data_compra: desc}
    ) {
      id
      numero_sorte
      valor_compra
      data_compra
      cliente_id
      cliente {
        id
        nome
        cpf
        whatsapp
      }
    }
  }
`;

// Query para obter histórico de sorteios (simplificada)
export const GET_HISTORICO_SORTEIOS = `
  query GetHistoricoSorteios($padaria_id: uuid!) {
    sorteios(
      where: {
        tipo: {_eq: "padaria"}
        padaria_id: {_eq: $padaria_id}
      }
      order_by: {data_sorteio: desc}
    ) {
      id
      data_sorteio
      numero_sorteado
      ganhador_id
      tipo
      padaria_id
      cliente {
        id
        nome
        cpf
        whatsapp
      }
    }
  }
`;

// Mutation removida - não existe no Hasura
// Sistema de sorteio funcionará apenas no frontend

// Query para obter participantes do sorteio (simplificada)
export const GET_PARTICIPANTES_SORTEIO = `
  query GetParticipantesSorteio {
    clientes {
      id
      nome
      cpf
      whatsapp
    }
  }
`;

export const SALVAR_SORTEIO_PADARIA = `
  mutation SalvarSorteioPadaria(
    $numero_sorteado: String!,
    $ganhador_id: uuid!,
    $data_sorteio: timestamptz!,
    $padaria_id: uuid!
  ) {
    insert_sorteios_one(
      object: {
        numero_sorteado: $numero_sorteado,
        ganhador_id: $ganhador_id,
        data_sorteio: $data_sorteio,
        tipo: "padaria",
        padaria_id: $padaria_id
      },
      on_conflict: {
        constraint: sorteios_ganhador_id_key,
        update_columns: [numero_sorteado, data_sorteio, tipo, padaria_id]
      }
    ) {
      id
      numero_sorteado
      data_sorteio
      ganhador_id
      tipo
      padaria_id
      cliente {
        id
        nome
        cpf
        whatsapp
      }
    }
  }
`;

// Query para painel administrativo - todos os clientes com padarias e cupons
export const GET_ALL_CLIENTES_ADMIN = `
  query GetAllClientesAdmin($limit: Int, $offset: Int, $search: String, $padaria_id: uuid) {
    clientes(
      limit: $limit, 
      offset: $offset,
      order_by: {id: desc},
      where: {
        _and: [
          $padaria_id: {padaria_id: {_eq: $padaria_id}},
          {
            _or: [
              {nome: {_ilike: $search}},
              {cpf: {_ilike: $search}},
              {whatsapp: {_ilike: $search}},
              {padaria: {nome: {_ilike: $search}}}
            ]
          }
        ]
      }
    ) {
      id
      nome
      cpf
      whatsapp
      padaria_id
      padaria {
        id
        nome
      }
      cupons {
        id
        data_compra
        valor_compra
        numero_sorte
      }
    }
    clientes_aggregate(
      where: {
        _and: [
          $padaria_id: {padaria_id: {_eq: $padaria_id}},
          {
            _or: [
              {nome: {_ilike: $search}},
              {cpf: {_ilike: $search}},
              {whatsapp: {_ilike: $search}},
              {padaria: {nome: {_ilike: $search}}}
            ]
          }
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Query simplificada para painel administrativo - todos os clientes
export const GET_ALL_CLIENTES_ADMIN_SIMPLE = `
  query GetAllClientesAdminSimple {
    clientes(order_by: {id: desc}) {
      id
      nome
      cpf
      whatsapp
      padaria_id
      resposta_pergunta
      padaria {
        id
        nome
      }
      cupons {
        id
        data_compra
        valor_compra
        numero_sorte
        campanha_id
        status
        padaria_id
      }
    }
  }
`;

// Query para métricas do painel administrativo
export const GET_ADMIN_DASHBOARD_METRICS = `
  query GetAdminDashboardMetrics {
    clientes_aggregate {
      aggregate {
        count
      }
    }
    cupons_aggregate {
      aggregate {
        count
      }
    }
    cupons(order_by: {data_compra: desc}, limit: 100) {
      id
      data_compra
      valor_compra
      status
    }
    padarias_aggregate {
      aggregate {
        count
      }
    }
    sorteios_aggregate {
      aggregate {
        count
      }
    }
    proximo_sorteio: sorteios(
      where: {data_sorteio: {_gte: "now()"}}
      order_by: {data_sorteio: asc}
      limit: 1
    ) {
      id
      data_sorteio
      numero_sorteado
    }
  }
`;

// Query para buscar todos os clientes que possuem cupons ativos na campanha selecionada
export const GET_CLIENTES_WITH_ACTIVE_CUPONS_BY_CAMPANHA = `
  query GetClientesWithActiveCuponsByCampanha {
    clientes(
      where: {
        status: {_eq: "ativo"},
        campanha_id: {_eq: $campanhaId},
        valor_compra: {_neq: "0"},
        cliente: {
        
        }
      }
      order_by: {nome: asc}
    ) {
      id
      numero_sorte
      valor_compra
      data_compra
      status
      campanha_id
      padaria_id
      padaria {
        id
        nome
      }
      cliente {
        id
        nome
      }
      cupons_aggregate(where: {status: {_eq: "ativo"}}) {
        aggregate {
          count
        }
      }
      cupons(
        where: {status: {_eq: "ativo"}}
        order_by: {data_compra: desc}
      ) {
        id
        numero_sorte
        valor_compra
        data_compra
        status
        campanha_id
        padaria_id
      }
    }
  }
`;

// Query simples para buscar ganhadores salvos (valor_compra = "0")
export const GET_GANHADORES_SALVOS = `
  query GetGanhadoresSalvos {
    cupons(
      order_by: {id: desc}
    ) {
      id
      numero_sorte
      valor_compra
      data_compra
      status
      cliente {
        id
        nome
        cpf
        whatsapp
        resposta_pergunta
        padaria {
          id
          nome
        }
      }
    }
  }
`;

// Mutation para marcar TODOS os cupons de um cliente como sorteado
// Mutation para salvar ganhador
// Cria registro na tabela sorteios e marca cupons do cliente
// Esta mutation irá fazer upsert no sorteios ao invés de apenas insert, evitando o erro de unique constraint.
// Se já existe um sorteio com ganhador_id igual, atualiza o numero_sorteado e data_sorteio.
// Utiliza on_conflict na tabela sorteios (assumindo constraint sorteios_ganhador_id_key).

export const SALVAR_GANHADOR = `
  mutation SalvarGanhador(
    $numero_sorteado: String!,
    $data_sorteio: timestamptz!,
    $ganhador_id: uuid!,
    $cliente_id: uuid!,
    $campanha_id: Int!
  ) {
    sorteio: insert_sorteios_one(
      object: {
        numero_sorteado: $numero_sorteado,
        data_sorteio: $data_sorteio,
        ganhador_id: $ganhador_id,
        campanha_id: $campanha_id
      },
      on_conflict: {
        constraint: sorteios_ganhador_id_key,
        update_columns: [numero_sorteado, data_sorteio, campanha_id]
      }
    ) {
      id
      numero_sorteado
      data_sorteio
      ganhador_id
      campanha_id
      campanha {
        id
        Nome
      }
    }
    outros_cupons: update_cupons(
      where: {
        cliente_id: {_eq: $cliente_id}
        status: {_eq: "ativo"}
        campanha_id: {_eq: $campanha_id}
      }
      _set: {valor_compra: "0"}
    ) {
      affected_rows
    }
  }
`;

export const MARCAR_CUPOM_SORTEADO = `
  mutation MarcarCupomSorteado($cliente_id: uuid!) {
    update_cupons(
      where: {cliente_id: {_eq: $cliente_id}}
      _set: {valor_compra: "0"}
    ) {
      affected_rows
    }
  }
`;

// Mutation para remover cupons do cliente do sorteio
export const REMOVER_CUPONS_CLIENTE_DO_SORTEIO = `
  mutation RemoverCuponsCliente($cliente_id: uuid!) {
    update_cupons(
      where: {
        cliente_id: {_eq: $cliente_id}
        status: {_eq: "ativo"}
      }
      _set: {valor_compra: "0"}
    ) {
      affected_rows
    }
  }
`;

// Mutation para reativar cliente (deleta sorteio e restaura cupons)
export const REATIVAR_CUPOM = `
  mutation ReativarCupom($cliente_id: uuid!) {
    delete_sorteios(where: {ganhador_id: {_eq: $cliente_id}}) {
      affected_rows
    }
    update_cupons(
      where: {cliente_id: {_eq: $cliente_id}, valor_compra: {_eq: "0"}}
      _set: {valor_compra: "50"}
    ) {
      affected_rows
    }
  }
`;

// Query para buscar ganhadores salvos (da tabela sorteios)
// Query para buscar ganhadores (tabela sorteios com join em clientes)
export const GET_GANHADORES_COM_DADOS_COMPLETOS = `
  query GetGanhadoresCompletos {
    sorteios(order_by: {data_sorteio: desc}) {
      id
      numero_sorteado
      data_sorteio
      ganhador_id
      campanha_id
      cliente {
        id
        nome
        cpf
        whatsapp
        padaria {
          id
          nome
        }
      }
      campanha {
        id
        Nome
      }
    }
  }
`;

// Query para buscar clientes que devem ser anexados a uma padaria baseado na quantidade de cupons
export const GET_CLIENTES_PARA_ANEXAR_PADARIA = `
  query GetClientesParaAnexarPadaria($padaria_id: uuid!) {
    clientes(
      where: {
        _or: [
          {padaria_id: {_is_null: true}},
          {padaria_id: {_neq: $padaria_id}}
        ]
      }
    ) {
      id
      nome
      cpf
      whatsapp
      padaria_id
      padaria {
        id
        nome
      }
      cupons(
        where: {
          padaria_id: {_eq: $padaria_id},
          status: {_eq: "ativo"}
        }
      ) {
        id
        data_compra
        valor_compra
      }
    }
  }
`;

// Mutation para anexar cliente a uma padaria
export const ANEXAR_CLIENTE_A_PADARIA = `
  mutation AnexarClienteAPadaria($cliente_id: uuid!, $padaria_id: uuid!) {
    update_clientes_by_pk(
      pk_columns: {id: $cliente_id},
      _set: {padaria_id: $padaria_id}
    ) {
      id
      nome
      cpf
      whatsapp
      padaria_id
      padaria {
        id
        nome
      }
    }
  }
`;

// ===== QUERIES PARA SISTEMA DE SALDOS POR PADARIA =====

// Query para buscar saldo de um cliente em uma padaria específica
export const GET_SALDO_CLIENTE_PADARIA = `
  query GetSaldoClientePadaria($cliente_id: uuid!, $padaria_id: uuid!) {
    clientes_padarias_saldos(
      where: {
        cliente_id: {_eq: $cliente_id},
        padaria_id: {_eq: $padaria_id}
      }
    ) {
      id
      cliente_id
      padaria_id
      saldo_centavos
    }
  }
`;

// Query para buscar todos os saldos de um cliente
export const GET_SALDOS_CLIENTE = `
  query GetSaldosCliente($cliente_id: uuid!) {
    clientes_padarias_saldos(
      where: {
        cliente_id: {_eq: $cliente_id}
      }
    ) {
      id
      cliente_id
      padaria_id
      saldo_centavos
      padaria {
        id
        nome
      }
    }
  }
`;

// Mutation para inserir ou atualizar saldo de cliente em uma padaria
export const UPSERT_SALDO_CLIENTE_PADARIA = `
  mutation UpsertSaldoClientePadaria(
    $cliente_id: uuid!,
    $padaria_id: uuid!,
    $saldo_centavos: Int!
  ) {
    insert_clientes_padarias_saldos_one(
      object: {
        cliente_id: $cliente_id,
        padaria_id: $padaria_id,
        saldo_centavos: $saldo_centavos
      },
      on_conflict: {
        constraint: clientes_padarias_saldos_cliente_id_padaria_id_key,
        update_columns: [saldo_centavos]
      }
    ) {
      id
      cliente_id
      padaria_id
      saldo_centavos
    }
  }
`;

// Mutation para zerar saldo de cliente em uma padaria
export const ZERAR_SALDO_CLIENTE_PADARIA = `
  mutation ZerarSaldoClientePadaria($cliente_id: uuid!, $padaria_id: uuid!) {
    update_clientes_padarias_saldos(
      where: {
        cliente_id: {_eq: $cliente_id},
        padaria_id: {_eq: $padaria_id}
      },
      _set: {
        saldo_centavos: 0
      }
    ) {
      affected_rows
    }
  }
`;

// Mutation para adicionar saldo a um cliente em uma padaria
export const ADICIONAR_SALDO_CLIENTE_PADARIA = `
  mutation AdicionarSaldoClientePadaria(
    $cliente_id: uuid!,
    $padaria_id: uuid!,
    $saldo_centavos: Int!
  ) {
    insert_clientes_padarias_saldos_one(
      object: {
        cliente_id: $cliente_id,
        padaria_id: $padaria_id,
        saldo_centavos: $saldo_centavos
      },
      on_conflict: {
        constraint: clientes_padarias_saldos_cliente_id_padaria_id_key,
        update_columns: [saldo_centavos]
      }
    ) {
      id
      cliente_id
      padaria_id
      saldo_centavos
    }
  }
`;
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
    participantes(limit: $limit, offset: $offset) {
      id
      nome
      email
      telefone
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
  mutation ScheduleSorteio($id: uuid!, $data: timestamptz!, $campanhaId: uuid!) {
    insert_sorteios_one(object: {id: $id, data_sorteio: $data, campanha_id: $campanhaId}) {
      id
      data_sorteio
      campanha_id
    }
  }
`;

export const UPDATE_SORTEIO = `
  mutation UpdateSorteio($id: uuid!, $data: timestamptz!, $campanhaId: uuid!) {
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
  mutation UpdateCampanha($id: uuid!, $set: campanha_set_input!) {
    update_campanha_by_pk(pk_columns: {id: $id}, _set: $set) {
      id
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
  query GetClienteById($id: Int!) {
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
  query GetHistoricoSorteios {
    sorteios(order_by: {data_sorteio: desc}) {
      id
      data_sorteio
      numero_sorteado
      ganhador_id
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
    cupons {
      id
      data_compra
    }
    padarias_aggregate {
      aggregate {
        count
      }
    }
  }
`;

// Query para buscar todos os cupons ativos para sorteio global
export const GET_ALL_CUPONS_FOR_GLOBAL_SORTEIO = `
  query GetAllCuponsForGlobalSorteio($campanhaId: uuid!) {
    cupons(
      where: {
        status: {_eq: "ativo"},
        valor_compra: {_neq: "0"},
        campanha_id: {_eq: $campanhaId}
      }
      order_by: {data_compra: desc}
    ) {
      id
      numero_sorte
      valor_compra
      data_compra
      status
      campanha_id
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

// Query simples para buscar ganhadores salvos (valor_compra = "0")
export const GET_GANHADORES_SALVOS = `
  query GetGanhadoresSalvos {
    cupons(
      where: {valor_compra: {_eq: "0"}}
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
export const SALVAR_GANHADOR = `
  mutation SalvarGanhador(
    $numero_sorteado: String!,
    $data_sorteio: timestamptz!,
    $ganhador_id: uuid!,
    $cupom_vencedor_id: uuid!,
    $cliente_id: uuid!
  ) {
    sorteio: insert_sorteios_one(object: {
      numero_sorteado: $numero_sorteado
      data_sorteio: $data_sorteio
      ganhador_id: $ganhador_id
      cupom_vencedor_id: $cupom_vencedor_id
      status: "realizado"
      nome: "Sorteio Digital"
    }) {
      id
      numero_sorteado
      data_sorteio
      ganhador_id
      cupom_vencedor_id
      status
    }
    marcar_cupom_vencedor: update_cupons_by_pk(
      pk_columns: {id: $cupom_vencedor_id}
      _set: {
        status: "sorteado"
      }
    ) {
      id
      status
    }
    outros_cupons: update_cupons(
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

// Mutation para reativar TODOS os cupons de um cliente
export const REATIVAR_CUPOM = `
  mutation ReativarCupom($cliente_id: uuid!) {
    update_cupons(
      where: {cliente_id: {_eq: $cliente_id}, valor_compra: {_eq: "0"}}
      _set: {valor_compra: "50"}
    ) {
      affected_rows
    }
  }
`;

// Query para buscar ganhadores salvos (da tabela sorteios)
export const GET_GANHADORES_COM_DADOS_COMPLETOS = `
  query GetGanhadoresCompletos {
    sorteios(
      where: {status: {_eq: "realizado"}}
      order_by: {data_sorteio: desc}
    ) {
      id
      numero_sorteado
      data_sorteio
      status
      ganhador_id
      cupom_vencedor_id
      campanha_id
      campanha {
        id
        Nome
      }
      ganhador {
        id
        nome
        cpf
        telefone
        email
      }
      cupom_vencedor {
        id
        numero_sorte
        numero_cupom
        padaria {
          id
          nome
        }
      }
    }
  }
`;
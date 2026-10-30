export const EXISTING_ACCESS_MESSAGE =
  'Esta padaria já possui acesso configurado. Entre com sua senha ou use "Esqueci minha senha".';
const CONFLICT_MESSAGE =
  'Já existe uma conta vinculada a este CNPJ ou padaria. Entre com sua senha ou entre em contato com o SINDPAN.';

interface BakeryAccount {
  id: string;
  email?: string | null;
  bakery_name?: string | null;
  cnpj?: string | null;
  padarias_id?: string | null;
  password_hash?: string | null;
  role: string;
}

interface Client {
  query<T>(query: string, variables: Record<string, unknown>): Promise<T>;
  mutate<T>(query: string, variables: Record<string, unknown>): Promise<T>;
}

const USER_FIELDS = 'id email cnpj bakery_name role padarias_id';
export const FIND_BAKERY_ACCOUNTS = `
  query FindBakeryAccounts($cnpj: String!, $padarias_id: uuid!) {
    users(where: {_or: [{cnpj: {_eq: $cnpj}}, {padarias_id: {_eq: $padarias_id}}]}) {
      ${USER_FIELDS} password_hash
    }
  }
`;

// Recheck the empty password in the mutation to protect simultaneous submissions.
export const INITIALIZE_BAKERY_ACCOUNT = `
  mutation InitializeBakeryAccount($id: uuid!, $cnpj: String!, $padarias_id: uuid!, $password_hash: String!, $bakery_name: String!) {
    update_users(where: {
      id: {_eq: $id}, role: {_eq: "bakery"},
      _and: [
        {_or: [{password_hash: {_is_null: true}}, {password_hash: {_eq: ""}}]},
        {_or: [{cnpj: {_is_null: true}}, {cnpj: {_eq: ""}}, {cnpj: {_eq: $cnpj}}]},
        {_or: [{padarias_id: {_is_null: true}}, {padarias_id: {_eq: $padarias_id}}]}
      ]
    }, _set: {cnpj: $cnpj, padarias_id: $padarias_id, password_hash: $password_hash, bakery_name: $bakery_name}) {
      affected_rows returning { ${USER_FIELDS} }
    }
  }
`;

export const CREATE_BAKERY_ACCOUNT = `
  mutation CreateBakeryAccount($cnpj: String!, $padarias_id: uuid!, $password_hash: String!, $bakery_name: String!) {
    insert_users_one(object: {cnpj: $cnpj, padarias_id: $padarias_id, password_hash: $password_hash, bakery_name: $bakery_name, role: "bakery"}) {
      ${USER_FIELDS}
    }
  }
`;

export async function initializeBakeryAccess(
  client: Client,
  input: { cnpj: string; padarias_id: string; bakery_name: string },
  hashPassword: () => Promise<string>,
) {
  try {
    const { users } = await client.query<{ users: BakeryAccount[] }>(FIND_BAKERY_ACCOUNTS, input);
    if (users.length > 1) throw new Error(CONFLICT_MESSAGE);
    const account = users[0];
    if (account) {
      if (account.password_hash) throw new Error(EXISTING_ACCESS_MESSAGE);
      if (account.role !== 'bakery' ||
          (account.cnpj && account.cnpj !== input.cnpj) ||
          (account.padarias_id && account.padarias_id !== input.padarias_id)) {
        throw new Error(CONFLICT_MESSAGE);
      }
    }
    const variables = { ...input, password_hash: await hashPassword() };
    if (account) {
      const result = await client.mutate<{ update_users: { affected_rows: number; returning: BakeryAccount[] } }>(
        INITIALIZE_BAKERY_ACCOUNT, { ...variables, id: account.id },
      );
      if (result.update_users?.affected_rows !== 1) throw new Error(EXISTING_ACCESS_MESSAGE);
      return result.update_users.returning[0];
    }
    const result = await client.mutate<{ insert_users_one: BakeryAccount }>(CREATE_BAKERY_ACCOUNT, variables);
    if (!result.insert_users_one) throw new Error('Não foi possível criar o acesso da padaria.');
    return result.insert_users_one;
  } catch (error) {
    // A competing registration can win after the read. Never retry by overwriting it.
    if (error instanceof Error && /users_(?:cnpj|padaria[s]?_id)_key|Uniqueness violation|duplicate key/i.test(error.message)) {
      throw new Error(CONFLICT_MESSAGE);
    }
    throw error;
  }
}

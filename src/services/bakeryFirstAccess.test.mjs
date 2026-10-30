import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeBakeryAccess, EXISTING_ACCESS_MESSAGE, INITIALIZE_BAKERY_ACCOUNT } from './bakeryFirstAccess.ts';

const input = { cnpj: '12345678000190', padarias_id: 'bakery-1', bakery_name: 'Padaria' };
const seed = { id: 'user-1', role: 'bakery', padarias_id: input.padarias_id, cnpj: null, password_hash: null };
function fixture(users, mutation = async () => ({ update_users: { affected_rows: 1, returning: [seed] } })) {
  const writes = [];
  let hashes = 0;
  const client = {
    query: async () => ({ users }),
    mutate: async (query, variables) => { writes.push({ query, variables }); return mutation(query, variables); },
  };
  return { run: () => initializeBakeryAccess(client, input, async () => { hashes++; return 'new-hash'; }), writes, hashes: () => hashes };
}

test('initializes the existing bakery account with a missing CNPJ, preserving its ID', async () => {
  const f = fixture([seed]);
  assert.equal((await f.run()).id, seed.id);
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].query, INITIALIZE_BAKERY_ACCOUNT);
  assert.equal(f.writes[0].variables.id, seed.id);
  assert.equal(f.writes[0].variables.cnpj, input.cnpj);
});
test('allows a precreated account with an empty password and missing bakery link', async () => {
  const f = fixture([{ ...seed, cnpj: input.cnpj, padarias_id: null, password_hash: '' }]);
  await f.run();
  assert.equal(f.writes.length, 1);
});
test('never hashes or writes over an existing password', async () => {
  const f = fixture([{ ...seed, password_hash: 'existing-hash' }]);
  await assert.rejects(f.run, { message: EXISTING_ACCESS_MESSAGE });
  assert.equal(f.writes.length, 0);
  assert.equal(f.hashes(), 0);
});
for (const [name, accounts] of [
  ['two separate CNPJ and bakery accounts', [seed, { ...seed, id: 'other' }]],
  ['an admin account', [{ ...seed, role: 'admin' }]],
  ['another CNPJ', [{ ...seed, cnpj: '98765432000190' }]],
  ['another bakery', [{ ...seed, padarias_id: 'other-bakery' }]],
]) test(`rejects ${name} without any write`, async () => {
  const f = fixture(accounts);
  await assert.rejects(f.run, /Já existe uma conta vinculada/);
  assert.equal(f.writes.length, 0);
});
test('creates a new account without an overwrite-on-conflict mutation', async () => {
  const f = fixture([], async () => ({ insert_users_one: seed }));
  await f.run();
  assert.match(f.writes[0].query, /insert_users_one/);
  assert.doesNotMatch(f.writes[0].query, /on_conflict/);
});
test('a concurrent password setup that wins the guarded update is not overwritten', async () => {
  const f = fixture([seed], async () => ({ update_users: { affected_rows: 0, returning: [] } }));
  await assert.rejects(f.run, { message: EXISTING_ACCESS_MESSAGE });
  assert.equal(f.writes.length, 1);
});
test('a concurrent insert conflict is translated and never retried as an update', async () => {
  const f = fixture([], async () => { throw new Error('GraphQL Error: duplicate key value violates unique constraint "users_padaria_id_key"'); });
  await assert.rejects(f.run, /Já existe uma conta vinculada/);
  assert.equal(f.writes.length, 1);
});
test('unexpected API failures remain visible', async () => {
  const f = fixture([], async () => { throw new Error('HTTP Error: 503'); });
  await assert.rejects(f.run, /503/);
});

import test from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL = 'https://account-test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-not-a-real-key'
const { supabaseAdmin } = await import('../dist/lib/supabaseAdmin.js')
const { deleteAccount } = await import('../dist/routes/account.js')

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } }
}

test('rechaza la eliminación sin sesión o sin confirmación', async () => {
  for (const req of [{ body: { confirmation: 'ELIMINAR' } }, { userId: 'owner', body: {} }]) {
    const res = response()
    await deleteAccount(req, res)
    assert.equal(res.statusCode, req.userId ? 400 : 401)
  }
})

test('sin migración no elimina la cuenta ni archivos', async (t) => {
  t.mock.method(supabaseAdmin, 'rpc', async () => ({ error: { code: 'PGRST202' } }))
  const remove = t.mock.method(supabaseAdmin.auth.admin, 'deleteUser', async () => { throw new Error('No debe ejecutarse') })
  const res = response()
  await deleteAccount({ userId: 'owner', body: { confirmation: 'ELIMINAR' } }, res)
  assert.equal(res.statusCode, 503)
  assert.equal(remove.mock.callCount(), 0)
})

test('usa el usuario autenticado y elimina archivos antes de la cuenta', async (t) => {
  const order = []
  t.mock.method(supabaseAdmin, 'rpc', async (_name, args) => {
    assert.equal(args.p_user_id, 'owner')
    return { data: [{ bucket_id: 'letter-assets', name: 'space/image.webp' }], error: null }
  })
  t.mock.method(supabaseAdmin.storage, 'from', (bucket) => ({ remove: async (paths) => {
    assert.equal(bucket, 'letter-assets'); assert.deepEqual(paths, ['space/image.webp'])
    order.push('files'); return { error: null }
  } }))
  t.mock.method(supabaseAdmin.auth.admin, 'deleteUser', async (id) => {
    assert.equal(id, 'owner'); order.push('account'); return { error: null }
  })
  const res = response()
  await deleteAccount({ userId: 'owner', body: { confirmation: 'ELIMINAR', userId: 'another-user' } }, res)
  assert.equal(res.body.ok, true)
  assert.deepEqual(order, ['files', 'account'])
})

test('si falla Storage conserva la cuenta', async (t) => {
  t.mock.method(supabaseAdmin, 'rpc', async () => ({ data: [{ bucket_id: 'letter-assets', name: 'image' }], error: null }))
  t.mock.method(supabaseAdmin.storage, 'from', () => ({ remove: async () => ({ error: { message: 'failure' } }) }))
  const remove = t.mock.method(supabaseAdmin.auth.admin, 'deleteUser', async () => { throw new Error('No debe ejecutarse') })
  const res = response()
  await deleteAccount({ userId: 'owner', body: { confirmation: 'ELIMINAR' } }, res)
  assert.equal(res.statusCode, 500)
  assert.equal(remove.mock.callCount(), 0)
})

test('una eliminación fallida nunca informa éxito', async (t) => {
  t.mock.method(supabaseAdmin, 'rpc', async () => ({ data: [], error: null }))
  t.mock.method(supabaseAdmin.auth.admin, 'deleteUser', async () => ({ error: { code: 'unexpected_failure' } }))
  const res = response()
  await deleteAccount({ userId: 'owner', body: { confirmation: 'ELIMINAR' } }, res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.ok, undefined)
})

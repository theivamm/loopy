import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = process.argv[2]
if (!email) {
  console.error('usage: node scripts/confirm-test-user.mjs <email>')
  process.exit(1)
}

const { data, error } = await admin.auth.admin.listUsers()
if (error) {
  console.error('list error', error)
  process.exit(1)
}

const user = data.users.find((u) => u.email === email)
if (!user) {
  console.log('no user found with that email')
  process.exit(0)
}

console.log('found user:', { id: user.id, confirmed: user.email_confirmed_at })

if (!user.email_confirmed_at) {
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  })
  if (updateError) {
    console.error('confirm error', updateError)
    process.exit(1)
  }
  console.log('confirmed email for', email)
} else {
  console.log('already confirmed')
}

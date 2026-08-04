import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjjxrfiorfboknnaxevz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqanhyZmlvcmZib2tubmF4ZXZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcxNjMyNSwiZXhwIjoyMDgyMjkyMzI1fQ.JZ08otMF8VHVXnhjiLbNYgAw15fJsVWXVFKAIr2xsSk'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function run() {
  console.log('Fetching users list...')
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  const user = users.find(u => u.email === 'ace.bista@gmail.com')
  if (!user) {
    console.error('User not found with email ace.bista@gmail.com')
    console.log('Available users:')
    users.forEach(u => console.log(`- ${u.email} (${u.id})`))
    return
  }

  console.log('Found user:', user.id)

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: 'Sachu123!' }
  )

  if (error) {
    console.error('Error updating password:', error)
  } else {
    console.log('Password updated successfully for user:', data.user.email)
  }
}

run()

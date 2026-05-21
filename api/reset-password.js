// POST /api/reset-password — drużynowy resetuje hasło gościa
import { createHash, randomBytes } from 'crypto'

const SECRET = 'campos-guest-hash-2026'

function hashPassword(password, email) {
  return createHash('sha256').update(password + ':' + SECRET + ':' + email).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'Brak userId' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '')

    const { data: user, error } = await supabase.from('external_users').select('*').eq('id', userId).single()
    if (error || !user) return res.status(404).json({ error: 'User not found' })

    // Generate new readable password
    const chars = 'abcdefghkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 10; i++) password += chars[Math.floor(Math.random() * chars.length)]

    await supabase.from('external_users').update({
      password_hash: hashPassword(password, user.email),
      session_token: null,
    }).eq('id', userId)

    return res.status(200).json({ password })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

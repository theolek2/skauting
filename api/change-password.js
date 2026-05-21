// POST /api/change-password — gość zmienia hasło na własne
import { createHash } from 'crypto'

const SECRET = 'campos-guest-hash-2026'

function hashPassword(password, email) {
  return createHash('sha256').update(password + ':' + SECRET + ':' + email).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { sessionToken, newPassword } = req.body || {}
  if (!sessionToken || !newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Nowe hasło (min 4 znaki) wymagane' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '')

    const { data: user, error } = await supabase
      .from('external_users')
      .select('*')
      .eq('session_token', sessionToken)
      .single()

    if (error || !user) return res.status(401).json({ error: 'Sesja wygasła' })

    await supabase.from('external_users').update({
      password_hash: hashPassword(newPassword, user.email),
    }).eq('id', user.id)

    return res.status(200).json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

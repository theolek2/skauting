// POST /api/guest-login — gość loguje się hasłem
import { createHash } from 'crypto'

const SECRET = 'campos-guest-hash-2026'

function hashPassword(password, email) {
  return createHash('sha256').update(password + ':' + SECRET + ':' + email).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if (!email?.trim() || !password) return res.status(400).json({ error: 'Email i hasło wymagane' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '')

    const hash = hashPassword(password, email)

    const { data: user, error } = await supabase
      .from('external_users')
      .select('*, external_roles:campos_roles(permissions)')
      .eq('email', email.trim().toLowerCase())
      .eq('password_hash', hash)
      .eq('active', true)
      .single()

    if (error || !user) return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' })

    const sessionToken = crypto.randomUUID()
    await supabase.from('external_users').update({
      session_token: sessionToken,
      last_login: new Date().toISOString(),
    }).eq('id', user.id)

    return res.status(200).json({
      session_token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role || 'przyboczny',
        robert_enabled: user.robert_enabled || false,
        permissions: user.external_roles?.permissions || {},
      },
    })
  } catch (e) {
    console.error('guest-login error:', e)
    return res.status(500).json({ error: e.message || 'Błąd serwera' })
  }
}

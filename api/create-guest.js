// POST /api/create-guest — drużynowy tworzy konto gościa z hasłem
import { createHash } from 'crypto'

const SECRET = 'campos-guest-hash-2026'

function hashPassword(password, email) {
  return createHash('sha256').update(password + ':' + SECRET + ':' + email).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name } = req.body || {}
  if (!email?.trim() || !name?.trim()) return res.status(400).json({ error: 'Email i imię wymagane' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '')

    // Generuj losowe hasło (12 znaków, czytelne)
    const chars = 'abcdefghkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) password += chars[Math.floor(Math.random() * chars.length)]

    const sessionToken = crypto.randomUUID()

    const { data: user, error } = await supabase
      .from('external_users')
      .upsert([{
        email: email.trim().toLowerCase(),
        display_name: name.trim(),
        role: 'przyboczny',
        active: true,
        password_hash: hashPassword(password, email),
        session_token: sessionToken,
        invited_by: null,
        magic_token: null,
        token_expires: null,
      }], { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({
      success: true,
      email: user.email,
      password,
      session_token: sessionToken,
    })
  } catch (e) {
    console.error('create-guest error:', e)
    return res.status(500).json({ error: e.message || 'Błąd serwera' })
  }
}

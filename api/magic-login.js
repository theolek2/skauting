// GET /api/magic-login?token=xxx — aktywuj konto przybocznego
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.query?.token
  if (!token) return res.status(400).json({ error: 'Brak tokena' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    )

    const { data: user, error: err1 } = await supabase
      .from('external_users')
      .select('*')
      .eq('magic_token', token)
      .gte('token_expires', new Date().toISOString())
      .single()

    if (err1 || !user) return res.status(401).json({ error: 'Token nieważny lub wygasł' })

    const sessionToken = crypto.randomUUID()
    const { error: err2 } = await supabase
      .from('external_users')
      .update({
        active: true,
        session_token: sessionToken,
        magic_token: null,
        token_expires: null,
        last_login: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (err2) throw err2

    return res.status(200).json({
      session_token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role || 'przyboczny',
        robert_enabled: user.robert_enabled || false,
      },
    })
  } catch (e) {
    console.error('magic-login error:', e)
    return res.status(500).json({ error: e.message || 'Błąd serwera' })
  }
}

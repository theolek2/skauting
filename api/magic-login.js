// GET /api/magic-login?token=xxx — zweryfikuj i zaloguj przybocznego
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

    // Znajdź usera po tokenie
    const { data: user, error: err1 } = await supabase
      .from('external_users')
      .select('*, external_roles:campos_roles(permissions)')
      .eq('magic_token', token)
      .gte('token_expires', new Date().toISOString())
      .single()

    if (err1 || !user) return res.status(401).json({ error: 'Token nieważny lub wygasł' })

    // Wyczyść token
    const { error: err2 } = await supabase
      .from('external_users')
      .update({
        last_login: new Date().toISOString(),
        magic_token: null,
        token_expires: null,
      })
      .eq('id', user.id)

    if (err2) throw err2

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        permissions: user.external_roles?.permissions || {},
      },
    })
  } catch (e) {
    console.error('magic-login error:', e)
    return res.status(500).json({ error: e.message || 'Błąd serwera' })
  }
}

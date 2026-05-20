// GET /api/session?token=xxx — zweryfikuj sesję przybocznego
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

    const { data: user, error } = await supabase
      .from('external_users')
      .select('*, external_roles:campos_roles(permissions)')
      .eq('session_token', token)
      .eq('active', true)
      .single()

    if (error || !user) return res.status(401).json({ error: 'Sesja wygasła' })

    return res.status(200).json({
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
    console.error('session error:', e)
    return res.status(500).json({ error: e.message })
  }
}

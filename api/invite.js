// POST /api/invite — utwórz magic link dla przybocznego
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name, phone, role } = req.body || {}
  if (!email?.trim() || !name?.trim()) return res.status(400).json({ error: 'Email i imię wymagane' })

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || '',
      process.env.VITE_SUPABASE_ANON_KEY || ''
    )

    const token = crypto.randomUUID()
    const { data, error } = await supabase
      .from('external_users')
      .upsert([{
        email: email.trim().toLowerCase(),
        display_name: name.trim(),
        phone,
        role: role || 'przyboczny',
        invited_by: null,
        magic_token: token,
        token_expires: new Date(Date.now() + 7 * 86400000).toISOString(),
      }], { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error

    const url = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/magic-login?token=${token}`

    return res.status(200).json({ success: true, token, url })
  } catch (e) {
    console.error('invite error:', e)
    return res.status(500).json({ error: e.message || 'Błąd serwera' })
  }
}

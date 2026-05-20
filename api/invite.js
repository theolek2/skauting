// POST /api/invite — wyślij magic link do przybocznego
// Inline Supabase (omija problem z import.meta.env na Vercelu)

async function handler(req, res) {
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

    const inviteUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/magic-login?token=${token}`

    // Wyślij mail przez Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CampOS <oboz@skauci-europy.pl>',
            to: email,
            subject: `Zaproszenie do CampOS — ${name}`,
            html: `<p>Cześć <b>${name}</b>!</p><p>Zostałeś zaproszony do pracy przy obozie.</p><p><a href="${inviteUrl}">Otwórz CampOS →</a></p><p style="color:#888;font-size:12px;">Link ważny 7 dni</p>`,
          }),
        })
      } catch (e) { console.warn('Resend:', e.message) }
    }

    return res.status(200).json({ success: true, token, url: inviteUrl })
  } catch (e) {
    console.error('invite error:', e)
    return res.status(500).json({ error: e.message || 'Błąd serwera' })
  }
}

export default handler

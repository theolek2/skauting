// POST /api/invite — wyślij magic link do przybocznego
import { inviteExternalUser } from '../src/lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name, phone, role } = req.body || {}
  if (!email?.trim() || !name?.trim()) return res.status(400).json({ error: 'Email i imię wymagane' })

  try {
    const user = await inviteExternalUser({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone,
      role: role || 'przyboczny',
      invitedBy: null,
    })

    const inviteUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/magic-login?token=${user.magic_token}`

    // Wyślij mail przez Resend
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
          html: `
            <h2>CampOS — Skauci Europy</h2>
            <p>Cześć <b>${name}</b>!</p>
            <p>Zostałeś zaproszony do współpracy przy organizacji obozu harcerskiego.</p>
            <p><a href="${inviteUrl}" style="background:#2d6a2d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
              Otwórz CampOS →
            </a></p>
            <p style="color:#888;font-size:12px;">Link ważny 7 dni</p>
          `,
        }),
      })
      console.log('Resend invite sent to', email)
    } catch (e) {
      console.warn('Resend error:', e.message)
    }

    res.status(200).json({ success: true, token: user.magic_token })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

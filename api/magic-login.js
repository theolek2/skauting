// GET /api/magic-login?token=xxx — zweryfikuj i zaloguj przybocznego
import { getExternalUserByToken, updateExternalUser } from '../src/lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'Brak tokena' })

  try {
    const user = await getExternalUserByToken(token)
    if (!user) return res.status(401).json({ error: 'Token nieważny lub wygasł' })

    await updateExternalUser(user.id, {
      last_login: new Date().toISOString(),
      magic_token: null,
      token_expires: null,
    })

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        permissions: user.external_roles?.permissions || {},
      },
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

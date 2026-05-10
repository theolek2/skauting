import { useState } from 'react'
import { signIn, signUp, upsertProfile } from '../lib/supabase'

export default function AuthModal({ onClose, onAuth }) {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [org, setOrg]           = useState('')
  const [phone, setPhone]       = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const ALLOWED_DOMAIN = 'skauci-europy.pl'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Weryfikacja domeny
    if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Rejestracja dostępna tylko dla adresów @${ALLOWED_DOMAIN}`)
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { data, error: err } = await signIn(email, password)
        if (err) throw err
        onAuth(data.user)
      } else {
        const { data, error: err } = await signUp(email, password)
        if (err) throw err
        if (data.user && !data.session) {
          // Email confirmation required
          setMode('confirm')
          return
        }
        if (data.user) {
          await upsertProfile({ id: data.user.id, display_name: name, organization: org, phone })
          onAuth(data.user)
        }
      }
    } catch (err) {
      setError(err.message || 'Błąd logowania')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-green-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {mode === 'login' ? '🔐 Zaloguj się' : '📝 Utwórz konto'}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">×</button>
        </div>

        {/* Ekran potwierdzenia email */}
        {mode === 'confirm' && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Sprawdź swoją skrzynkę</h3>
            <p className="text-sm text-gray-600 mb-4">
              Wysłaliśmy link potwierdzający na adres <b>{email}</b>.<br/>
              Kliknij w link w emailu aby aktywować konto.
            </p>
            <p className="text-xs text-gray-400">Po potwierdzeniu wróć tutaj i zaloguj się.</p>
            <button onClick={() => setMode('login')} className="mt-4 text-green-700 text-sm font-semibold hover:underline">
              → Przejdź do logowania
            </button>
          </div>
        )}

        {mode !== 'confirm' && <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              placeholder="email@harcerze.pl" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hasło *</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              placeholder="min. 6 znaków" minLength={6} />
          </div>

          {mode === 'register' && <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Imię i nazwisko *</label>
              <input required value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="Jan Kowalski" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Jednostka / hufiec</label>
              <input value={org} onChange={e => setOrg(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="np. 1 DH Kraków" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Telefon kontaktowy</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                placeholder="+48 000 000 000" />
            </div>
          </>}

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-700 text-white py-2.5 rounded-xl font-bold hover:bg-green-800 disabled:opacity-50">
            {loading ? 'Proszę czekać...' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
          </button>

          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Nie masz konta?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-green-700 font-semibold hover:underline">
                  Zarejestruj się
                </button>
              </>
            ) : (
              <>Masz już konto?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-green-700 font-semibold hover:underline">
                  Zaloguj się
                </button>
              </>
            )}
          </p>
          {mode === 'register' && (
            <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
              🔒 Rejestracja dostępna wyłącznie dla adresów <b>@skauci-europy.pl</b>.
              Po rejestracji otrzymasz email z linkiem aktywacyjnym.
            </p>
          )}
        </form>}
      </div>
    </div>
  )
}

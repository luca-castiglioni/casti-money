import { useState, type FormEvent } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [attesa, setAttesa] = useState(false)

  async function accedi(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setAttesa(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setAttesa(false)
    if (error) setErrore('Email o password non corretti.')
  }

  return (
    <main className="schermata-centrale">
      <div className="logo">€</div>
      <h1>Casti Money</h1>
      <p className="sottotitolo">Accedi per registrare entrate e uscite</p>
      <form onSubmit={accedi} className="scheda modulo">
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errore && <p className="errore">{errore}</p>}
        <button className="pulsante primario" disabled={attesa}>
          {attesa ? 'Accesso…' : 'Accedi'}
        </button>
      </form>
      <p className="nota">Gli account vengono creati dall'amministratore.</p>
    </main>
  )
}

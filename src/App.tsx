import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Elenco from './components/Elenco'
import Login from './components/Login'
import MovimentoForm from './components/MovimentoForm'
import { scaricaExcel } from './export'
import { formatEuro, limitiMese, nomeMese } from './format'
import { caricaControparti, caricaMovimenti, supabase, supabaseConfigurato } from './supabase'
import type { Movimento, Profilo } from './types'

export default function App() {
  const [sessione, setSessione] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabaseConfigurato) return
    supabase.auth.getSession().then(({ data }) => setSessione(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessione(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigurato) return <DaConfigurare />
  if (sessione === undefined) return <p className="vuoto">Caricamento…</p>
  if (!sessione) return <Login />
  return <Principale userId={sessione.user.id} />
}

function Principale({ userId }: { userId: string }) {
  const adesso = new Date()
  const [anno, setAnno] = useState(adesso.getFullYear())
  const [mese, setMese] = useState(adesso.getMonth())
  const [movimenti, setMovimenti] = useState<Movimento[]>([])
  const [controparti, setControparti] = useState<string[]>([])
  const [profilo, setProfilo] = useState<Profilo | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [modulo, setModulo] = useState<{ movimento?: Movimento } | null>(null)
  const [menuExcel, setMenuExcel] = useState(false)

  const ricarica = useCallback(async () => {
    setCaricamento(true)
    try {
      const [dal, al] = limitiMese(anno, mese)
      const [m, c] = await Promise.all([caricaMovimenti(dal, al), caricaControparti()])
      setMovimenti(m)
      setControparti(c)
      setErrore(null)
    } catch (err) {
      setErrore('Impossibile caricare i dati: ' + (err as Error).message)
    } finally {
      setCaricamento(false)
    }
  }, [anno, mese])

  useEffect(() => {
    ricarica()
  }, [ricarica])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setProfilo(data as Profilo | null))
  }, [userId])

  function spostaMese(delta: number) {
    const d = new Date(anno, mese + delta, 1)
    setAnno(d.getFullYear())
    setMese(d.getMonth())
  }

  async function esporta(tutto: boolean) {
    setMenuExcel(false)
    try {
      const dati = tutto ? await caricaMovimenti() : movimenti
      const suffisso = tutto ? 'tutti' : `${anno}-${String(mese + 1).padStart(2, '0')}`
      await scaricaExcel(dati, `movimenti-${suffisso}.xlsx`)
    } catch (err) {
      setErrore('Esportazione non riuscita: ' + (err as Error).message)
    }
  }

  const entrate = movimenti.filter((m) => m.importo > 0).reduce((s, m) => s + Number(m.importo), 0)
  const uscite = movimenti.filter((m) => m.importo < 0).reduce((s, m) => s + Number(m.importo), 0)
  const puoModificare = (m: Movimento) => m.created_by === userId || Boolean(profilo?.is_admin)

  return (
    <div className="app">
      <header className="testata">
        <div>
          <h1>Casti Money</h1>
          <small>
            {profilo?.nome ?? '…'}
            {profilo?.is_admin ? ' · amministratore' : ''}
          </small>
        </div>
        <div className="azioni-testata">
          <div className="menu-contenitore">
            <button className="pulsante piccolo" onClick={() => setMenuExcel(!menuExcel)}>
              Excel ↓
            </button>
            {menuExcel && (
              <div className="menu">
                <button onClick={() => esporta(false)}>{nomeMese(anno, mese)}</button>
                <button onClick={() => esporta(true)}>Tutti i movimenti</button>
              </div>
            )}
          </div>
          <button className="link" onClick={() => supabase.auth.signOut()}>
            Esci
          </button>
        </div>
      </header>

      <nav className="selettore-mese">
        <button onClick={() => spostaMese(-1)} aria-label="Mese precedente">‹</button>
        <span>{nomeMese(anno, mese)}</span>
        <button onClick={() => spostaMese(1)} aria-label="Mese successivo">›</button>
      </nav>

      <section className="riepilogo">
        <div>
          <small>Entrate</small>
          <strong className="entrata">{formatEuro(entrate)}</strong>
        </div>
        <div>
          <small>Uscite</small>
          <strong className="uscita">{formatEuro(uscite)}</strong>
        </div>
        <div>
          <small>Saldo</small>
          <strong className={entrate + uscite < 0 ? 'uscita' : 'entrata'}>
            {formatEuro(entrate + uscite, true)}
          </strong>
        </div>
      </section>

      {errore && <p className="errore riquadro">{errore}</p>}
      {caricamento && movimenti.length === 0 ? (
        <p className="vuoto">Caricamento…</p>
      ) : (
        <Elenco movimenti={movimenti} puoModificare={puoModificare} onApri={(m) => setModulo({ movimento: m })} />
      )}

      <button className="aggiungi" onClick={() => setModulo({})} aria-label="Nuovo movimento">
        +
      </button>

      {modulo && (
        <MovimentoForm
          movimento={modulo.movimento}
          controparti={controparti}
          onChiudi={() => setModulo(null)}
          onSalvato={() => {
            setModulo(null)
            ricarica()
          }}
        />
      )}
    </div>
  )
}

function DaConfigurare() {
  return (
    <main className="schermata-centrale">
      <div className="logo">€</div>
      <h1>Casti Money</h1>
      <div className="scheda testo">
        <p><strong>Manca il collegamento a Supabase.</strong></p>
        <p>
          Crea il file <code>.env.local</code> copiando <code>.env.example</code> e inserisci URL e
          chiave del tuo progetto Supabase. Poi riavvia l'app.
        </p>
      </div>
    </main>
  )
}

import { useState, type FormEvent } from 'react'
import { CATEGORIE_ENTRATA, CATEGORIE_USCITA, METODI_PAGAMENTO } from '../config'
import { oggi, parseImporto } from '../format'
import { eliminaMovimento, salvaMovimento } from '../supabase'
import type { Movimento, Tipo } from '../types'

const CHIAVE_ULTIMO_PAGAMENTO = 'casti-money:ultimo-pagamento'

function ultimoPagamento(): string {
  try {
    return localStorage.getItem(CHIAVE_ULTIMO_PAGAMENTO) ?? METODI_PAGAMENTO[0]
  } catch {
    return METODI_PAGAMENTO[0]
  }
}

interface Props {
  movimento?: Movimento // se presente, il modulo modifica invece di creare
  controparti: string[]
  onChiudi: () => void
  onSalvato: () => void
}

export default function MovimentoForm({ movimento, controparti, onChiudi, onSalvato }: Props) {
  const [tipo, setTipo] = useState<Tipo>(movimento?.tipo ?? 'uscita')
  const [importo, setImporto] = useState(
    movimento ? Math.abs(movimento.importo).toFixed(2).replace('.', ',') : '',
  )
  const [data, setData] = useState(movimento?.data ?? oggi())
  const [categoria, setCategoria] = useState(movimento?.categoria ?? '')
  const [controparte, setControparte] = useState(movimento?.controparte ?? '')
  const [pagamento, setPagamento] = useState(movimento?.pagamento ?? ultimoPagamento())
  const [descrizione, setDescrizione] = useState(movimento?.descrizione ?? '')
  const [errore, setErrore] = useState<string | null>(null)
  const [attesa, setAttesa] = useState(false)

  const categorie = tipo === 'uscita' ? CATEGORIE_USCITA : CATEGORIE_ENTRATA
  // se si modifica un movimento con una categoria non più in elenco, la mostriamo comunque
  const opzioniCategoria =
    categoria && !categorie.includes(categoria) ? [categoria, ...categorie] : categorie
  const opzioniPagamento =
    pagamento && !METODI_PAGAMENTO.includes(pagamento) ? [pagamento, ...METODI_PAGAMENTO] : METODI_PAGAMENTO

  function cambiaTipo(t: Tipo) {
    setTipo(t)
    setCategoria('')
  }

  async function salva(e: FormEvent) {
    e.preventDefault()
    const valore = parseImporto(importo)
    if (!(valore > 0)) return setErrore('Inserisci un importo valido, ad esempio 12,50.')
    if (!categoria) return setErrore('Scegli una categoria.')
    if (!controparte.trim()) return setErrore(tipo === 'uscita' ? 'Indica a chi hai pagato.' : 'Indica chi ti ha pagato.')
    if (!pagamento) return setErrore('Scegli il metodo di pagamento.')

    setErrore(null)
    setAttesa(true)
    try {
      await salvaMovimento(
        {
          data,
          tipo,
          importo: tipo === 'uscita' ? -valore : valore,
          categoria,
          controparte: controparte.trim(),
          pagamento,
          descrizione: descrizione.trim() || null,
        },
        movimento?.id,
      )
      try {
        localStorage.setItem(CHIAVE_ULTIMO_PAGAMENTO, pagamento)
      } catch {
        /* non essenziale */
      }
      onSalvato()
    } catch (err) {
      setErrore('Salvataggio non riuscito: ' + (err as Error).message)
      setAttesa(false)
    }
  }

  async function elimina() {
    if (!movimento || !confirm('Eliminare definitivamente questo movimento?')) return
    setAttesa(true)
    try {
      await eliminaMovimento(movimento.id)
      onSalvato()
    } catch (err) {
      setErrore('Eliminazione non riuscita: ' + (err as Error).message)
      setAttesa(false)
    }
  }

  return (
    <div className="foglio" role="dialog" aria-modal="true">
      <header className="foglio-testata">
        <button type="button" className="link" onClick={onChiudi}>
          Annulla
        </button>
        <h2>{movimento ? 'Modifica' : 'Nuovo movimento'}</h2>
        <span />
      </header>

      <form onSubmit={salva} className="modulo foglio-corpo">
        <div className="interruttore" role="group" aria-label="Tipo">
          <button
            type="button"
            className={tipo === 'uscita' ? 'attivo uscita' : ''}
            onClick={() => cambiaTipo('uscita')}
          >
            − Uscita
          </button>
          <button
            type="button"
            className={tipo === 'entrata' ? 'attivo entrata' : ''}
            onClick={() => cambiaTipo('entrata')}
          >
            + Entrata
          </button>
        </div>

        <label>
          Importo (€)
          <input
            className={`importo ${tipo}`}
            inputMode="decimal"
            placeholder="0,00"
            value={importo}
            onChange={(e) => setImporto(e.target.value)}
            autoFocus={!movimento}
          />
        </label>

        <label>
          {tipo === 'uscita' ? 'Pagato a' : 'Ricevuto da'}
          <input
            list="elenco-controparti"
            placeholder={tipo === 'uscita' ? 'es. Esselunga' : 'es. Azienda Srl'}
            value={controparte}
            onChange={(e) => setControparte(e.target.value)}
            autoCapitalize="words"
          />
          <datalist id="elenco-controparti">
            {controparti.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label>
          Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="" disabled>
              Scegli…
            </option>
            {opzioniCategoria.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="riga-due">
          <label>
            Pagamento
            <select value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
              {opzioniPagamento.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Data
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </label>
        </div>

        <label>
          Descrizione <span className="facoltativo">(facoltativa)</span>
          <input
            placeholder="es. Spesa settimanale"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />
        </label>

        {errore && <p className="errore">{errore}</p>}

        <button className="pulsante primario" disabled={attesa}>
          {attesa ? 'Salvataggio…' : 'Salva'}
        </button>
        {movimento && (
          <button type="button" className="pulsante pericolo" onClick={elimina} disabled={attesa}>
            Elimina
          </button>
        )}
      </form>
    </div>
  )
}

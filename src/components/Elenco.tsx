import { formatData, formatEuro } from '../format'
import type { Movimento } from '../types'

interface Props {
  movimenti: Movimento[]
  puoModificare: (m: Movimento) => boolean
  onApri: (m: Movimento) => void
}

export default function Elenco({ movimenti, puoModificare, onApri }: Props) {
  if (movimenti.length === 0) {
    return <p className="vuoto">Nessun movimento in questo mese.<br />Tocca + per aggiungerne uno.</p>
  }

  // raggruppa per giorno (l'elenco arriva già ordinato dal più recente)
  const gruppi: [string, Movimento[]][] = []
  for (const m of movimenti) {
    const ultimo = gruppi[gruppi.length - 1]
    if (ultimo && ultimo[0] === m.data) ultimo[1].push(m)
    else gruppi.push([m.data, [m]])
  }

  return (
    <div className="elenco">
      {gruppi.map(([data, voci]) => (
        <section key={data}>
          <h3 className="giorno">{formatData(data)}</h3>
          <ul className="scheda">
            {voci.map((m) => {
              const modificabile = puoModificare(m)
              return (
                <li key={m.id}>
                  <button
                    className="voce"
                    onClick={() => modificabile && onApri(m)}
                    disabled={!modificabile}
                    title={modificabile ? 'Tocca per modificare' : 'Inserito da un altro utente'}
                  >
                    <span className="voce-testo">
                      <strong>{m.controparte}</strong>
                      <small>
                        {m.categoria} · {m.pagamento}
                        {m.descrizione ? ` · ${m.descrizione}` : ''}
                      </small>
                      <small className="autore">{m.autore?.nome ?? m.autore?.email}</small>
                    </span>
                    <span className={`voce-importo ${m.tipo}`}>{formatEuro(Number(m.importo), true)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

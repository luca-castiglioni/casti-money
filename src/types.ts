export type Tipo = 'uscita' | 'entrata'

export interface Profilo {
  id: string
  email: string
  nome: string | null
  is_admin: boolean
}

export interface Movimento {
  id: string
  data: string // formato AAAA-MM-GG
  tipo: Tipo
  importo: number // negativo per le uscite, positivo per le entrate
  categoria: string
  controparte: string
  pagamento: string
  descrizione: string | null
  created_by: string
  created_at: string
  updated_by: string | null
  updated_at: string | null
  autore: Pick<Profilo, 'nome' | 'email'> | null
  modificatore: Pick<Profilo, 'nome' | 'email'> | null
}

// Dati inseriti dall'utente nel modulo
export interface NuovoMovimento {
  data: string
  tipo: Tipo
  importo: number
  categoria: string
  controparte: string
  pagamento: string
  descrizione: string | null
}

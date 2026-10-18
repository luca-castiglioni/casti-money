import { createClient } from '@supabase/supabase-js'
import type { Movimento, NuovoMovimento } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigurato = Boolean(url && anonKey)

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'non-configurato')

const SELECT_MOVIMENTI = `
  *,
  autore:profiles!movimenti_created_by_fkey(nome, email),
  modificatore:profiles!movimenti_updated_by_fkey(nome, email)
`

// Movimenti tra due date (incluse), dal più recente
export async function caricaMovimenti(dal?: string, al?: string): Promise<Movimento[]> {
  let query = supabase.from('movimenti').select(SELECT_MOVIMENTI)
  if (dal) query = query.gte('data', dal)
  if (al) query = query.lte('data', al)
  const { data, error } = await query
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Movimento[]
}

export async function caricaControparti(): Promise<string[]> {
  const { data, error } = await supabase
    .from('movimenti')
    .select('controparte')
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) throw error
  return [...new Set(data.map((r) => r.controparte as string))].sort((a, b) =>
    a.localeCompare(b, 'it'),
  )
}

export async function salvaMovimento(m: NuovoMovimento, id?: string) {
  const { error } = id
    ? await supabase.from('movimenti').update(m).eq('id', id)
    : await supabase.from('movimenti').insert(m)
  if (error) throw error
}

export async function eliminaMovimento(id: string) {
  const { error } = await supabase.from('movimenti').delete().eq('id', id)
  if (error) throw error
}

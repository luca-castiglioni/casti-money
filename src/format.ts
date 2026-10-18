const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })

export function formatEuro(n: number, conSegno = false): string {
  const s = euro.format(n)
  return conSegno && n > 0 ? `+${s}` : s
}

// Accetta "12,50", "1.234,56", "12.5", "€ 8"; restituisce NaN se non valido
export function parseImporto(testo: string): number {
  let s = testo.replace(/[€\s]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN
  return Number(s)
}

// Data di oggi nel formato AAAA-MM-GG (fuso orario locale)
export function oggi(): string {
  const d = new Date()
  return toISODate(d)
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function formatData(iso: string): string {
  const [a, m, g] = iso.split('-').map(Number)
  return new Date(a, m - 1, g).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function nomeMese(anno: number, mese: number): string {
  const s = new Date(anno, mese, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Primo e ultimo giorno del mese (mese da 0 a 11)
export function limitiMese(anno: number, mese: number): [string, string] {
  return [toISODate(new Date(anno, mese, 1)), toISODate(new Date(anno, mese + 1, 0))]
}

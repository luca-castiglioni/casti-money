import type { Movimento } from './types'

const FORMATO_EURO = '#,##0.00 €;[Red]-#,##0.00 €'

function nomeUtente(p: Movimento['autore']): string {
  return p ? (p.nome ?? p.email) : ''
}

function dataLocale(iso: string): Date {
  const [a, m, g] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, g))
}

// Crea il file Excel e lo fa scaricare al browser
export async function scaricaExcel(movimenti: Movimento[], nomeFile: string) {
  // caricata solo quando serve: è una libreria grande
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Casti Money'
  wb.created = new Date()

  // --- Foglio "Movimenti" ---
  const ws = wb.addWorksheet('Movimenti', { views: [{ state: 'frozen', ySplit: 1 }] })
  const ordinati = [...movimenti].sort((a, b) => a.data.localeCompare(b.data))
  ws.addTable({
    name: 'Movimenti',
    ref: 'A1',
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: [
      { name: 'Data', filterButton: true },
      { name: 'Tipo', filterButton: true },
      { name: 'Importo', filterButton: true, totalsRowFunction: 'sum' },
      { name: 'Categoria', filterButton: true },
      { name: 'Controparte', filterButton: true },
      { name: 'Pagamento', filterButton: true },
      { name: 'Descrizione', filterButton: true },
      { name: 'Inserito da', filterButton: true },
      { name: 'Modificato da', filterButton: true },
      { name: 'ID', filterButton: false },
    ],
    totalsRow: true,
    rows: ordinati.map((m) => [
      dataLocale(m.data),
      m.tipo === 'uscita' ? 'Uscita' : 'Entrata',
      Number(m.importo),
      m.categoria,
      m.controparte,
      m.pagamento,
      m.descrizione ?? '',
      nomeUtente(m.autore),
      nomeUtente(m.modificatore),
      m.id,
    ]),
  })
  const larghezze = [12, 10, 14, 20, 22, 18, 30, 16, 16, 38]
  larghezze.forEach((w, i) => (ws.getColumn(i + 1).width = w))
  ws.getColumn(1).numFmt = 'dd/mm/yyyy'
  ws.getColumn(3).numFmt = FORMATO_EURO

  // --- Foglio "Riepilogo": totali per mese ---
  const rs = wb.addWorksheet('Riepilogo')
  rs.columns = [
    { header: 'Mese', key: 'mese', width: 12 },
    { header: 'Entrate', key: 'entrate', width: 16, style: { numFmt: FORMATO_EURO } },
    { header: 'Uscite', key: 'uscite', width: 16, style: { numFmt: FORMATO_EURO } },
    { header: 'Saldo', key: 'saldo', width: 16, style: { numFmt: FORMATO_EURO } },
  ]
  rs.getRow(1).font = { bold: true }
  const perMese = new Map<string, { entrate: number; uscite: number }>()
  for (const m of ordinati) {
    const k = m.data.slice(0, 7)
    const t = perMese.get(k) ?? { entrate: 0, uscite: 0 }
    if (m.importo > 0) t.entrate += Number(m.importo)
    else t.uscite += Number(m.importo)
    perMese.set(k, t)
  }
  for (const [mese, t] of perMese) {
    rs.addRow({ mese, entrate: t.entrate, uscite: t.uscite, saldo: t.entrate + t.uscite })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = nomeFile
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
}

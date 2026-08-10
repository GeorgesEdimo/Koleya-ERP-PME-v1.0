import jsPDF from 'jspdf'
import 'jspdf-autotable'

const formatFCFA = (n) => new Intl.NumberFormat('fr-CM').format(n) + ' FCFA'

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function generateInvoicePDF(facture, entreprise) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Charger logo et cachet
  const [logoImg, cachetImg] = await Promise.all([
    loadImage(entreprise.logo),
    loadImage(entreprise.cachet),
  ])

  // Header background
  doc.setFillColor(27, 58, 92)
  doc.rect(0, 0, pageWidth, 42, 'F')

  // Logo (top left) ou texte entreprise
  let textStartX = 15
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 12, 6, 28, 28)
      doc.addImage(logoImg, 'JPG', 12, 6, 28, 28)
    } catch (e) {
      // Fallback: essayer comme JPEG
      try {
        doc.addImage(logoImg, 'JPEG', 12, 6, 28, 28)
      } catch (e2) { /* ignore */ }
    }
    textStartX = 46
  }

  // Nom entreprise
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(logoImg ? 16 : 20)
  doc.setFont('helvetica', 'bold')
  doc.text(entreprise.nom || 'Mon Entreprise', textStartX, 16)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(entreprise.adresse || '', textStartX, 22)
  doc.text(entreprise.telephone || '', textStartX, 27)
  doc.text(entreprise.email || '', textStartX, 32)
  if (entreprise.nrcc) {
    doc.text('NRCC: ' + entreprise.nrcc, textStartX, 37)
  }

  // Type badge (top right)
  const typeLabel = facture.type === 'devis' ? 'DEVIS' : 'FACTURE'
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(typeLabel, pageWidth - 15, 20, { align: 'right' })

  // Infos facture
  let y = 55
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')

  doc.text('Numéro:', 15, y)
  doc.text('Date:', 15, y + 7)
  doc.text('Échéance:', 15, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.text(facture.numero, 55, y)
  doc.text(new Date(facture.date).toLocaleDateString('fr-FR'), 55, y + 7)
  doc.text(new Date(facture.echeance).toLocaleDateString('fr-FR'), 55, y + 14)

  // Client info
  doc.setFont('helvetica', 'bold')
  doc.text('Facturer à:', 120, y)
  doc.setFont('helvetica', 'normal')
  doc.text(facture.clientNom, 120, y + 7)

  // Ligne séparatrice
  y = 80
  doc.setDrawColor(27, 58, 92)
  doc.setLineWidth(0.5)
  doc.line(15, y, pageWidth - 15, y)

  // Table des articles
  y += 8
  const tableData = facture.items.map((item, i) => [
    i + 1,
    item.description,
    item.quantite,
    formatFCFA(item.prixUnitaire),
    formatFCFA(item.quantite * item.prixUnitaire)
  ])

  doc.autoTable({
    startY: y,
    head: [['#', 'Description', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [27, 58, 92],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [33, 37, 41],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  })

  // Totaux
  y = doc.lastAutoTable.finalY + 10
  const totalsX = pageWidth - 15

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  doc.text('Sous-total:', totalsX - 60, y)
  doc.text(formatFCFA(facture.total), totalsX, y, { align: 'right' })

  y += 8
  doc.setDrawColor(27, 58, 92)
  doc.setLineWidth(0.3)
  doc.line(totalsX - 60, y, totalsX, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTAL:', totalsX - 60, y)
  doc.text(formatFCFA(facture.total), totalsX, y, { align: 'right' })

  if (facture.paye > 0) {
    y += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(76, 175, 80)
    doc.text('Payé:', totalsX - 60, y)
    doc.text(formatFCFA(facture.paye), totalsX, y, { align: 'right' })
  }

  if (facture.reste > 0) {
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(244, 67, 54)
    doc.text('Reste à payer:', totalsX - 60, y)
    doc.text(formatFCFA(facture.reste), totalsX, y, { align: 'right' })
  }

  // Cachet (bottom right)
  if (cachetImg) {
    try {
      doc.addImage(cachetImg, 'PNG', pageWidth - 55, pageHeight - 65, 40, 40)
    } catch (e) {
      try {
        doc.addImage(cachetImg, 'JPEG', pageWidth - 55, pageHeight - 65, 40, 40)
      } catch (e2) { /* ignore */ }
    }
  }

  // Pied de page
  const footerY = pageHeight - 15
  doc.setTextColor(173, 181, 189)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Généré par Koleya - ERP PME', 15, footerY)
  doc.text(new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR'), pageWidth - 15, footerY, { align: 'right' })

  // Sauvegarde
  const filename = `${facture.numero}.pdf`
  doc.save(filename)
}

// =============================================
// Génération générique d'un PDF en tableau (clients, stock, employés, rapports…)
// - columns : [{ header, key, format? }]
// - rows    : tableau d'objets
// - foot    : (optionnel) [{ header, value }] — ligne de totaux
// =============================================
export async function generateTablePDF({ titre, sousTitre, columns, rows, foot, filename, entreprise }) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const [logoImg] = await Promise.all([loadImage(entreprise?.logo)])

  // Header entreprise (même style que la facture)
  doc.setFillColor(27, 58, 92)
  doc.rect(0, 0, pageWidth, 42, 'F')
  let textStartX = 15
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', 12, 6, 28, 28)
      doc.addImage(logoImg, 'JPG', 12, 6, 28, 28)
    } catch (e) {
      try { doc.addImage(logoImg, 'JPEG', 12, 6, 28, 28) } catch (e2) { /* ignore */ }
    }
    textStartX = 46
  }
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(entreprise?.nom ? 16 : 18)
  doc.setFont('helvetica', 'bold')
  doc.text(entreprise?.nom || 'Koleya', textStartX, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (entreprise?.adresse) doc.text(entreprise.adresse, textStartX, 22)
  if (entreprise?.telephone) doc.text('Tél : ' + entreprise.telephone, textStartX, 27)
  if (entreprise?.email) doc.text(entreprise.email, textStartX, 32)

  // Titre + date
  let y = 54
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(titre, 15, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  const now = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR')
  doc.text('Généré le ' + now, 15, y + 6)
  let tableStartY = y + 10
  if (sousTitre) {
    doc.setTextColor(60, 60, 60)
    doc.text(sousTitre, 15, y + 12)
    tableStartY = y + 16
  }

  const footRows = foot ? [foot.map((f) => (typeof f.value === 'string' ? f.value : f.header))] : undefined

  doc.autoTable({
    startY: tableStartY,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => (c.format ? c.format(r[c.key], r) : (r[c.key] ?? '')))),
    foot: footRows,
    theme: 'grid',
    headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2, textColor: [33, 37, 41] },
    footStyles: { fillColor: [240, 243, 248], textColor: [27, 58, 92], fontSize: 9, fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
    didDrawPage: (data) => {
      const h = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(173, 181, 189)
      doc.setFont('helvetica', 'normal')
      doc.text('Généré par Koleya - ERP PME', 15, h - 10)
      doc.text(String(data.pageNumber) + ' / ' + data.pageCount, pageWidth - 15, h - 10, { align: 'right' })
    },
  })

  doc.save(`${filename || titre}.pdf`)
}

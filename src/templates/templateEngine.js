import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Moteur de templates PDF pour Koleya
 * Genere des documents professionnels basees sur les templates du dossier Formulaires + Templates
 */

const STYLES = {
  'classique-bleu': { header: [27, 58, 92], accent: [41, 128, 185], text: [33, 37, 41], light: [240, 244, 248] },
  'classique-blanc': { header: [255, 255, 255], accent: [27, 58, 92], text: [33, 37, 41], light: [248, 249, 250] },
  'moderne-rouge': { header: [192, 57, 43], accent: [231, 76, 60], text: [33, 37, 41], light: [253, 237, 236] },
  'mono-noir': { header: [33, 37, 41], accent: [73, 80, 87], text: [33, 37, 41], light: [248, 249, 250] },
  'orange-militaire': { header: [230, 126, 34], accent: [211, 84, 0], text: [33, 37, 41], light: [253, 245, 230] },
  'bande-bleu': { header: [41, 128, 185], accent: [52, 152, 219], text: [33, 37, 41], light: [235, 245, 251] },
}

const TYPE_LABELS = {
  'facture': 'FACTURE',
  'facture_fiscale': 'FACTURE FISCALE',
  'facture_proforma': 'FACTURE PROFORMA',
  'recu': 'REÇU',
  'recu_vente': 'REÇU DE VENTE',
  'recu_caisse': 'REÇU DE CAISSE',
  'devis': 'DEVIS',
  'note_credit': 'NOTE DE CRÉDIT',
  'bon_commande': 'BON DE COMMANDE',
  'bon_livraison': 'BON DE LIVRAISON',
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Genere un document PDF a partir des donnees et du style selectionne
 */
export async function genererDocument(data, entreprise) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const style = STYLES[data.template] || STYLES['classique-bleu']
  const typeLabel = TYPE_LABELS[data.type] || 'DOCUMENT'
  const devise = data.devise || 'XAF'

  // Charger logo et cachet
  const [logoImg, cachetImg] = await Promise.all([
    loadImage(entreprise?.logo),
    loadImage(entreprise?.cachet),
  ])

  // === EN-TECOLE ===
  doc.setFillColor(...style.header)
  doc.rect(0, 0, pageWidth, 42, 'F')

  // Logo
  let textStartX = 15
  if (logoImg) {
    try { doc.addImage(logoImg, 'PNG', 12, 6, 28, 28) } catch (e) { try { doc.addImage(logoImg, 'JPEG', 12, 6, 28, 28) } catch (e2) {} }
    textStartX = 46
  }

  // Nom entreprise
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(logoImg ? 16 : 18)
  doc.setFont('helvetica', 'bold')
  doc.text(data.entreprise_nom || entreprise?.nom || '', textStartX, 16)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(data.entreprise_adresse || entreprise?.adresse || '', textStartX, 23)
  doc.text(entreprise?.telephone || '', textStartX, 29)
  doc.text(entreprise?.email || '', textStartX, 35)

  // Type de document
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(typeLabel, pageWidth - 15, 20, { align: 'right' })

  // === ZONE DE DONNEES ===
  let y = 50

  // Numero et date
  doc.setTextColor(...style.text)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Numero :', 15, y)
  doc.text('Date :', 15, y + 7)
  if (typeConfig(data.type).showExpiry && data.echeance) {
    doc.text('Echeance :', 15, y + 14)
  }
  if (typeConfig(data.type).showCommande && data.commande_numero) {
    doc.text('Commande n° :', 15, y + (typeConfig(data.type).showExpiry ? 21 : 14))
  }

  doc.setFont('helvetica', 'normal')
  doc.text(data.numero || '', 50, y)
  doc.text(data.date || new Date().toISOString().slice(0, 10), 50, y + 7)
  if (typeConfig(data.type).showExpiry && data.echeance) {
    doc.text(data.echeance, 50, y + 14)
  }
  if (typeConfig(data.type).showCommande && data.commande_numero) {
    doc.text(data.commande_numero, 50, y + (typeConfig(data.type).showExpiry ? 21 : 14))
  }

  // Destinataire
  const destLabel = data.type === 'recu_caisse' ? 'Recu par' : data.type === 'bon_commande' ? 'Vendeur' : data.type === 'bon_livraison' ? 'Livre a' : data.type === 'recu' ? 'A' : 'Facture a'
  doc.setFont('helvetica', 'bold')
  doc.text(destLabel + ' :', 120, y)
  doc.setFont('helvetica', 'normal')
  if (data.destinataire_adresse) {
    const lignes = data.destinataire_adresse.split('\n')
    lignes.forEach((ligne, i) => {
      doc.text(ligne, 120, y + 7 + (i * 5))
    })
  }

  // Envoye a
  if (typeConfig(data.type).showEnvoye && data.envoye_a) {
    const envY = y + (typeConfig(data.type).showExpiry ? 35 : 28)
    doc.setFont('helvetica', 'bold')
    doc.text('Envoye a :', 15, envY)
    doc.setFont('helvetica', 'normal')
    doc.text(data.envoye_a, 50, envY)
  }

  // === LIGNE SEPATRICE ===
  y += (typeConfig(data.type).showExpiry ? 40 : 33)
  doc.setDrawColor(...style.accent)
  doc.setLineWidth(0.5)
  doc.line(15, y, pageWidth - 15, y)

  // === TABLEAU DES ARTICLES ===
  y += 5
  const tableData = (data.items || []).map((item, i) => {
    const montant = item.quantite * item.prix_unitaire
    const taxe = montant * ((item.taxe || 0) / 100)
    const ligne = [i + 1, item.designation, item.quantite, formatFCFA(item.prix_unitaire, devise)]
    if (typeConfig(data.type).showTaxe) {
      ligne.push(item.taxe ? `${item.taxe}%` : '-')
      ligne.push(formatFCFA(montant + taxe, devise))
    } else {
      ligne.push(formatFCFA(montant, devise))
    }
    return ligne
  })

  const headCols = ['#', 'Designation', 'Qte', 'Prix Unit.']
  if (typeConfig(data.type).showTaxe) {
    headCols.push('Taxe', 'Montant')
  } else {
    headCols.push('Montant')
  }

  doc.autoTable({
    startY: y,
    head: [headCols],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: style.header, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: style.text },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  })

  // === TOTAUX ===
  y = doc.lastAutoTable.finalY + 8
  const totalsX = pageWidth - 15

  doc.setTextColor(...style.text)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Total HT :', totalsX - 50, y)
  doc.text(formatFCFA(data.totalHT || 0, devise), totalsX, y, { align: 'right' })

  if (data.totalTaxes > 0) {
    y += 6
    doc.text('Taxes :', totalsX - 50, y)
    doc.text(formatFCFA(data.totalTaxes, devise), totalsX, y, { align: 'right' })
  }

  y += 8
  doc.setDrawColor(...style.accent)
  doc.setLineWidth(0.8)
  doc.line(totalsX - 50, y, totalsX, y)

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL :', totalsX - 50, y)
  doc.text(formatFCFA(data.totalTTC || 0, devise), totalsX, y, { align: 'right' })

  // === CONDITIONS ===
  y += 12
  if (data.conditions) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Conditions et modalites de paiement :', 15, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const condLignes = doc.splitTextToSize(data.conditions, pageWidth - 30)
    doc.text(condLignes, 15, y)
    y += condLignes.length * 4 + 5
  }

  // === SIGNATURE ===
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Signature :', pageWidth - 80, pageHeight - 35)
  doc.setDrawColor(200, 200, 200)
  doc.line(pageWidth - 80, pageHeight - 33, pageWidth - 15, pageHeight - 33)

  // === CACHET ===
  if (cachetImg) {
    try { doc.addImage(cachetImg, 'PNG', pageWidth - 55, pageHeight - 65, 40, 40) } catch (e) { try { doc.addImage(cachetImg, 'JPEG', pageWidth - 55, pageHeight - 65, 40, 40) } catch (e2) {} }
  }

  // === PIED DE PAGE ===
  doc.setTextColor(170, 170, 170)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(`Koleya — ${typeLabel}`, 15, pageHeight - 10)
  doc.text(new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR'), pageWidth - 15, pageHeight - 10, { align: 'right' })

  // Telecharger
  const filename = `${data.numero || 'document'}.pdf`
  doc.save(filename)
  return true
}

function typeConfig(type) {
  const configs = {
    facture: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    facture_fiscale: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    facture_proforma: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    recu: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    recu_vente: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    recu_caisse: { showExpiry: false, showCommande: false, showEnvoye: false, showTaxe: false, hasTable: true },
    devis: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    note_credit: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
    bon_commande: { showExpiry: false, showCommande: false, showEnvoye: true, showTaxe: true, hasTable: true },
    bon_livraison: { showExpiry: true, showCommande: true, showEnvoye: true, showTaxe: true, hasTable: true },
  }
  return configs[type] || configs.facture
}

const DEVISES = {
  'XAF': 'FCFA', 'XOF': 'FCFA', 'EUR': '€', 'USD': '$', 'NGN': '₦',
}
function formatFCFA(n, devise = 'XAF') {
  const sym = DEVISES[devise] || 'FCFA'
  const montant = new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0))
  return (devise === 'XAF' || devise === 'XOF') ? `${montant} ${sym}` : `${sym} ${montant}`
}

import jsPDF from 'jspdf'
import 'jspdf-autotable'

// =============================================
// Moteur de generation PDF pour les 14 documents RH
// =============================================

function formatFCFA(n) {
  return new Intl.NumberFormat('fr-CM').format(Math.round(n || 0)) + ' FCFA'
}

function formatDateFR(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return String(d)
  return dt.toLocaleDateString('fr-FR')
}

// Charger une image (logo) de façon asynchrone
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// =============================================
// CALCULS PAIE (règles Cameroun)
// =============================================
export function calculerPaie(salaireBrut, { primes = 0, heuresSup = 0 } = {}) {
  const base = salaireBrut + primes + heuresSup
  const cnpsSalariale = Math.round(base * 0.042 * 100) / 100
  const cnpsPatronale = Math.round(base * 0.0865 * 100) / 100
  const irpp = base > 200000 ? Math.round((base - 200000) * 0.10 * 100) / 100 : 0
  const cac = Math.round(base * 0.025 * 100) / 100
  const net = Math.round((base - cnpsSalariale - irpp - cac) * 100) / 100
  return { base, cnpsSalariale, cnpsPatronale, irpp, cac, net }
}

// =============================================
// EN-TÊTE COMMUN
// =============================================
async function header(doc, entreprise, titre) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFillColor(27, 58, 92)
  doc.rect(0, 0, pageWidth, 34, 'F')
  const [logo] = await Promise.all([loadImage(entreprise?.logo)])
  let textX = 15
  if (logo) {
    try { doc.addImage(logo, 'PNG', 12, 6, 24, 24) } catch (e) { try { doc.addImage(logo, 'JPEG', 12, 6, 24, 24) } catch (e2) {} }
    textX = 44
  }
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(entreprise?.nom || 'Mon Entreprise', textX, 15)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  if (entreprise?.adresse) doc.text(entreprise.adresse, textX, 21)
  if (entreprise?.telephone) doc.text(entreprise.telephone, textX, 26)
  if (entreprise?.email) doc.text(entreprise.email, textX, 31)

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(titre, pageWidth - 15, 20, { align: 'right' })
}

function footer(doc) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFontSize(7)
  doc.setTextColor(173, 181, 189)
  doc.setFont('helvetica', 'normal')
  doc.text('Document généré par Koleya — ERP PME', 15, pageHeight - 10)
  doc.text(formatDateFR(new Date()), pageWidth - 15, pageHeight - 10, { align: 'right' })
}

// Aide : champ label/valeur
function ligne(doc, label, valeur, y, xLabel = 15, xVal = 70) {
  doc.setFont('helvetica', 'bold')
  doc.text(label, xLabel, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(valeur ?? '—'), xVal, y)
  return y + 7
}

// =============================================
// GENERATEUR PRINCIPAL
// =============================================
export async function genererDocumentRH(typeDocument, employe = {}, entreprise = {}, variables = {}) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const E = { ...employe, ...variables }
  const nomComplet = [E.civilite, E.prenom, E.nom_usage || E.nom].filter(Boolean).join(' ').trim() || E.nom || '—'
  let y = 48

  switch (typeDocument) {
    case 'fiche_identification': {
      await header(doc, entreprise, 'FICHE D\'IDENTIFICATION')
      const sections = [
        ['IDENTITÉ', [['Nom', E.nom], ['Prénom', E.prenom], ['Civilité', E.civilite], ['Nom d\'usage', E.nom_usage], ['Date de naissance', formatDateFR(E.date_naissance)], ['Lieu de naissance', E.lieu_naissance], ['Nationalité', E.nationalite], ['Matricule', E.matricule]]],
        ['SITUATION FAMILIALE', [['Situation', E.situation_familiale], ['Nb d\'enfants', E.nb_enfants], ['N° sécurité sociale', E.num_secu], ['IBAN', E.iban], ['BIC', E.bic]]],
        ['CONTACT', [['Adresse', E.adresse], ['Téléphone', E.telephone], ['Email', E.email], ['Email pro', E.email_pro], ['Téléphone pro', E.telephone_pro]]],
        ['URGENCE', [['Contact', E.contact_urgence], ['Lien de parenté', E.lien_parente], ['Tél. urgence', E.tel_urgence]]],
        ['SITUATION PRO', [['Poste', E.poste], ['Manager N+1', E.manager_n1], ['Site de travail', E.site_travail], ['Date embauche', formatDateFR(E.date_embauche)]]],
      ]
      for (const [titre, champs] of sections) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
        doc.setTextColor(27, 58, 92)
        doc.text(titre, 15, y)
        y += 4
        doc.setDrawColor(200, 200, 200); doc.line(15, y, pageWidth - 15, y); y += 6
        doc.setTextColor(0, 0, 0); doc.setFontSize(9)
        for (const [l, v] of champs) y = ligne(doc, l + ' :', v, y)
        y += 4
      }
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
      doc.text('Visa des Ressources Humaines :', 15, y)
      doc.line(60, y - 2, pageWidth - 15, y - 2)
      break
    }
    case 'contrat_travail': {
      await header(doc, entreprise, 'CONTRAT DE TRAVAIL')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Entre :', entreprise?.nom || '—', y)
      y = ligne(doc, 'Et', nomComplet, y)
      y = ligne(doc, 'Type de contrat :', E.type_contrat || 'CDI', y)
      y = ligne(doc, 'Poste :', E.poste, y)
      y = ligne(doc, 'Date de début :', formatDateFR(E.date_debut), y)
      y = ligne(doc, 'Date de fin :', formatDateFR(E.date_fin), y)
      y = ligne(doc, 'Salaire de base :', formatFCFA(E.salaire_base || E.salaire), y)
      y = ligne(doc, 'Heures / semaine :', E.heures_semaine || 40, y)
      y = ligne(doc, 'Statut cadre :', E.statut_cadre ? 'Oui' : 'Non', y)
      y += 6
      const texte = `Le présent contrat est régi par le droit du travail en vigueur. L'employé s'engage à exercer les fonctions de ${E.poste || 'son poste'} avec loyauté et assiduité.`
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      const wrapped = doc.splitTextToSize(texte, pageWidth - 30)
      doc.text(wrapped, 15, y); y += wrapped.length * 5 + 10
      doc.setFont('helvetica', 'bold'); doc.text('Signatures', 15, y); y += 8
      doc.setFont('helvetica', 'normal'); doc.text('L\'Employeur', 15, y); doc.text('L\'Employé', pageWidth / 2, y)
      doc.line(15, y + 14, pageWidth / 2 - 15, y + 14); doc.line(pageWidth / 2, y + 14, pageWidth - 15, y + 14)
      break
    }
    case 'avenant_contrat': {
      await header(doc, entreprise, 'AVENANT AU CONTRAT')
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Contrat de référence :', E.contrat_reference || '—', y)
      y = ligne(doc, 'Date d\'effet :', formatDateFR(E.date_effet), y)
      y = ligne(doc, 'Modification :', E.modification, y)
      y += 6
      const texte = `Le présent avenant vient modifier le contrat de travail susvisé à compter du ${formatDateFR(E.date_effet)}.`
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.text(doc.splitTextToSize(texte, pageWidth - 30), 15, y)
      break
    }
    case 'attestation_travail': {
      await header(doc, entreprise, 'ATTESTATION DE TRAVAIL')
      doc.setFontSize(10)
      const texte = `Nous soussignés ${entreprise?.nom || '—'}, certifions que ${nomComplet} travaille au sein de notre structure depuis le ${formatDateFR(E.date_debut)} au poste de ${E.poste || '—'}.`
      doc.setTextColor(0, 0, 0)
      doc.text(doc.splitTextToSize(texte, pageWidth - 30), 15, y); y += 30
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      y = ligne(doc, 'Fait à :', E.ville || 'Douala', y)
      y = ligne(doc, 'Le :', formatDateFR(E.date_jour || new Date()), y)
      y += 6
      doc.setFont('helvetica', 'bold'); doc.text('Cachet et signature', pageWidth - 80, y)
      doc.line(pageWidth - 80, y + 14, pageWidth - 15, y + 14)
      break
    }
    case 'certificat_travail': {
      await header(doc, entreprise, 'CERTIFICAT DE TRAVAIL')
      doc.setFontSize(10)
      const texte = `Nous certifions que ${nomComplet} a travaillé dans notre entreprise du ${formatDateFR(E.date_entree)} au ${formatDateFR(E.date_sortie)} aux postes de ${E.postes_occupes || E.poste || '—'}.`
      doc.setTextColor(0, 0, 0)
      doc.text(doc.splitTextToSize(texte, pageWidth - 30), 15, y); y += 28
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      const lib = `L'intéressé(e) est libre de tout engagement vis-à-vis de notre société.`
      doc.text(doc.splitTextToSize(lib, pageWidth - 30), 15, y); y += 14
      doc.setFont('helvetica', 'bold'); doc.text('Cachet et signature', pageWidth - 80, y)
      doc.line(pageWidth - 80, y + 14, pageWidth - 15, y + 14)
      break
    }
    case 'solde_tout_compte': {
      await header(doc, entreprise, 'SOLDE DE TOUT COMPTE')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Salaire prorata :', formatFCFA(E.salaire_prorata), y)
      y = ligne(doc, 'Indemnités congés :', formatFCFA(E.indemnite_conges), y)
      y = ligne(doc, 'Indemnité de rupture :', formatFCFA(E.indemnite_rupture), y)
      y += 4
      doc.setDrawColor(27, 58, 92); doc.setLineWidth(0.5); doc.line(15, y, pageWidth - 15, y); y += 8
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text('TOTAL NET :', 15, y)
      doc.text(formatFCFA((Number(E.salaire_prorata) || 0) + (Number(E.indemnite_conges) || 0) + (Number(E.indemnite_rupture) || 0)), pageWidth - 15, y, { align: 'right' })
      y += 12
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.text('L\'employé reconnaît avoir reçu l\'intégralité des sommes lui revenant.', 15, y)
      break
    }
    case 'bulletin_paie': {
      await header(doc, entreprise, 'FICHE DE PAIE')
      const paie = calculerPaie(Number(E.salaire || E.salaire_base) || 0, { primes: Number(E.primes) || 0, heuresSup: Number(E.heures_sup) || 0 })
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Poste :', E.poste, y)
      y = ligne(doc, 'Période :', E.periode || formatDateFR(new Date()), y)
      y += 4
      doc.setDrawColor(27, 58, 92); doc.line(15, y, pageWidth - 15, y); y += 8
      doc.setFont('helvetica', 'bold'); doc.text('GAINS', 15, y); doc.text('RETENUES', pageWidth / 2, y); y += 6
      doc.setFont('helvetica', 'normal')
      doc.text('Salaire de base : ' + formatFCFA(paie.base), 15, y)
      doc.text('CNPS (4,2%) : -' + formatFCFA(paie.cnpsSalariale), pageWidth / 2, y); y += 6
      doc.text('Primes : ' + formatFCFA(Number(E.primes) || 0), 15, y)
      doc.text('IRPP (10%) : -' + formatFCFA(paie.irpp), pageWidth / 2, y); y += 6
      doc.text('Heures sup. : ' + formatFCFA(Number(E.heures_sup) || 0), 15, y)
      doc.text('CAC (2,5%) : -' + formatFCFA(paie.cac), pageWidth / 2, y); y += 10
      doc.setDrawColor(200, 200, 200); doc.line(15, y, pageWidth - 15, y); y += 8
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text('NET À PAYER :', 15, y)
      doc.text(formatFCFA(paie.net), pageWidth - 15, y, { align: 'right' })
      break
    }
    case 'ordre_mission': {
      await header(doc, entreprise, 'ORDRE DE MISSION')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Objet :', E.objet, y)
      y = ligne(doc, 'Destination :', E.destination, y)
      y = ligne(doc, 'Période :', `${formatDateFR(E.date_debut)} → ${formatDateFR(E.date_fin)}`, y)
      y = ligne(doc, 'Motif :', E.motif, y)
      y = ligne(doc, 'Moyen de transport :', E.moyen_transport, y)
      break
    }
    case 'note_frais': {
      await header(doc, entreprise, 'NOTE DE FRAIS')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Date de soumission :', formatDateFR(E.date_soumission), y)
      y += 4
      const lignes = Array.isArray(E.lignes) ? E.lignes : []
      doc.autoTable({
        startY: y,
        head: [['Date', 'Catégorie', 'Description', 'Montant']],
        body: lignes.map(l => [formatDateFR(l.date_frais), l.categorie || '—', l.description || '—', formatFCFA(l.montant)]),
        theme: 'grid',
        headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 },
      })
      y = doc.lastAutoTable.finalY + 8
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text('TOTAL :', pageWidth - 80, y)
      doc.text(formatFCFA(lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0)), pageWidth - 15, y, { align: 'right' })
      break
    }
    case 'demande_conge': {
      await header(doc, entreprise, 'DEMANDE DE CONGÉ')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Type de congé :', E.type_conge, y)
      y = ligne(doc, 'Du :', formatDateFR(E.date_debut), y)
      y = ligne(doc, 'Au :', formatDateFR(E.date_fin), y)
      y = ligne(doc, 'Nombre de jours :', E.nb_jours, y)
      y = ligne(doc, 'Solde avant :', E.solde_avant, y)
      y = ligne(doc, 'Solde après :', E.solde_apres, y)
      y += 6
      doc.setFont('helvetica', 'normal'); doc.text('Approbation (N+1) :', 15, y)
      doc.line(80, y - 2, pageWidth - 15, y - 2)
      break
    }
    case 'entretien_annuel': {
      await header(doc, entreprise, 'ENTRETIEN ANNUEL')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Période :', E.periode, y)
      y += 4
      const champs = [['Bilan', E.bilan], ['Objectifs', E.objectifs], ['Formations', E.formations], ['Commentaires', E.commentaires]]
      for (const [l, v] of champs) {
        doc.setFont('helvetica', 'bold'); doc.text(l + ' :', 15, y); y += 5
        doc.setFont('helvetica', 'normal')
        doc.text(doc.splitTextToSize(String(v || '—'), pageWidth - 30), 15, y); y += (doc.splitTextToSize(String(v || '—'), pageWidth - 30).length * 4) + 4
      }
      break
    }
    case 'fiche_onboarding': {
      await header(doc, entreprise, 'FICHE D\'ONBOARDING')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Nom :', nomComplet, y)
      y = ligne(doc, 'Email :', E.email, y)
      y = ligne(doc, 'Téléphone :', E.telephone, y)
      y = ligne(doc, 'Poste :', E.poste, y)
      y = ligne(doc, 'Date d\'embauche :', formatDateFR(E.date_embauche), y)
      y = ligne(doc, 'Contact urgence :', E.contact_urgence, y)
      y = ligne(doc, 'N° sécu :', E.num_secu, y)
      y = ligne(doc, 'IBAN :', E.iban, y)
      break
    }
    case 'visite_medicale': {
      await header(doc, entreprise, 'VISITE MÉDICALE')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Date visite :', formatDateFR(E.date_visite), y)
      y = ligne(doc, 'Centre :', E.centre_medical, y)
      y = ligne(doc, 'Médecin :', E.medecin, y)
      y = ligne(doc, 'Aptitude :', E.aptitude, y)
      y = ligne(doc, 'Restrictions :', E.restrictions, y)
      y = ligne(doc, 'Prochaine visite :', formatDateFR(E.prochaine_visite), y)
      break
    }
    case 'recu_materiel': {
      await header(doc, entreprise, 'REÇU DE MATÉRIEL')
      doc.setFontSize(9); doc.setTextColor(0, 0, 0)
      y = ligne(doc, 'Employé :', nomComplet, y)
      y = ligne(doc, 'Date de mise à disposition :', formatDateFR(E.date_mise_a_disposition), y)
      y += 4
      const lignes = Array.isArray(E.lignes) ? E.lignes : []
      doc.autoTable({
        startY: y,
        head: [['Type', 'Marque', 'N° série', 'Description']],
        body: lignes.map(l => [l.type_materiel || '—', l.marque || '—', l.numero_serie || '—', l.description || '—']),
        theme: 'grid',
        headStyles: { fillColor: [27, 58, 92], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 15, right: 15 },
      })
      y = doc.lastAutoTable.finalY + 10
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
      doc.text('Bon pour réception,', 15, y)
      doc.line(15, y + 14, pageWidth - 15, y + 14)
      break
    }
    default: {
      await header(doc, entreprise, 'DOCUMENT RH')
      doc.setFontSize(10); doc.setTextColor(0, 0, 0)
      doc.text('Type de document non reconnu : ' + typeDocument, 15, y)
    }
  }

  footer(doc)
  const filename = `${typeDocument}-${(E.nom || 'document').replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
  return true
}

export default genererDocumentRH

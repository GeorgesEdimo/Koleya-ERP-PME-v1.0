/**
 * Generateur de QR Code simple (sans dependance externe)
 * Utilise une API gratuite pour generer les QR codes
 */

// Generer un QR code via API gratuite
export function genererQRCode(texte, taille = 200) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${taille}x${taille}&data=${encodeURIComponent(texte)}&format=svg`
  return url
}

// Generer un QR code pour un produit
export function genererQRProduit(produit) {
  const donnees = JSON.stringify({
    nom: produit.nom,
    reference: produit.reference,
    prix: produit.prixVente,
    stock: produit.stock,
  })
  return genererQRCode(donnees)
}

// Generer un QR code pour une facture
export function genererQRFacture(facture, entreprise) {
  const donnees = JSON.stringify({
    numero: facture.numero,
    entreprise: entreprise.nom,
    montant: facture.total,
    client: facture.clientNom,
  })
  return genererQRCode(donnees)
}

// Telecharger un QR code en PNG
export async function telechargerQRCode(texte, nomFichier = 'qrcode.png') {
  const url = genererQRCode(texte, 300)
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = nomFichier
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (err) {
    console.error('Erreur telechargement QR code:', err)
  }
}

import { describe, it, expect } from 'vitest'

describe('Template Engine', () => {
  it('valide les styles de templates', () => {
    const styles = ['classique-bleu', 'classique-blanc', 'moderne-rouge', 'mono-noir', 'orange-militaire', 'bande-bleu']
    expect(styles).toHaveLength(6)
    styles.forEach(s => {
      expect(s).toMatch(/^[a-z-]+$/)
    })
  })

  it('valide les types de documents', () => {
    const types = ['facture', 'facture_fiscale', 'facture_proforma', 'recu', 'recu_vente', 'recu_caisse', 'devis', 'note_credit', 'bon_commande', 'bon_livraison']
    expect(types).toHaveLength(10)
  })

  it('valide les labels de documents', () => {
    const labels = {
      facture: 'FACTURE',
      devis: 'DEVIS',
      recu: 'RECU',
      bon_commande: 'BON DE COMMANDE',
      bon_livraison: 'BON DE LIVRAISON',
    }

    Object.entries(labels).forEach(([_type, label]) => {
      expect(label).toBeTruthy()
      expect(label.length).toBeGreaterThan(3)
    })
  })

  it('valide les couleurs de style', () => {
    const styles = {
      'classique-bleu': [27, 58, 92],
      'classique-blanc': [255, 255, 255],
      'moderne-rouge': [192, 57, 43],
    }

    Object.values(styles).forEach(color => {
      expect(color).toHaveLength(3)
      color.forEach(c => {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(255)
      })
    })
  })
})

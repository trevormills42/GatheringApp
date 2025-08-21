import { useMemo } from 'react'
import { DeckCard } from '@/lib/supabase'

export interface DeckStats {
  avgCMC: number
  creatures: number
  lands: number
  totalCards: number
  colorDistribution: { [color: string]: number }
  typeDistribution: { [type: string]: number }
  manaCurve: { [cmc: number]: number }
}

const parseCMC = (manaCost: string): number => {
  if (!manaCost) return 0

  let cmc = 0
  const matches = manaCost.match(/{[^}]+}/g)

  if (matches) {
    matches.forEach((match) => {
      const content = match.replace(/[{}]/g, '')
      if (/^\d+$/.test(content)) {
        cmc += parseInt(content)
      } else {
        // Each colored mana symbol adds 1 to CMC
        cmc += 1
      }
    })
  }

  return cmc
}

export function useDeckStats(cards: DeckCard[]): DeckStats {
  return useMemo(() => {
    let totalCMC = 0
    let nonLandCards = 0
    let creatures = 0
    let lands = 0
    let totalCards = 0
    
    const colorDistribution: { [color: string]: number } = { 
      W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 
    }
    const typeDistribution: { [type: string]: number } = {
      Creature: 0,
      Instant: 0,
      Sorcery: 0,
      Enchantment: 0,
      Artifact: 0,
      Planeswalker: 0,
      Land: 0,
      Other: 0
    }
    const manaCurve: { [cmc: number]: number } = {}

    cards.forEach((card) => {
      const quantity = card.quantity
      totalCards += quantity
      const isLand = card.type_line.toLowerCase().includes('land')
      const cmc = parseCMC(card.mana_cost)

      // Mana curve (for non-lands)
      if (!isLand) {
        manaCurve[cmc] = (manaCurve[cmc] || 0) + quantity
        totalCMC += cmc * quantity
        nonLandCards += quantity
      }

      // Count card types
      const typeLine = card.type_line.toLowerCase()
      if (typeLine.includes('creature')) {
        creatures += quantity
        typeDistribution.Creature += quantity
      } else if (typeLine.includes('instant')) {
        typeDistribution.Instant += quantity
      } else if (typeLine.includes('sorcery')) {
        typeDistribution.Sorcery += quantity
      } else if (typeLine.includes('enchantment')) {
        typeDistribution.Enchantment += quantity
      } else if (typeLine.includes('artifact')) {
        typeDistribution.Artifact += quantity
      } else if (typeLine.includes('planeswalker')) {
        typeDistribution.Planeswalker += quantity
      } else if (isLand) {
        lands += quantity
        typeDistribution.Land += quantity
      } else {
        typeDistribution.Other += quantity
      }

      // Count color distribution and colorless mana symbols
      const manaCost = card.mana_cost || ''
      
      // Count colored mana symbols (W, U, B, R, G)
      const colors = ['W', 'U', 'B', 'R', 'G']
      colors.forEach((color) => {
        const matches = manaCost.match(new RegExp(`{[^}]*${color}[^}]*}`, 'g'))
        if (matches) {
          colorDistribution[color] += matches.length * quantity
        }
      })

      // Determine if this is a colorless card by checking color identity
      const isColorlessCard = !card.colors || card.colors.length === 0
      
      // Count explicit colorless mana symbols ({C})
      const explicitColorlessMatches = manaCost.match(/{C}/g)
      const explicitColorlessMana = explicitColorlessMatches ? explicitColorlessMatches.length : 0
      
      // Count generic mana costs ({1}, {2}, {3}, etc.)
      const genericManaMatches = manaCost.match(/{[0-9]+}/g)
      let genericManaCost = 0
      if (genericManaMatches) {
        genericManaMatches.forEach((match) => {
          genericManaCost += parseInt(match.replace(/[{}]/g, ''))
        })
      }
      
      // Apply colorless mana counting logic based on card type
      if (isColorlessCard) {
        // For colorless cards: count both {C} symbols and generic costs as colorless mana
        colorDistribution.C += (explicitColorlessMana + genericManaCost) * quantity
      } else {
        // For colored cards: count only explicit {C} symbols as colorless mana
        // Generic costs like {2} in {2}{U} don't represent colorless mana requirement
        colorDistribution.C += explicitColorlessMana * quantity
      }
    })

    return {
      avgCMC: nonLandCards > 0 ? totalCMC / nonLandCards : 0,
      creatures,
      lands,
      totalCards,
      colorDistribution,
      typeDistribution,
      manaCurve
    }
  }, [cards])
}
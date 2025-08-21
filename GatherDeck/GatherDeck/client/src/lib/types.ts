export interface DeckStats {
  totalCards: number;
  avgCMC: number;
  creatureCount: number;
  landCount: number;
  spellCount: number;
  colorDistribution: Record<string, number>;
}

export interface FilterChip {
  id: string;
  label: string;
  type: 'format' | 'type' | 'color' | 'cmc';
  value: string;
  active: boolean;
}

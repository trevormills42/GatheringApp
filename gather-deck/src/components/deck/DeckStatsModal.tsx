import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeckCard } from '@/lib/supabase'
import { DeckStats } from '@/hooks/useDeckStats'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DeckStatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: DeckStats
  cards: DeckCard[]
}

const MANA_COLORS = {
  W: { name: 'White', color: '#FFFBD5' },
  U: { name: 'Blue', color: '#0E68AB' },
  B: { name: 'Black', color: '#150B00' },
  R: { name: 'Red', color: '#D3202A' },
  G: { name: 'Green', color: '#00733E' },
  C: { name: 'Colorless', color: '#CCC2C0' },
}

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347']

export function DeckStatsModal({ open, onOpenChange, stats, cards }: DeckStatsModalProps) {
  // Prepare mana curve data
  const manaCurveData = Object.entries(stats.manaCurve)
    .map(([cmc, count]) => ({ cmc: parseInt(cmc), count }))
    .sort((a, b) => a.cmc - b.cmc)
    .slice(0, 10) // Limit to CMC 0-9

  // Prepare color distribution data
  const colorData = Object.entries(stats.colorDistribution)
    .filter(([, count]) => count > 0)
    .map(([color, count]) => ({
      color,
      name: MANA_COLORS[color as keyof typeof MANA_COLORS]?.name || color,
      count,
      fill: MANA_COLORS[color as keyof typeof MANA_COLORS]?.color || '#ccc'
    }))

  // Prepare card type distribution data
  const typeData = Object.entries(stats.typeDistribution)
    .filter(([, count]) => count > 0)
    .map(([type, count], index) => ({
      type,
      count,
      fill: PIE_COLORS[index % PIE_COLORS.length]
    }))

  const rarityStats = cards.reduce((acc, card) => {
    const rarity = card.rarity || 'common'
    acc[rarity] = (acc[rarity] || 0) + card.quantity
    return acc
  }, {} as Record<string, number>)

  const rarityData = Object.entries(rarityStats)
    .map(([rarity, count], index) => ({
      rarity: rarity.charAt(0).toUpperCase() + rarity.slice(1),
      count,
      fill: PIE_COLORS[index % PIE_COLORS.length]
    }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deck Statistics</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCards}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average CMC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgCMC.toFixed(2)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Creatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.creatures}</div>
                <div className="text-xs text-muted-foreground">
                  {((stats.creatures / stats.totalCards) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.lands}</div>
                <div className="text-xs text-muted-foreground">
                  {((stats.lands / stats.totalCards) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Mana Curve */}
            <Card>
              <CardHeader>
                <CardTitle>Mana Curve</CardTitle>
              </CardHeader>
              <CardContent>
                {manaCurveData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={manaCurveData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cmc" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Color Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {colorData.length > 0 ? (
                  <div className="space-y-2">
                    {colorData.map((color) => (
                      <div key={color.color} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: color.fill }}
                          />
                          <span className="text-sm font-medium">{color.name}</span>
                        </div>
                        <Badge variant="secondary">{color.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No mana symbols in deck
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card Types */}
            <Card>
              <CardHeader>
                <CardTitle>Card Types</CardTitle>
              </CardHeader>
              <CardContent>
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count, percent }) => 
                          `${type}: ${count} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rarity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rarity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {rarityData.length > 0 ? (
                  <div className="space-y-2">
                    {rarityData.map((rarity) => (
                      <div key={rarity.rarity} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: rarity.fill }}
                          />
                          <span className="text-sm font-medium">{rarity.rarity}</span>
                        </div>
                        <Badge variant="secondary">{rarity.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
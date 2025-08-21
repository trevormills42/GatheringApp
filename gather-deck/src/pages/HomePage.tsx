import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Library, Zap, Star, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCardSearch } from '@/hooks/useCardSearch'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { MTGCard } from '@/lib/supabase'

export default function HomePage() {
  const { user } = useAuth()
  const { searchCards, searchResults, isSearching } = useCardSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length >= 3) {
      searchCards(query)
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }

  const handleCardSelect = (card: MTGCard) => {
    setShowSearchResults(false)
    setSearchQuery('')
    // Could navigate to card details or add to a deck
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 rounded-lg flex items-center justify-center">
                <Library className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">GatherDeck</h1>
            </Link>
            {user ? (
              <Link to="/builder">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Deck
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-red-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-red-950/30 -z-10" />
        <div className="container mx-auto max-w-4xl text-center relative">
          <div className="space-y-6">
            <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Zap className="w-3 h-3 mr-1" />
              Professional MTG Deck Builder
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-balance bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 dark:from-blue-100 dark:via-purple-100 dark:to-red-100 bg-clip-text text-transparent">
              Build Your Perfect
              <span className="block">Magic Deck</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              Create, manage, and optimize your Magic: The Gathering decks with our powerful deck builder.
              Search through 25K+ cards, import from any platform, and build winning strategies.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mt-8 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search for Magic cards..." 
                  className="pl-10 h-12 text-base border-2 hover:border-primary/50 focus:border-primary" 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchResults.slice(0, 8).map((card) => (
                    <div 
                      key={card.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() => handleCardSelect(card)}
                    >
                      <div className="flex items-center gap-3">
                        {card.image_uris?.small && (
                          <img 
                            src={card.image_uris.small} 
                            alt={card.name}
                            className="w-8 h-11 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{card.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {card.mana_cost} • {card.type_line}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {card.set_name} ({card.set.toUpperCase()})
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/builder">
                <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Building
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 border-2">
                <Library className="w-4 h-4 mr-2" />
                Browse Decks
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Everything You Need to Build</h3>
            <p className="text-muted-foreground text-lg">Professional tools designed for Magic: The Gathering players</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Advanced Card Search</CardTitle>
                <CardDescription>
                  Search through 25K+ Magic cards with powerful filters. Find exactly what you need with 
                  real-time Scryfall integration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                  <Library className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Smart Deck Management</CardTitle>
                <CardDescription>
                  Organize your decks with mainboard, sideboard, and considering sections. 
                  Real-time statistics and mana curve analysis.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Import & Export</CardTitle>
                <CardDescription>
                  Import decks from Archidekt, Moxfield, and other platforms. 
                  Export to any format you need for tournaments.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">25K+</div>
              <div className="text-muted-foreground">Magic Cards</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent mb-2">500+</div>
              <div className="text-muted-foreground">Decks Built</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">50+</div>
              <div className="text-muted-foreground">Formats Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">100%</div>
              <div className="text-muted-foreground">Mobile Optimized</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Formats */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Popular Formats</h3>
            <p className="text-muted-foreground">Build decks for your favorite Magic formats</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Commander", "Standard", "Modern", "Pioneer"].map((format) => (
              <Card key={format} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 via-purple-100 to-red-100 dark:from-blue-900 dark:via-purple-900 dark:to-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">{format}</h4>
                  <p className="text-sm text-muted-foreground mt-2">Build competitive {format} decks</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 rounded flex items-center justify-center">
                <Library className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">GatherDeck</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Built for Magic: The Gathering players worldwide
            </div>
          </div>
        </div>
      </footer>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  )
}
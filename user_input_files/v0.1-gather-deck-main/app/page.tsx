import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Library, Zap, Star } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Library className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">GatherDeck</h1>
            </div>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Modern MTG Deck Builder
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-balance">
              Build Your Perfect
              <span className="text-primary block">Magic Deck</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Create, manage, and optimize your Magic: The Gathering decks with our powerful, mobile-first deck builder.
              Import from any platform, search thousands of cards, and build winning strategies.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search for Magic cards..." className="pl-10 h-12 text-base" />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/builder">
                <Button size="lg" className="h-12 px-8">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Building
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent">
                <Library className="w-4 h-4 mr-2" />
                Explore Cards
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
            <p className="text-muted-foreground text-lg">Powerful tools designed for Magic: The Gathering players</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Advanced Card Search</CardTitle>
                <CardDescription>
                  Search through thousands of Magic cards with powerful filters. Find exactly what you need for your
                  deck.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Library className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Deck Management</CardTitle>
                <CardDescription>
                  Organize your decks with mainboard, sideboard, and considering sections. Track your collection
                  effortlessly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Import & Export</CardTitle>
                <CardDescription>
                  Import decks from Archidekt, Moxfield, and other platforms. Export to any format you need.
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
              <div className="text-3xl font-bold text-primary mb-2">25K+</div>
              <div className="text-muted-foreground">Magic Cards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Decks Built</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Formats Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
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
              <Card key={format} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
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
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Library className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">GatherDeck</span>
            </div>
            <div className="text-sm text-muted-foreground">Built for Magic: The Gathering players worldwide</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

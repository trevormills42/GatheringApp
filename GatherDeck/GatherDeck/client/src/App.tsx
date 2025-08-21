import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/ui/bottom-nav";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Decks from "@/pages/decks";
import DeckBuilder from "@/pages/deck-builder";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/decks" component={Decks} />
        <Route path="/deck-builder/:id" component={DeckBuilder} />
        <Route path="/collection">
          <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
            <div className="text-gray-500">Collection feature coming soon</div>
          </div>
        </Route>
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

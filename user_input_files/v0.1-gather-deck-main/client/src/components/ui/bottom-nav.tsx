import { Link, useLocation } from "wouter";
import { Home, Search, Layers, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/decks", icon: Layers, label: "Decks" },
    { href: "/collection", icon: Folder, label: "Collection" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-2xl px-4 py-2 z-50 shadow-lg mx-4">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center p-3 rounded-xl transition-all duration-300 relative",
                  isActive 
                    ? "text-white bg-gradient-to-r from-primary to-secondary shadow-md transform scale-105" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

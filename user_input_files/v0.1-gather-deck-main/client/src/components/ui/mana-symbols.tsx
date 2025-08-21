import { cn } from "@/lib/utils";

interface ManaSymbolProps {
  manaCost: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface ManaSymbolItemProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
}

function parseManaSymbol(symbol: string): string {
  // Remove braces and convert to lowercase for mana font classes
  return symbol.replace(/[{}]/g, '').toLowerCase();
}

function getManaFontClass(cleanSymbol: string): string {
  // Handle special cases and mappings for the mana font
  switch (cleanSymbol) {
    case 'w':
    case 'u': 
    case 'b':
    case 'r':
    case 'g':
    case 'c':
    case 'x':
      return `ms-${cleanSymbol}`;
    case 'tap':
      return 'ms-tap';
    case 'untap':
      return 'ms-untap';
    default:
      // Handle numbers
      if (/^\d+$/.test(cleanSymbol)) {
        return `ms-${cleanSymbol}`;
      }
      // Handle hybrid mana (e.g., w/u, r/g)
      if (cleanSymbol.includes('/')) {
        // Convert W/U to wu, R/G to rg, etc.
        const hybridClass = cleanSymbol.replace('/', '');
        return `ms-${hybridClass}`;
      }
      // Handle 2/W style hybrid (2 or white)
      if (cleanSymbol.includes('2') && cleanSymbol.length === 2) {
        return `ms-${cleanSymbol}`;
      }
      // Fallback for unknown symbols
      return `ms-${cleanSymbol}`;
  }
}

function ManaSymbolItem({ symbol, size = "md" }: ManaSymbolItemProps) {
  const cleanSymbol = parseManaSymbol(symbol);
  const manaClass = getManaFontClass(cleanSymbol);
  
  const sizeClasses = {
    sm: "text-sm", // ~14px
    md: "text-base", // ~16px  
    lg: "text-lg" // ~18px
  };
  
  return (
    <i
      className={cn(
        "ms", // Base mana symbol class
        manaClass,
        sizeClasses[size]
      )}
      title={`${symbol} mana`}
      data-testid={`mana-symbol-${cleanSymbol}`}
    />
  );
}

export function ManaSymbols({ manaCost, size = "md", className }: ManaSymbolProps) {
  if (!manaCost || manaCost === "0") {
    return (
      <i
        className={cn("ms ms-0", size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base", className)}
        title="0 mana"
        data-testid="mana-cost-zero"
      />
    );
  }
  
  // Parse mana cost string to extract individual symbols
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];
  
  if (symbols.length === 0) {
    return (
      <span className={cn("text-gray-500 text-sm", className)} data-testid="mana-cost-unparseable">
        {manaCost}
      </span>
    );
  }
  
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} data-testid="mana-symbols">
      {symbols.map((symbol, index) => (
        <ManaSymbolItem
          key={`${symbol}-${index}`}
          symbol={symbol}
          size={size}
        />
      ))}
    </div>
  );
}

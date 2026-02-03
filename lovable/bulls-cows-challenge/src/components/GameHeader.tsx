import { cn } from "@/lib/utils";

interface GameHeaderProps {
  attemptsLeft: number;
  maxAttempts?: number;
}

export const GameHeader = ({ attemptsLeft, maxAttempts = 9 }: GameHeaderProps) => {
  const progress = (attemptsLeft / maxAttempts) * 100;

  return (
    <div className="text-center space-y-4">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-gradient-primary">Bulls</span>
          <span className="text-muted-foreground mx-2">&</span>
          <span className="text-gradient-secondary">Cows</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Guess the 3-digit secret number!
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">🐂</span>
          <span className="text-sm text-muted-foreground">= Right digit, right place</span>
          <span className="mx-2 text-muted-foreground">|</span>
          <span className="text-2xl">🐄</span>
          <span className="text-sm text-muted-foreground">= Right digit, wrong place</span>
        </div>
        
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="text-muted-foreground text-sm font-medium">Attempts left:</span>
          <div className="flex gap-1">
            {Array(maxAttempts).fill(null).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  i < attemptsLeft 
                    ? "bg-primary glow-primary" 
                    : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className={cn(
            "font-mono font-bold text-lg",
            attemptsLeft <= 3 ? "text-destructive" : "text-primary"
          )}>
            {attemptsLeft}
          </span>
        </div>
      </div>
    </div>
  );
};

import { Guess } from "@/hooks/useGameLogic";
import { DigitDisplay } from "./DigitDisplay";
import { cn } from "@/lib/utils";

interface GuessHistoryProps {
  guesses: Guess[];
}

export const GuessHistory = ({ guesses }: GuessHistoryProps) => {
  if (guesses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-lg">No guesses yet</p>
        <p className="text-muted-foreground/60 text-sm mt-1">Enter 3 unique digits to make your first guess</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto px-2">
      {guesses.map((guess, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg bg-gradient-card border border-border",
            "animate-bounce-in"
          )}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground font-mono text-sm w-6">#{index + 1}</span>
            <div className="flex gap-2">
              {guess.digits.map((digit, i) => (
                <span key={i} className="w-8 h-10 rounded bg-muted flex items-center justify-center font-mono text-lg font-bold">
                  {digit}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🐂</span>
              <span className={cn(
                "font-mono text-xl font-bold",
                guess.bulls > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {guess.bulls}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🐄</span>
              <span className={cn(
                "font-mono text-xl font-bold",
                guess.cows > 0 ? "text-secondary" : "text-muted-foreground"
              )}>
                {guess.cows}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

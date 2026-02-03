import { cn } from "@/lib/utils";
import { DigitDisplay } from "./DigitDisplay";
import { RotateCcw, Trophy, Frown } from "lucide-react";

interface GameOverModalProps {
  status: 'won' | 'lost';
  secretNumber: number[];
  attemptsUsed: number;
  onRestart: () => void;
}

export const GameOverModal = ({ 
  status, 
  secretNumber, 
  attemptsUsed, 
  onRestart 
}: GameOverModalProps) => {
  const isWin = status === 'won';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-gradient-card border-2 rounded-2xl p-8 max-w-md w-full text-center space-y-6",
        "animate-bounce-in",
        isWin ? "border-success glow-success" : "border-destructive"
      )}>
        <div className={cn(
          "w-20 h-20 mx-auto rounded-full flex items-center justify-center",
          isWin ? "bg-success/20" : "bg-destructive/20"
        )}>
          {isWin ? (
            <Trophy className="w-10 h-10 text-success animate-celebrate" />
          ) : (
            <Frown className="w-10 h-10 text-destructive" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className={cn(
            "text-3xl font-bold",
            isWin ? "text-success" : "text-destructive"
          )}>
            {isWin ? "🎉 BINGO!" : "Game Over"}
          </h2>
          <p className="text-muted-foreground">
            {isWin 
              ? `You won in ${attemptsUsed} attempt${attemptsUsed > 1 ? 's' : ''}!`
              : "Better luck next time!"
            }
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isWin ? "You guessed:" : "The secret number was:"}
          </p>
          <div className="flex justify-center">
            <DigitDisplay digits={secretNumber} variant="secret" />
          </div>
        </div>

        <button
          onClick={onRestart}
          className={cn(
            "w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "border-2 border-primary glow-primary",
            "flex items-center justify-center gap-2 active:scale-95"
          )}
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    </div>
  );
};

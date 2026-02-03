import { useGameLogic } from "@/hooks/useGameLogic";
import { GameHeader } from "./GameHeader";
import { DigitDisplay } from "./DigitDisplay";
import { NumberPad } from "./NumberPad";
import { GuessHistory } from "./GuessHistory";
import { GameOverModal } from "./GameOverModal";
import { FooterCredit } from "./FooterCredit";

export const BullsCowsGame = () => {
  const { gameState, addDigit, removeDigit, submitGuess, resetGame } = useGameLogic();
  const { targetNumber, guesses, currentGuess, gameStatus, attemptsLeft } = gameState;

  const isGameOver = gameStatus !== 'playing';

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-8">
        <GameHeader attemptsLeft={attemptsLeft} />

        <div className="space-y-6">
          {/* Current Guess Display */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground font-medium">Your Guess</p>
            <DigitDisplay digits={currentGuess} animate />
          </div>

          {/* Number Pad */}
          <NumberPad
            onDigitPress={addDigit}
            onDelete={removeDigit}
            onSubmit={submitGuess}
            disabledDigits={currentGuess}
            canSubmit={currentGuess.length === 3}
            disabled={isGameOver}
          />
        </div>

        {/* Guess History */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-center">History</h2>
          <GuessHistory guesses={guesses} />
        </div>

        {/* Game Over Modal */}
        {isGameOver && (
          <GameOverModal
            status={gameStatus as 'won' | 'lost'}
            secretNumber={targetNumber}
            attemptsUsed={9 - attemptsLeft}
            onRestart={resetGame}
          />
        )}
      </div>
    </div>
    <FooterCredit />
  );
};

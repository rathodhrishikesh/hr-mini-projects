import { useState, useCallback } from 'react';

export interface Guess {
  digits: number[];
  bulls: number;
  cows: number;
}

export interface GameState {
  targetNumber: number[];
  guesses: Guess[];
  currentGuess: number[];
  gameStatus: 'playing' | 'won' | 'lost';
  attemptsLeft: number;
}

const MAX_ATTEMPTS = 9;

const generateUniqueDigits = (): number[] => {
  const digits: number[] = [];
  while (digits.length < 3) {
    const digit = Math.floor(Math.random() * 9) + 1; // 1-9
    if (!digits.includes(digit)) {
      digits.push(digit);
    }
  }
  return digits;
};

const calculateBullsAndCows = (target: number[], guess: number[]): { bulls: number; cows: number } => {
  let bulls = 0;
  let cows = 0;
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (target[i] === guess[j]) {
        if (i === j) {
          bulls++;
        } else {
          cows++;
        }
      }
    }
  }
  
  return { bulls, cows };
};

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    targetNumber: generateUniqueDigits(),
    guesses: [],
    currentGuess: [],
    gameStatus: 'playing',
    attemptsLeft: MAX_ATTEMPTS,
  }));

  const addDigit = useCallback((digit: number) => {
    setGameState(prev => {
      if (prev.currentGuess.length >= 3 || prev.gameStatus !== 'playing') return prev;
      if (prev.currentGuess.includes(digit)) return prev; // No duplicates
      return {
        ...prev,
        currentGuess: [...prev.currentGuess, digit],
      };
    });
  }, []);

  const removeDigit = useCallback(() => {
    setGameState(prev => {
      if (prev.currentGuess.length === 0 || prev.gameStatus !== 'playing') return prev;
      return {
        ...prev,
        currentGuess: prev.currentGuess.slice(0, -1),
      };
    });
  }, []);

  const submitGuess = useCallback(() => {
    setGameState(prev => {
      if (prev.currentGuess.length !== 3 || prev.gameStatus !== 'playing') return prev;
      
      const { bulls, cows } = calculateBullsAndCows(prev.targetNumber, prev.currentGuess);
      const newGuess: Guess = {
        digits: [...prev.currentGuess],
        bulls,
        cows,
      };
      
      const newGuesses = [...prev.guesses, newGuess];
      const newAttemptsLeft = prev.attemptsLeft - 1;
      
      let newStatus: GameState['gameStatus'] = 'playing';
      if (bulls === 3) {
        newStatus = 'won';
      } else if (newAttemptsLeft === 0) {
        newStatus = 'lost';
      }
      
      return {
        ...prev,
        guesses: newGuesses,
        currentGuess: [],
        gameStatus: newStatus,
        attemptsLeft: newAttemptsLeft,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      targetNumber: generateUniqueDigits(),
      guesses: [],
      currentGuess: [],
      gameStatus: 'playing',
      attemptsLeft: MAX_ATTEMPTS,
    });
  }, []);

  return {
    gameState,
    addDigit,
    removeDigit,
    submitGuess,
    resetGame,
  };
};

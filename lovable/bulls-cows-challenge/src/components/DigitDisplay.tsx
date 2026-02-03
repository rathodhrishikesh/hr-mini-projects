import { cn } from "@/lib/utils";

interface DigitDisplayProps {
  digits: number[];
  maxDigits?: number;
  variant?: 'current' | 'history' | 'secret';
  animate?: boolean;
}

export const DigitDisplay = ({ 
  digits, 
  maxDigits = 3, 
  variant = 'current',
  animate = false 
}: DigitDisplayProps) => {
  const slots = Array(maxDigits).fill(null).map((_, i) => digits[i] ?? null);

  return (
    <div className="flex gap-3">
      {slots.map((digit, index) => (
        <div
          key={index}
          className={cn(
            "w-16 h-20 md:w-20 md:h-24 rounded-lg flex items-center justify-center font-mono text-4xl md:text-5xl font-bold transition-all duration-300",
            variant === 'current' && [
              "bg-gradient-card border-2 border-border",
              digit !== null && "border-primary glow-primary",
              animate && digit !== null && "animate-bounce-in"
            ],
            variant === 'history' && "bg-muted/50 border border-border text-foreground/80",
            variant === 'secret' && "bg-primary text-primary-foreground glow-primary"
          )}
        >
          {digit !== null ? digit : (
            <span className="text-muted-foreground/30">?</span>
          )}
        </div>
      ))}
    </div>
  );
};

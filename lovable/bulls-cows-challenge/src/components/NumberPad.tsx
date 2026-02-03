import { cn } from "@/lib/utils";
import { Delete, Check } from "lucide-react";

interface NumberPadProps {
  onDigitPress: (digit: number) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabledDigits: number[];
  canSubmit: boolean;
  disabled: boolean;
}

export const NumberPad = ({
  onDigitPress,
  onDelete,
  onSubmit,
  disabledDigits,
  canSubmit,
  disabled
}: NumberPadProps) => {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {digits.map((digit) => {
        const isDisabled = disabled || disabledDigits.includes(digit);
        return (
          <button
            key={digit}
            onClick={() => onDigitPress(digit)}
            disabled={isDisabled}
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-xl font-mono text-2xl md:text-3xl font-bold transition-all duration-200",
              "bg-muted hover:bg-muted/80 active:scale-95",
              "border border-border hover:border-primary/50",
              isDisabled && "opacity-30 cursor-not-allowed hover:bg-muted hover:border-border"
            )}
          >
            {digit}
          </button>
        );
      })}
      
      <button
        onClick={onDelete}
        disabled={disabled}
        className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-xl font-bold transition-all duration-200",
          "bg-destructive/20 hover:bg-destructive/30 active:scale-95",
          "border border-destructive/50 hover:border-destructive",
          "flex items-center justify-center",
          disabled && "opacity-30 cursor-not-allowed"
        )}
      >
        <Delete className="w-6 h-6 text-destructive" />
      </button>
      
      <button
        onClick={onSubmit}
        disabled={disabled || !canSubmit}
        className={cn(
          "w-16 h-16 md:w-20 md:h-20 rounded-xl font-bold transition-all duration-200 col-span-2",
          "bg-primary hover:bg-primary/90 active:scale-95",
          "border-2 border-primary glow-primary",
          "flex items-center justify-center gap-2",
          (disabled || !canSubmit) && "opacity-30 cursor-not-allowed glow-none"
        )}
      >
        <Check className="w-6 h-6 text-primary-foreground" />
        <span className="text-primary-foreground text-lg font-bold">Guess</span>
      </button>
    </div>
  );
};

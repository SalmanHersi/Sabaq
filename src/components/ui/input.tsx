import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-gold/25 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm text-ink",
          "shadow-[0_1px_2px_rgba(26,26,26,0.04),inset_0_1px_2px_rgba(26,26,26,0.02)]",
          "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-ink/40",
          "hover:border-gold/40 hover:shadow-[0_2px_4px_rgba(197,160,101,0.08)]",
          "focus-visible:outline-none focus-visible:border-oxblood/50 focus-visible:ring-2 focus-visible:ring-oxblood/20",
          "focus-visible:shadow-[0_0_0_3px_rgba(140,74,69,0.08)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-cream/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

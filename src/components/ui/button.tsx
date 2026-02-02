import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium",
    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxblood/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-b from-oxblood to-oxblood/95 text-white",
          "shadow-[0_1px_2px_rgba(140,74,69,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:from-oxblood/95 hover:to-oxblood/90",
          "hover:shadow-[0_2px_8px_rgba(140,74,69,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
        ].join(" "),
        destructive: [
          "bg-gradient-to-b from-red-600 to-red-600/95 text-white",
          "shadow-[0_1px_2px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:from-red-600/95 hover:to-red-600/90",
        ].join(" "),
        outline: [
          "border border-gold/25 bg-white/80 backdrop-blur-sm",
          "shadow-[0_1px_2px_rgba(26,26,26,0.04)]",
          "hover:bg-cream/80 hover:border-gold/40 hover:text-ink",
          "hover:shadow-[0_2px_8px_rgba(197,160,101,0.1)]",
        ].join(" "),
        secondary: [
          "bg-cream/80 text-ink backdrop-blur-sm",
          "shadow-[0_1px_2px_rgba(26,26,26,0.04)]",
          "hover:bg-cream hover:shadow-[0_2px_4px_rgba(26,26,26,0.06)]",
        ].join(" "),
        ghost: [
          "hover:bg-cream/60 hover:text-ink",
          "hover:shadow-[0_1px_2px_rgba(26,26,26,0.03)]",
        ].join(" "),
        link: "text-oxblood underline-offset-4 hover:underline hover:text-oxblood/80",
        success: [
          "bg-gradient-to-b from-sage to-sage/95 text-white",
          "shadow-[0_1px_2px_rgba(107,142,35,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:from-sage/95 hover:to-sage/90",
        ].join(" "),
        pass: [
          "bg-gradient-to-b from-sage to-sage/95 text-white",
          "shadow-[0_1px_2px_rgba(107,142,35,0.3)]",
          "border-2 border-sage/80",
          "hover:from-sage/95 hover:to-sage/90",
        ].join(" "),
        fail: [
          "bg-gradient-to-b from-red-600 to-red-600/95 text-white",
          "shadow-[0_1px_2px_rgba(220,38,38,0.3)]",
          "border-2 border-red-600/80",
          "hover:from-red-600/95 hover:to-red-600/90",
        ].join(" "),
        navy: [
          "bg-gradient-to-b from-navy to-navy/95 text-white",
          "shadow-[0_1px_2px_rgba(44,62,80,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "hover:from-navy/95 hover:to-navy/90",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3.5 text-xs",
        lg: "h-11 rounded-xl px-8",
        xl: "h-12 rounded-xl px-10 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

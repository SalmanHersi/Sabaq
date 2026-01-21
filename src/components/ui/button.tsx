import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxblood focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-oxblood text-white shadow hover:bg-oxblood/90",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-600/90",
        outline:
          "border border-gold/30 bg-white shadow-sm hover:bg-cream hover:text-ink",
        secondary: "bg-cream text-ink shadow-sm hover:bg-cream/80",
        ghost: "hover:bg-cream hover:text-ink",
        link: "text-oxblood underline-offset-4 hover:underline",
        success: "bg-sage text-white shadow-sm hover:bg-sage/90",
        pass: "bg-sage text-white shadow-sm hover:bg-sage/90 border-2 border-sage",
        fail: "bg-red-600 text-white shadow-sm hover:bg-red-600/90 border-2 border-red-600",
        navy: "bg-navy text-white shadow hover:bg-navy/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-lg",
        icon: "h-9 w-9",
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

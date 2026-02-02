"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop - hidden on mobile since modal is fullscreen */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm hidden sm:block"
        onClick={() => onOpenChange(false)}
      />
      {/* Content wrapper */}
      <div className="fixed inset-0 sm:overflow-y-auto">
        <div className="min-h-full sm:flex sm:items-center sm:justify-center sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DialogContent({ children, className, onClose }: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative bg-white shadow-xl overflow-y-auto",
        // Mobile: full screen
        "w-full h-[100dvh] max-h-[100dvh] rounded-none",
        // Desktop: large modal that takes most of the screen
        "sm:w-[92vw] sm:max-w-5xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-2xl",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 p-2 rounded-full hover:bg-cream transition-colors z-10"
        >
          <X className="h-5 w-5 text-ink/50" />
        </button>
      )}
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b", className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn("text-xl font-semibold text-navy", className)}>
      {children}
    </h2>
  );
}

interface DialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

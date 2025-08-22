"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";

function cn(...classes: Array<string | undefined | null | false>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 modal-overlay" onClick={() => onOpenChange(false)}>
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content w-full max-w-lg overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between p-6 border-b border-[#dfe1e6]", className)} {...props} />
  );
}

export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-end gap-3 p-6 border-t border-[#dfe1e6]", className)} {...props} />
  );
}




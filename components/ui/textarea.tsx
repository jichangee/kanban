"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";

function cn(...classes: Array<string | undefined | null | false>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#dfe1e6] bg-white px-3 py-2 text-sm text-[#172b4d] placeholder:text-[#5e6c84] focus-visible:outline-none focus:border-[#0079bf]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };




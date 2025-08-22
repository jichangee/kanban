"use client";

import * as React from "react";
import { twMerge } from "tailwind-merge";

function cn(...classes: Array<string | undefined | null | false>) {
  return twMerge(classes.filter(Boolean).join(" "));
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-[#dfe1e6] bg-white px-3 py-1 text-sm text-[#172b4d] ring-offset-background placeholder:text-[#5e6c84] focus-visible:outline-none focus:border-[#0079bf]",
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




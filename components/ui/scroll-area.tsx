"use client";

import * as React from "react";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`overflow-y-auto ${className ?? ""}`}
        style={{ maxHeight: "calc(100vh - 200px)", ...style }}
        {...props}
      />
    );
  }
);
ScrollArea.displayName = "ScrollArea";




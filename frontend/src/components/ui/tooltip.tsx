"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

/** Provider with delay=0 to ensure tooltips show instantly on hover */
const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = (props: TooltipPrimitive.Root.Props & { delay?: number }) => {
  const { delay = 0, ...rootProps } = props;
  return (
    <TooltipProvider delay={delay}>
      <TooltipPrimitive.Root {...rootProps} />
    </TooltipProvider>
  );
};

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner className="z-50">
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(
          "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
          "data-[open]:animate-in data-[closed]:animate-out",
          "data-[closed]:fade-out-0 data-[open]:fade-in-0",
          "data-[closed]:zoom-out-95 data-[open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent }

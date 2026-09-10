"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet, built on Radix Dialog.
 *
 * Radix is worth the dependency here specifically for focus trapping, scroll
 * locking and Escape handling — the parts of a modal that are tedious to get
 * right and very easy to get subtly wrong.
 */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

function SheetContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { title: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />

      <SheetPrimitive.Content
        className={cn(
          "bg-background border-border fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t shadow-2xl",
          className,
        )}
        {...props}
      >
        <div className="border-border flex items-center justify-between gap-4 border-b px-4 py-3">
          <SheetPrimitive.Title className="font-display text-foreground text-lg">
            {title}
          </SheetPrimitive.Title>

          <SheetPrimitive.Close
            className="text-muted-foreground hover:bg-surface-sunken hover:text-foreground -mr-2 flex size-11 items-center justify-center rounded-md"
            aria-label={messages.common.close}
          >
            <X aria-hidden="true" className="size-5" />
          </SheetPrimitive.Close>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent };

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Written in the shadcn/ui idiom (cva variants + Radix Slot) and owned by this
 * repo, which is how shadcn components work anyway — the CLI copies source in
 * rather than installing a package.
 *
 * Sizes keep every target at least 44px tall, per the accessibility bar in
 * docs/PLAN.md §12.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm",
        secondary: "bg-surface text-foreground border border-border-strong hover:bg-surface-sunken",
        ghost: "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
        link: "text-accent underline underline-offset-4 hover:text-accent-hover",
      },
      size: {
        sm: "h-11 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };

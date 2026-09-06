import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-mauve-950 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-mauve-900 text-mauve-50 hover:bg-mauve-800 dark:bg-mauve-50 dark:text-mauve-950 dark:hover:bg-mauve-200",
        outline:
          "border-mauve-300 bg-transparent hover:bg-mauve-100 dark:border-mauve-700 dark:hover:bg-mauve-800",
        secondary:
          "bg-mauve-200 text-mauve-900 hover:bg-mauve-300 dark:bg-mauve-800 dark:text-mauve-50 dark:hover:bg-mauve-700",
        ghost:
          "hover:bg-mauve-100 dark:hover:bg-mauve-800",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700",
        link: "text-mauve-900 underline-offset-4 hover:underline dark:text-mauve-50",
      },
      size: {
        default:
          "h-10 gap-2 px-4",
        xs: "h-7 gap-1 px-2 text-xs",
        sm: "h-9 gap-1.5 px-3 text-sm",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

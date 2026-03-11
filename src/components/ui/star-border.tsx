import { Sparkles } from "lucide-react"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

import { cn } from "@/lib/utils"

type StarBorderProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
}

export function StarBorder({
  children,
  className,
  ...props
}: StarBorderProps) {
  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden rounded-[1.6rem] p-px shadow-[0_22px_44px_rgba(17,87,166,0.18)]",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[conic-gradient(from_210deg_at_50%_50%,rgba(255,255,255,0.96),rgba(125,211,252,0.9),rgba(37,99,235,0.95),rgba(255,255,255,0.96))] animate-[spin_7s_linear_infinite]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-2.5 left-3 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.85)]"
      >
        <Sparkles className="size-4 animate-pulse" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-2.5 text-sky-100 drop-shadow-[0_0_12px_rgba(186,230,253,0.85)]"
      >
        <Sparkles className="size-3.5 animate-pulse [animation-delay:900ms]" />
      </div>
      <div className="relative rounded-[calc(1.6rem-1px)] bg-card/22 dark:bg-card/60">
        {children}
      </div>
    </div>
  )
}

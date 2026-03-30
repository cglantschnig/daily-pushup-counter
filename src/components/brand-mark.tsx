import { cn } from "@/lib/utils"

type BrandMarkProps = {
  compact?: boolean
  className?: string
}

export function BrandMark({
  compact = false,
  className,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-12 items-center justify-center rounded-[1.4rem] border border-primary/25 bg-gradient-to-br from-primary/20 via-primary/10 to-chart-2/20 shadow-[0_18px_50px_rgba(14,76,133,0.2)]">
        <img
          src="/favicon-32x32.png"
          alt="Daily Pushup Counter logo"
          className="h-7 w-7 object-contain"
        />
      </div>

      <div className="min-w-0">
        <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.32em] text-primary uppercase">
          Daily Pushup Counter
        </p>
        {!compact ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Performance tracking for your next set.
          </p>
        ) : null}
      </div>
    </div>
  )
}

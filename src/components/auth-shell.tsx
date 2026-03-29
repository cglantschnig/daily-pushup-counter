import type { ReactNode } from "react"
import { BrandMark } from "@/components/brand-mark"

type AuthShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  alternateAction?: ReactNode
  children: ReactNode
}

const authHighlights = [
  "Start in the challenge view by default.",
  "Track completed sets with private history.",
  "Adjust your account and theme from settings.",
]

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  alternateAction,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-svh overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute right-[-8rem] bottom-[-8rem] h-96 w-96 rounded-full bg-chart-2/12 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:76px_76px] opacity-30 dark:opacity-20" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-5 lg:min-h-[calc(100svh-3rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(24rem,30rem)]">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-border/70 bg-card/68 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top_left,rgba(247,86,54,0.16),transparent_58%)]" />

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <BrandMark />

              <div className="max-w-2xl space-y-4">
                <p className="[font-family:var(--font-display)] text-[0.74rem] tracking-[0.3em] text-primary uppercase">
                  Sports Tracking
                </p>
                <h1 className="text-[clamp(2.8rem,8vw,5.8rem)] leading-[0.92] font-semibold tracking-[-0.1em] text-foreground">
                  Train with a cleaner rhythm.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground">
                  A focused pushup tracker with one default destination: get
                  into the next challenge, log the result, and move on.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {authHighlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.6rem] border border-border/70 bg-background/72 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
                >
                  <p className="text-sm leading-6 text-foreground">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-border/70 bg-background/82 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl sm:p-7">
          <div className="flex min-h-full flex-col">
            <div className="flex justify-end">{alternateAction}</div>

            <div className="mt-8 space-y-3">
              <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.28em] text-primary uppercase">
                {eyebrow}
              </p>
              <h2 className="text-4xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                {title}
              </h2>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {subtitle}
              </p>
            </div>

            <div className="mt-8 flex flex-1 items-center">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}

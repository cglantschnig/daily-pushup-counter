import type { ReactNode } from "react"
import { BrandMark } from "@/components/brand-mark"

type AppScreenProps = {
  headerStart?: ReactNode
  headerEnd?: ReactNode
  showBranding?: boolean
  showVersion?: boolean
  title?: string
  subtitle?: string
  children: ReactNode
}

export function AppScreen({
  headerStart,
  headerEnd,
  showBranding = true,
  showVersion = false,
  title,
  subtitle,
  children,
}: AppScreenProps) {
  return (
    <main className="relative min-h-svh overflow-hidden px-4 py-5 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-10rem] h-72 w-72 rounded-full bg-primary/14 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-72 w-72 rounded-full bg-chart-2/12 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,76,133,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(56,151,205,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 dark:opacity-20" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-xl flex-col">
        <section className="flex h-full flex-1 flex-col rounded-[2.1rem] border border-border/70 bg-card/80 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl sm:p-7">
          <header className="mb-6 space-y-5">
            {headerStart || headerEnd ? (
              <div className="flex min-h-6 items-start justify-between gap-3">
                <div>{headerStart}</div>
                <div>{headerEnd}</div>
              </div>
            ) : null}
            {showBranding ? (
              <BrandMark />
            ) : null}
            {title ? (
              <div className="space-y-2">
                <h1 className="text-4xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="max-w-md text-sm leading-6 text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : null}
          </header>

          <div className="flex flex-1 flex-col">{children}</div>
        </section>

        {showVersion ? (
          <footer className="pt-4 text-center text-xs font-medium tracking-[0.28em] text-primary/75 uppercase">
            Version {__APP_VERSION__}
          </footer>
        ) : null}
      </div>
    </main>
  )
}

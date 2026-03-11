import type { ReactNode } from "react"

type AppScreenProps = {
  headerStart?: ReactNode
  showBranding?: boolean
  showVersion?: boolean
  title?: string
  subtitle?: string
  children: ReactNode
}

export function AppScreen({
  headerStart,
  showBranding = true,
  showVersion = false,
  title,
  subtitle,
  children,
}: AppScreenProps) {
  return (
    <main className="relative min-h-svh overflow-hidden px-4 py-5 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-12rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute right-[-6rem] bottom-0 h-56 w-56 rounded-full bg-accent/45 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-md flex-col">
        <section className="flex-1 rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-[0_28px_80px_rgba(17,72,137,0.2)] backdrop-blur-xl sm:p-7">
          <header className="mb-6 space-y-5">
            {headerStart ? <div>{headerStart}</div> : null}
            {showBranding ? (
              <div className="flex items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-[1.35rem] border border-primary/12 bg-linear-to-br from-white to-primary/12 shadow-[0_18px_40px_rgba(17,87,166,0.14)]">
                  <img
                    src="/favicon-32x32.png"
                    alt="Daily Pushup Counter logo"
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-[0.35em] text-primary uppercase">
                    Daily Pushup Counter
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quick sets, clearer progress.
                  </p>
                </div>
              </div>
            ) : null}
            {title ? (
              <div className="space-y-2">
                <h1 className="text-4xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            ) : null}
          </header>

          {children}
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

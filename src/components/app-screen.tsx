import type { ReactNode } from "react"

type AppScreenProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AppScreen({ title, subtitle, children }: AppScreenProps) {
  return (
    <main className="relative min-h-svh overflow-hidden px-4 py-5 sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-12rem] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute right-[-6rem] bottom-0 h-56 w-56 rounded-full bg-[#ffd39a]/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-md flex-col">
        <section className="flex-1 rounded-[2rem] border border-white/65 bg-white/82 p-6 shadow-[0_28px_80px_rgba(64,30,12,0.16)] backdrop-blur sm:p-7">
          <header className="mb-6 space-y-3">
            <p className="text-xs font-medium tracking-[0.35em] text-primary uppercase">
              Daily Pushup Counter
            </p>
            <div className="space-y-2">
              <h1 className="text-4xl leading-none font-semibold tracking-[-0.05em] text-[#1f130b]">
                {title}
              </h1>
              <p className="max-w-sm text-sm leading-6 text-[#5d4333]">
                {subtitle}
              </p>
            </div>
          </header>

          {children}
        </section>

        <footer className="pt-4 text-center text-xs font-medium tracking-[0.28em] text-[#6b5140] uppercase">
          Version {__APP_VERSION__}
        </footer>
      </div>
    </main>
  )
}

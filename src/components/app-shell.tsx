import { Link, useLocation } from "@tanstack/react-router"
import { Dumbbell, History, Settings2 } from "lucide-react"
import type { ReactNode } from "react"
import { BrandMark } from "@/components/brand-mark"
import { cn } from "@/lib/utils"

type AppSection = "challenge" | "history" | "settings"

type AppShellProps = {
  section: AppSection
  eyebrow?: string
  title: string
  subtitle: string
  headerAction?: ReactNode
  children: ReactNode
}

const navigation = [
  {
    label: "Challenge",
    to: "/challenge" as const,
    section: "challenge" as const,
    icon: Dumbbell,
  },
  {
    label: "History",
    to: "/history" as const,
    section: "history" as const,
    icon: History,
  },
  {
    label: "Settings",
    to: "/settings" as const,
    section: "settings" as const,
    icon: Settings2,
  },
]

export function AppShell({
  section,
  eyebrow = "Training Hub",
  title,
  subtitle,
  headerAction,
  children,
}: AppShellProps) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(255,110,72,0.18),transparent_52%)]" />
        <div className="absolute right-[-8rem] top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-4rem] h-72 w-72 rounded-full bg-chart-2/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 dark:opacity-15" />
      </div>

      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-[18.5rem] lg:flex-col lg:justify-between lg:border-r lg:border-border/60 lg:bg-card/55 lg:px-6 lg:py-8 lg:backdrop-blur-xl">
          <div className="space-y-8">
            <BrandMark />

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = item.section === section

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(247,86,54,0.24)]"
                        : "border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-background/85 hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <section className="rounded-[1.75rem] border border-border/70 bg-background/78 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="[font-family:var(--font-display)] text-[0.7rem] tracking-[0.28em] text-primary uppercase">
              Daily Brief
            </p>
            <p className="mt-3 text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
              Every clean rep earns better data.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use the menu to move between the live challenge, your saved
              sessions, and account controls.
            </p>
          </section>
        </aside>

        <div className="flex min-h-svh flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/60 bg-background/74 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
              <div className="min-w-0">
                <BrandMark compact className="lg:hidden" />
                <div className="mt-4 space-y-2 lg:mt-0">
                  <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.28em] text-primary uppercase">
                    {eyebrow}
                  </p>
                  <div>
                    <h1 className="text-[clamp(2rem,4vw,3.4rem)] leading-none font-semibold tracking-[-0.08em] text-foreground">
                      {title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {headerAction ? (
                <div className="shrink-0">{headerAction}</div>
              ) : null}
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
            {children}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[1.8rem] border border-border/70 bg-background/90 p-2 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.to ||
              (item.to !== "/challenge" && pathname.startsWith(item.to))

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-[1.3rem] px-3 py-2 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </main>
  )
}

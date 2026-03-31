import { Link, useLocation } from "@tanstack/react-router"
import type { ReactNode } from "react"

import {
  AppSidebar,
  getSectionMeta,
  type AppSection,
} from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

type AppShellProps = {
  section: AppSection
  eyebrow?: string | null
  title: string
  subtitle: string
  headerAction?: ReactNode
  children: ReactNode
}

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
  const currentSection = getSectionMeta(section)
  const isChallengeActive =
    pathname === "/challenge" || pathname.startsWith("/challenge/")

  return (
    <SidebarProvider
      defaultOpen
      className="relative isolate min-h-svh overflow-hidden bg-transparent"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(255,110,72,0.16),transparent_52%)]" />
        <div className="absolute top-16 right-[-8rem] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-4rem] h-72 w-72 rounded-full bg-chart-2/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 dark:opacity-15" />
      </div>

      <AppSidebar section={section} />

      <SidebarInset className="relative min-h-svh bg-transparent md:peer-data-[variant=inset]:my-3 md:peer-data-[variant=inset]:mr-3 md:peer-data-[variant=inset]:rounded-[2rem] md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-border/60 md:peer-data-[variant=inset]:bg-background/72 md:peer-data-[variant=inset]:shadow-[0_30px_90px_rgba(15,23,42,0.12)] md:peer-data-[variant=inset]:backdrop-blur-2xl dark:md:peer-data-[variant=inset]:shadow-black/20">
        <header className="sticky top-0 z-20 border-b border-border/55 bg-background/74 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="rounded-xl border border-border/65 bg-card/70 text-foreground hover:bg-card" />
              <Separator
                orientation="vertical"
                className="hidden h-5 bg-border/70 sm:block"
              />
              <Breadcrumb>
                <BreadcrumbList className="gap-2 text-[0.72rem] tracking-[0.16em] uppercase">
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <BreadcrumbLink asChild>
                      <Link
                        to="/challenge"
                        className={isChallengeActive ? "text-foreground" : ""}
                      >
                        Training Hub
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentSection.group}</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentSection.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {headerAction ? (
              <div className="shrink-0">{headerAction}</div>
            ) : null}
          </div>
        </header>

        <div className="relative flex flex-1 flex-col px-4 pt-4 pb-8 sm:px-6 lg:px-8">
          <section className="rounded-[2rem] border border-border/65 bg-card/72 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6 dark:shadow-black/15">
            {eyebrow ? (
              <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.28em] text-primary uppercase">
                {eyebrow}
              </p>
            ) : null}
            <div className={`${eyebrow ? "mt-4" : ""} max-w-3xl`}>
              <h1 className="text-[clamp(2.2rem,4vw,3.7rem)] leading-none font-semibold tracking-[-0.08em] text-foreground">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            </div>
          </section>

          <div className="mt-6 flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

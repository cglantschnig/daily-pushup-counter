import { Link, useLocation } from "@tanstack/react-router"
import {
  BookOpen,
  Dumbbell,
  History,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type AppSection = "challenge" | "history" | "settings"

type NavigationItem = {
  label: string
  to: "/challenge" | "/history" | "/settings"
  icon: LucideIcon
  description: string
}

type AppSidebarProps = {
  section: AppSection
}

type SectionMeta = {
  label: string
  group: string
}

const primaryNavigation: NavigationItem[] = [
  {
    label: "Challenge",
    to: "/challenge",
    icon: Dumbbell,
    description: "Start the next guided set.",
  },
  {
    label: "History",
    to: "/history",
    icon: History,
    description: "Review and manage saved sessions.",
  },
]

const secondaryNavigation: NavigationItem[] = [
  {
    label: "Settings",
    to: "/settings",
    icon: Settings2,
    description: "Theme, account, and app controls.",
  },
]

const sectionMeta: Record<AppSection, SectionMeta> = {
  challenge: {
    label: "Challenge",
    group: "Daily Work",
  },
  history: {
    label: "History",
    group: "Daily Work",
  },
  settings: {
    label: "Settings",
    group: "Preferences",
  },
}

export function getSectionMeta(section: AppSection) {
  return sectionMeta[section]
}

export function AppSidebar({ section }: AppSidebarProps) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-none">
      <SidebarHeader className="gap-4 p-3">
        <Link
          to="/challenge"
          className="flex items-center gap-3 rounded-[1.65rem] border border-sidebar-border/70 bg-white/75 px-3 py-3 shadow-[0_22px_60px_rgba(15,23,42,0.08)] transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 hover:bg-white dark:bg-white/6 dark:hover:bg-white/10"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/10 bg-sidebar-foreground text-sidebar shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
            <img
              src="/favicon-32x32.png"
              alt="Daily Pushup Counter logo"
              className="size-6 object-contain invert"
            />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="[font-family:var(--font-display)] text-[0.7rem] tracking-[0.28em] text-primary uppercase">
              Daily Pushup Counter
            </p>
            <p className="mt-1 text-sm text-sidebar-foreground/72">
              Crisp reps, clean navigation.
            </p>
          </div>
        </Link>

        <div className="rounded-[1.65rem] border border-sidebar-border/70 bg-sidebar-foreground/[0.03] p-4 group-data-[collapsible=icon]:hidden dark:bg-white/[0.03]">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.22em] text-primary uppercase">
            <Sparkles className="size-3.5" />
            Current view
          </div>
          <p className="mt-3 text-2xl leading-none font-semibold tracking-[-0.06em] text-sidebar-foreground">
            {getSectionMeta(section).label}
          </p>
          <p className="mt-2 text-sm leading-6 text-sidebar-foreground/68">
            The layout is built on shadcn sidebar primitives with grouped
            navigation, mobile sheet behavior, and desktop collapse.
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 tracking-[0.18em] uppercase">
            Daily Work
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavigation.map((item) => (
                <SidebarNavigationItem
                  key={item.to}
                  item={item}
                  isActive={isNavigationItemActive(pathname, item)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 tracking-[0.18em] uppercase">
            Preferences
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavigation.map((item) => (
                <SidebarNavigationItem
                  key={item.to}
                  item={item}
                  isActive={isNavigationItemActive(pathname, item)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-3">
        <div className="rounded-[1.5rem] border border-sidebar-border/70 bg-white/70 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] group-data-[collapsible=icon]:hidden dark:bg-white/5">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.22em] text-primary uppercase">
            <BookOpen className="size-3.5" />
            Layout note
          </div>
          <p className="mt-3 text-sm leading-6 text-sidebar-foreground/72">
            Use the rail or press{" "}
            <span className="font-semibold">Cmd/Ctrl + B</span> to collapse the
            sidebar.
          </p>
          <p className="mt-3 text-[0.7rem] tracking-[0.22em] text-sidebar-foreground/48 uppercase">
            Version {__APP_VERSION__}
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

function SidebarNavigationItem({
  item,
  isActive,
}: {
  item: NavigationItem
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        size="lg"
        isActive={isActive}
        tooltip={item.label}
        className={cn(
          "rounded-[1.35rem] px-3 text-sidebar-foreground/78 transition-all hover:bg-sidebar-primary/10 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_18px_40px_rgba(247,86,54,0.24)]"
        )}
      >
        <Link to={item.to}>
          <Icon className="size-4" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="mt-0.5 block text-[0.72rem] leading-5 text-current/70">
              {item.description}
            </span>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function isNavigationItemActive(pathname: string, item: NavigationItem) {
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

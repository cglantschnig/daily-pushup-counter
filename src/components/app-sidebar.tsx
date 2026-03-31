import { Link, useLocation } from "@tanstack/react-router"
import {
  Dumbbell,
  History,
  Settings2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type AppSection = "challenge" | "history" | "settings"

type NavigationItem = {
  label: string
  to: "/challenge" | "/history" | "/settings"
  icon: LucideIcon
}

type AppSidebarProps = {
  section: AppSection
}

type SectionMeta = {
  label: string
  group: string
}

const primaryNavigation: Array<NavigationItem> = [
  {
    label: "Challenge",
    to: "/challenge",
    icon: Dumbbell,
  },
  {
    label: "History",
    to: "/history",
    icon: History,
  },
]

const secondaryNavigation: Array<NavigationItem> = [
  {
    label: "Settings",
    to: "/settings",
    icon: Settings2,
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

export function AppSidebar({ section: _section }: AppSidebarProps) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const navigation = [...primaryNavigation, ...secondaryNavigation]

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-none">
      <SidebarHeader className="p-3">
        <Link
          to="/challenge"
          className="flex items-center gap-3 px-1 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl">
            <img
              src="/favicon-32x32.png"
              alt="Daily Pushup Counter logo"
              className="size-6 object-contain"
            />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="[font-family:var(--font-display)] text-xs tracking-[0.18em] text-primary uppercase">
              Daily Pushup Counter
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-2">
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarNavigationItem
              key={item.to}
              item={item}
              isActive={isNavigationItemActive(pathname, item)}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <p className="w-full px-1 text-right text-[0.65rem] tracking-[0.18em] text-sidebar-foreground/55 uppercase group-data-[collapsible=icon]:text-center">
          v{__APP_VERSION__}
        </p>
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
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function isNavigationItemActive(pathname: string, item: NavigationItem) {
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

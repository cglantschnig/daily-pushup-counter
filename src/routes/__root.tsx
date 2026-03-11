import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { useEffect, useEffectEvent } from "react"

import appCss from "../styles.css?url"

import { ReminderBootstrap } from "@/components/reminder-bootstrap"
import {
  LIGHT_THEME_COLOR,
  THEME_SETTINGS_EVENT,
  applyThemePreference,
  getStoredThemePreference,
  getThemeInitializationScript,
  isThemeStorageKey,
  subscribeToSystemThemeChange,
} from "@/lib/theme"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: LIGHT_THEME_COLOR,
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Pushup Counter",
      },
      {
        title: "Daily Pushup Counter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeInitializationScript() }} />
        <HeadContent />
      </head>
      <body>
        <ThemeBootstrap />
        <ReminderBootstrap />
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function ThemeBootstrap() {
  const syncTheme = useEffectEvent(() => {
    applyThemePreference()
  })

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!isThemeStorageKey(event.key)) {
        return
      }

      syncTheme()
    }

    const handleThemeChange = () => {
      syncTheme()
    }

    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() !== "system") {
        return
      }

      syncTheme()
    }

    syncTheme()
    window.addEventListener(THEME_SETTINGS_EVENT, handleThemeChange)
    window.addEventListener("storage", handleStorage)
    const unsubscribeFromSystemTheme =
      subscribeToSystemThemeChange(handleSystemThemeChange)

    return () => {
      window.removeEventListener(THEME_SETTINGS_EVENT, handleThemeChange)
      window.removeEventListener("storage", handleStorage)
      unsubscribeFromSystemTheme()
    }
  }, [syncTheme])

  return null
}

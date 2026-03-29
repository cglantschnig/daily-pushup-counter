import { UserButton, useUser } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { LaptopMinimal, Moon, Sun } from "lucide-react"
import { useEffect, useEffectEvent, useState } from "react"
import type { ThemePreference } from "@/lib/theme"
import { AppShell } from "@/components/app-shell"
import {
  THEME_SETTINGS_EVENT,
  getStoredThemePreference,
  isThemeStorageKey,
  resolveThemePreference,
  setThemePreference,
  subscribeToSystemThemeChange,
} from "@/lib/theme"
import { requireAuthenticatedUser } from "@/lib/require-auth"
type ThemeOption = {
  value: ThemePreference
  label: string
  description: string
  icon: typeof LaptopMinimal
}

const themeOptions: Array<ThemeOption> = [
  {
    value: "system",
    label: "System",
    description: "Follow your device setting.",
    icon: LaptopMinimal,
  },
  {
    value: "light",
    label: "Light",
    description: "Keep the bright theme.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Use the darker theme.",
    icon: Moon,
  },
]

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ location }) => requireAuthenticatedUser(location.href),
  component: SettingsScreen,
})

function SettingsScreen() {
  const { user } = useUser()
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    () => getStoredThemePreference()
  )
  const refreshThemePreference = useEffectEvent(() => {
    setThemePreferenceState(getStoredThemePreference())
  })

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (isThemeStorageKey(event.key)) {
        refreshThemePreference()
      }
    }

    const handleThemeChange = () => {
      refreshThemePreference()
    }

    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() !== "system") {
        return
      }

      refreshThemePreference()
    }

    refreshThemePreference()
    window.addEventListener(THEME_SETTINGS_EVENT, handleThemeChange)
    window.addEventListener("storage", handleStorage)
    const unsubscribeFromSystemTheme = subscribeToSystemThemeChange(
      handleSystemThemeChange
    )

    return () => {
      window.removeEventListener(THEME_SETTINGS_EVENT, handleThemeChange)
      window.removeEventListener("storage", handleStorage)
      unsubscribeFromSystemTheme()
    }
  }, [refreshThemePreference])
  const handleThemePreferenceChange = useEffectEvent(
    (value: ThemePreference) => {
      setThemePreference(value)
      refreshThemePreference()
    }
  )
  const resolvedTheme = resolveThemePreference(themePreference)

  return (
    <AppShell
      section="settings"
      eyebrow="Account Controls"
      title="Settings"
      subtitle="Manage your account, adjust the app theme, and keep the experience tuned the way you like it."
      headerAction={
        <div className="rounded-full border border-border/70 bg-card/72 p-1">
          <UserButton />
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-[2rem] border border-border/70 bg-card/74 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-black/20">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/12 bg-linear-to-br from-white to-primary/12 text-primary shadow-[0_18px_40px_rgba(247,86,54,0.12)] dark:from-white/10 dark:to-primary/20 dark:shadow-[0_18px_40px_rgba(3,8,20,0.4)]">
              <span className="text-sm font-semibold tracking-[0.18em] uppercase">
                ID
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-2xl leading-none font-semibold tracking-[-0.06em] text-foreground">
                Account
              </p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Signed in as
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.primaryEmailAddress?.emailAddress ??
                      user?.fullName ??
                      "your account"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-border/60 bg-background/78 px-4 py-4">
            <p className="[font-family:var(--font-display)] text-[0.68rem] tracking-[0.24em] text-primary uppercase">
              App build
            </p>
            <p className="mt-2 text-lg leading-none font-semibold tracking-[-0.04em] text-foreground">
              Version {__APP_VERSION__}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Account access stays open through Clerk. Use the avatar menu to
              sign out when needed.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/74 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-black/20">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/12 bg-linear-to-br from-white to-primary/12 text-primary shadow-[0_18px_40px_rgba(247,86,54,0.12)] dark:from-white/10 dark:to-primary/20 dark:shadow-[0_18px_40px_rgba(3,8,20,0.4)]">
              {resolvedTheme === "dark" ? (
                <Moon className="size-5" />
              ) : (
                <Sun className="size-5" />
              )}
            </div>

            <div className="theme-options-content min-w-0 flex-1">
              <div>
                <p className="text-2xl leading-none font-semibold tracking-[-0.06em] text-foreground">
                  Appearance
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose light or dark mode, or follow your device setting.
                </p>
              </div>

              <div className="theme-options-grid mt-4 grid grid-cols-1 gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = themePreference === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isActive}
                      className="rounded-[1.25rem] border border-border/70 bg-background/78 px-3 py-3 text-left transition-colors hover:bg-background/95 data-[active=true]:border-primary/30 data-[active=true]:bg-primary/10 data-[active=true]:text-foreground dark:bg-background/30 dark:hover:bg-background/55"
                      data-active={isActive}
                      onClick={() => handleThemePreferenceChange(option.value)}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Icon className="size-4 text-primary" />
                        <span>{option.label}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Active theme:{" "}
                <span className="font-medium text-foreground">
                  {resolvedTheme === "dark" ? "Dark" : "Light"}
                </span>
                {themePreference === "system" ? " (following system)." : "."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

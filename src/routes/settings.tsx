import { Link, createFileRoute } from "@tanstack/react-router"
import { Bell, BellOff } from "lucide-react"
import { useEffect, useEffectEvent, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import {
  REMINDER_SETTINGS_EVENT,
  getReminderStatus,
  isReminderStorageKey,
  requestReminderPermission,
  setReminderEnabled,
  syncPeriodicReminderRegistration,
} from "@/lib/reminders"

type ReminderStatus = ReturnType<typeof getReminderStatus>

export const Route = createFileRoute("/settings")({
  component: SettingsScreen,
})

function getStatusLabel(reminderStatus: ReminderStatus) {
  if (!reminderStatus.supported) {
    return "Unsupported on this device"
  }

  if (reminderStatus.enabled && reminderStatus.permission === "granted") {
    return "Enabled"
  }

  if (reminderStatus.enabled && reminderStatus.permission === "denied") {
    return "Blocked by browser permission"
  }

  if (reminderStatus.permission === "granted") {
    return "Allowed, but turned off"
  }

  if (reminderStatus.permission === "denied") {
    return "Permission denied"
  }

  return "Turn on to request permission"
}

function getStatusDescription(reminderStatus: ReminderStatus) {
  if (!reminderStatus.supported) {
    return "This browser does not support push notifications."
  }

  if (reminderStatus.enabled && reminderStatus.permission === "granted") {
    return "You will receive a reminder roughly every 30 minutes."
  }

  if (reminderStatus.enabled && reminderStatus.permission === "denied") {
    return "Notifications are enabled in the app, but your browser is currently blocking them."
  }

  if (reminderStatus.permission === "granted") {
    return "Notifications are allowed by the browser and ready to be turned on."
  }

  if (reminderStatus.permission === "denied") {
    return "Allow notifications again in your browser site settings before turning this back on."
  }

  return "Turning this on will ask the browser for notification permission."
}

function SettingsScreen() {
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>(() =>
    getReminderStatus()
  )
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const refreshReminderStatus = useEffectEvent(() => {
    setReminderStatus(getReminderStatus())
  })

  useEffect(() => {
    const handleReminderChange = () => {
      refreshReminderStatus()
    }

    const handleStorage = (event: StorageEvent) => {
      if (!isReminderStorageKey(event.key)) {
        return
      }

      refreshReminderStatus()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return
      }

      refreshReminderStatus()
    }

    refreshReminderStatus()
    window.addEventListener(REMINDER_SETTINGS_EVENT, handleReminderChange)
    window.addEventListener("storage", handleStorage)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener(REMINDER_SETTINGS_EVENT, handleReminderChange)
      window.removeEventListener("storage", handleStorage)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshReminderStatus])

  const handleToggleNotifications = useEffectEvent(async (enabled: boolean) => {
    setIsSaving(true)
    setFeedback(null)

    try {
      if (!enabled) {
        setReminderEnabled(false)
        await syncPeriodicReminderRegistration()
        refreshReminderStatus()
        setFeedback("Push notifications are turned off.")
        return
      }

      const permission = await requestReminderPermission()

      if (permission !== "granted") {
        setReminderEnabled(false)
        await syncPeriodicReminderRegistration()
        refreshReminderStatus()

        if (permission === "denied") {
          setFeedback("Browser permission is blocked. Update site settings to enable notifications.")
        } else if (permission === "unsupported") {
          setFeedback("This device does not support push notifications.")
        } else {
          setFeedback("Notification permission was not granted.")
        }

        return
      }

      setReminderEnabled(true)
      await syncPeriodicReminderRegistration()
      refreshReminderStatus()
      setFeedback("Push notifications are turned on.")
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <AppScreen
      title="Settings"
      subtitle="Manage reminder notifications for quick pushup check-ins."
    >
      <div className="flex h-full flex-col gap-6">
        <section className="rounded-[1.75rem] border border-primary/12 bg-white/60 p-5 shadow-sm shadow-primary/5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/12 bg-linear-to-br from-white to-primary/12 text-primary shadow-[0_18px_40px_rgba(17,87,166,0.1)]">
              {reminderStatus.enabled ? (
                <Bell className="size-5" />
              ) : (
                <BellOff className="size-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg leading-none font-semibold tracking-[-0.03em] text-foreground">
                    Push notifications
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Get a reminder every 30 minutes to do another set.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={reminderStatus.enabled}
                  aria-label="Toggle push notifications"
                  className="inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-primary/12 bg-muted p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 data-[checked=true]:bg-primary/90"
                  data-checked={reminderStatus.enabled}
                  disabled={isSaving || !reminderStatus.supported}
                  onClick={() =>
                    void handleToggleNotifications(!reminderStatus.enabled)
                  }
                >
                  <span
                    className="size-6 rounded-full bg-white shadow-sm transition-transform data-[checked=true]:translate-x-6"
                    data-checked={reminderStatus.enabled}
                  />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-primary/10 bg-background/65 px-4 py-3">
                <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">
                  Status
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {getStatusLabel(reminderStatus)}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {getStatusDescription(reminderStatus)}
                </p>
              </div>

              {feedback ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {feedback}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="rounded-[1.75rem] border border-dashed border-primary/20 bg-white/52 px-5 py-5 text-sm leading-6 text-muted-foreground">
          If notifications were blocked earlier, re-enable them in your browser's
          site settings and then turn this switch back on.
        </div>

        <div className="mt-auto grid gap-3">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <Link to="/challenge">Start Challenge</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <Link to="/">Back Home</Link>
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}

import { Link, createFileRoute } from "@tanstack/react-router"
import { Bell, BellOff, ChevronLeft } from "lucide-react"
import { useEffect, useEffectEvent, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import {
  REMINDER_SETTINGS_EVENT,
  getNextReminderAt,
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

function formatNextReminder(timestamp: number) {
  const nextReminder = new Date(timestamp)
  const now = new Date()
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(nextReminder)
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfReminderDay = new Date(
    nextReminder.getFullYear(),
    nextReminder.getMonth(),
    nextReminder.getDate()
  )
  const daysUntilReminder = Math.round(
    (startOfReminderDay.getTime() - startOfToday.getTime()) /
      (24 * 60 * 60 * 1000)
  )

  if (daysUntilReminder === 0) {
    return `Next push notification today at ${timeLabel}.`
  }

  if (daysUntilReminder === 1) {
    return `Next push notification tomorrow at ${timeLabel}.`
  }

  const dayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(nextReminder)

  return `Next push notification on ${dayLabel} at ${timeLabel}.`
}

function getReminderSummary(
  reminderStatus: ReminderStatus,
  nextReminderAt: number | null
) {
  if (!reminderStatus.supported) {
    return "Push notifications are not available on this device."
  }

  if (nextReminderAt !== null) {
    return formatNextReminder(nextReminderAt)
  }

  return "Turn notifications on to schedule the next push reminder."
}

function SettingsScreen() {
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>(() =>
    getReminderStatus()
  )
  const [nextReminderAt, setNextReminderAt] = useState<number | null>(() =>
    getNextReminderAt()
  )
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const refreshReminderStatus = useEffectEvent(() => {
    setReminderStatus(getReminderStatus())
    setNextReminderAt(getNextReminderAt())
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
    const intervalId = window.setInterval(refreshReminderStatus, 30_000)

    return () => {
      window.removeEventListener(REMINDER_SETTINGS_EVENT, handleReminderChange)
      window.removeEventListener("storage", handleStorage)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.clearInterval(intervalId)
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
        return
      }

      const permission = await requestReminderPermission()

      if (permission !== "granted") {
        setReminderEnabled(false)
        await syncPeriodicReminderRegistration()
        refreshReminderStatus()

        if (permission === "unsupported") {
          setFeedback("This device does not support push notifications.")
        } else {
          setFeedback("Notification permission was not granted.")
        }

        return
      }

      setReminderEnabled(true)
      await syncPeriodicReminderRegistration()
      refreshReminderStatus()
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <AppScreen
      headerStart={
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          <ChevronLeft className="size-4" />
          <span>Home</span>
        </Link>
      }
      showBranding={false}
      showVersion
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

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {getReminderSummary(reminderStatus, nextReminderAt)}
              </p>

              {feedback ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {feedback}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppScreen>
  )
}

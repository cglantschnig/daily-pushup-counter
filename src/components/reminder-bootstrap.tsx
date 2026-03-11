import { useEffect } from "react"
import {
  REMINDER_SETTINGS_EVENT,
  isReminderStorageKey,
  startReminderLoop,
  syncPeriodicReminderRegistration,
} from "@/lib/reminders"

export function ReminderBootstrap() {
  useEffect(() => {
    const cleanupReminderLoop = startReminderLoop()

    const syncPeriodicReminder = () => {
      void syncPeriodicReminderRegistration()
    }

    const handleStorage = (event: StorageEvent) => {
      if (!isReminderStorageKey(event.key)) {
        return
      }

      syncPeriodicReminder()
    }

    syncPeriodicReminder()
    window.addEventListener(REMINDER_SETTINGS_EVENT, syncPeriodicReminder)
    window.addEventListener("storage", handleStorage)

    return () => {
      cleanupReminderLoop()
      window.removeEventListener(REMINDER_SETTINGS_EVENT, syncPeriodicReminder)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  return null
}

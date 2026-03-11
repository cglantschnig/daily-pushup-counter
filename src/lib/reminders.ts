export const REMINDER_INTERVAL_MS = 30 * 60 * 1000
export const REMINDER_SETTINGS_EVENT = "pushup-reminders-changed"

const REMINDER_ENABLED_KEY = "daily-pushup-counter:reminders-enabled"
const LAST_REMINDER_SENT_AT_KEY = "daily-pushup-counter:last-reminder-sent-at"
const REMINDER_TAG = "pushup-reminder"
const REMINDER_SERVICE_WORKER_URL = "/reminder-sw.js"
const REMINDER_TITLE = "Pushup check-in"
const REMINDER_BODY = "Time for another quick pushup set."

type ReminderPermission = NotificationPermission | "unsupported"

type ReminderStatus = {
  enabled: boolean
  permission: ReminderPermission
  supported: boolean
}

type PeriodicSyncManagerLike = {
  register: (tag: string, options: { minInterval: number }) => Promise<void>
  unregister?: (tag: string) => Promise<void>
}

type PeriodicSyncRegistration = ServiceWorkerRegistration & {
  periodicSync?: PeriodicSyncManagerLike
}

function canUseBrowserApis() {
  return typeof window !== "undefined"
}

function dispatchReminderSettingsEvent() {
  if (!canUseBrowserApis()) {
    return
  }

  window.dispatchEvent(new Event(REMINDER_SETTINGS_EVENT))
}

function setLastReminderSentAt(timestamp: number) {
  if (!canUseBrowserApis()) {
    return
  }

  window.localStorage.setItem(LAST_REMINDER_SENT_AT_KEY, String(timestamp))
}

function clearLastReminderSentAt() {
  if (!canUseBrowserApis()) {
    return
  }

  window.localStorage.removeItem(LAST_REMINDER_SENT_AT_KEY)
}

function getLastReminderSentAt() {
  if (!canUseBrowserApis()) {
    return null
  }

  const rawValue = window.localStorage.getItem(LAST_REMINDER_SENT_AT_KEY)
  const timestamp = rawValue ? Number(rawValue) : Number.NaN

  return Number.isFinite(timestamp) ? timestamp : null
}

function getPeriodicSyncManager(registration: ServiceWorkerRegistration) {
  return (registration as PeriodicSyncRegistration).periodicSync
}

function getReminderDelay(now: number) {
  const lastReminderSentAt = getLastReminderSentAt()

  if (lastReminderSentAt === null) {
    return REMINDER_INTERVAL_MS
  }

  return Math.max(0, lastReminderSentAt + REMINDER_INTERVAL_MS - now)
}

async function showReminderNotification() {
  const options: NotificationOptions = {
    body: REMINDER_BODY,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: REMINDER_TAG,
  }

  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()

      if (registration) {
        await registration.showNotification(REMINDER_TITLE, options)
        return
      }
    } catch {
      // Fall through to the window Notification API if the service worker is not ready.
    }
  }

  new Notification(REMINDER_TITLE, options)
}

export function getReminderStatus(): ReminderStatus {
  const supported = canUseBrowserApis() && "Notification" in window
  const permission = supported ? Notification.permission : "unsupported"
  const enabled =
    supported &&
    canUseBrowserApis() &&
    window.localStorage.getItem(REMINDER_ENABLED_KEY) === "true"

  return {
    enabled,
    permission,
    supported,
  }
}

export function isReminderStorageKey(key: string | null) {
  return key === REMINDER_ENABLED_KEY || key === LAST_REMINDER_SENT_AT_KEY
}

export function setReminderEnabled(enabled: boolean) {
  if (!canUseBrowserApis()) {
    return
  }

  window.localStorage.setItem(REMINDER_ENABLED_KEY, String(enabled))

  if (enabled) {
    setLastReminderSentAt(Date.now())
  } else {
    clearLastReminderSentAt()
  }

  dispatchReminderSettingsEvent()
}

export function getNextReminderAt() {
  const reminderStatus = getReminderStatus()

  if (!reminderStatus.enabled || reminderStatus.permission !== "granted") {
    return null
  }

  const now = Date.now()

  return now + getReminderDelay(now)
}

export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!canUseBrowserApis() || !("Notification" in window)) {
    return "unsupported"
  }

  return Notification.requestPermission()
}

export async function registerReminderServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null
  }

  return navigator.serviceWorker.register(REMINDER_SERVICE_WORKER_URL)
}

export async function syncPeriodicReminderRegistration() {
  const reminderStatus = getReminderStatus()

  if (!reminderStatus.supported) {
    return false
  }

  const registration = await registerReminderServiceWorker()

  if (!registration) {
    return false
  }

  const periodicSync = getPeriodicSyncManager(registration)

  if (!periodicSync) {
    return false
  }

  if (!reminderStatus.enabled || reminderStatus.permission !== "granted") {
    try {
      await periodicSync.unregister?.(REMINDER_TAG)
    } catch {
      // Ignore browsers that expose periodic sync without unregister support.
    }

    return true
  }

  try {
    await periodicSync.register(REMINDER_TAG, {
      minInterval: REMINDER_INTERVAL_MS,
    })
    return true
  } catch {
    return false
  }
}

export async function maybeSendReminder() {
  const reminderStatus = getReminderStatus()

  if (!reminderStatus.enabled || reminderStatus.permission !== "granted") {
    return false
  }

  const now = Date.now()

  if (getReminderDelay(now) > 0) {
    return false
  }

  setLastReminderSentAt(now)
  dispatchReminderSettingsEvent()
  await showReminderNotification()
  return true
}

export function startReminderLoop() {
  if (!canUseBrowserApis()) {
    return () => {}
  }

  let timeoutId: number | null = null

  const clearTimer = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const scheduleNext = () => {
    clearTimer()

    const reminderStatus = getReminderStatus()

    if (!reminderStatus.enabled || reminderStatus.permission !== "granted") {
      return
    }

    timeoutId = window.setTimeout(() => {
      void maybeSendReminder().finally(scheduleNext)
    }, getReminderDelay(Date.now()))
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      return
    }

    void maybeSendReminder().finally(scheduleNext)
  }

  const handleStorage = (event: StorageEvent) => {
    if (!isReminderStorageKey(event.key)) {
      return
    }

    scheduleNext()
  }

  scheduleNext()
  window.addEventListener(REMINDER_SETTINGS_EVENT, scheduleNext)
  window.addEventListener("storage", handleStorage)
  document.addEventListener("visibilitychange", handleVisibilityChange)

  return () => {
    clearTimer()
    window.removeEventListener(REMINDER_SETTINGS_EVENT, scheduleNext)
    window.removeEventListener("storage", handleStorage)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
  }
}

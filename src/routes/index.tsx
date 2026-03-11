import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AppScreen } from "@/components/app-screen"
import {
  REMINDER_SETTINGS_EVENT,
  getReminderStatus,
  isReminderStorageKey,
  requestReminderPermission,
  setReminderEnabled,
} from "@/lib/reminders"
import { initializeSpeech, speakText } from "@/lib/speech"

export const Route = createFileRoute("/")({ component: App })

type SpeechSupportState = {
  supported: boolean
  initialized: boolean
  voiceCount: number
  defaultVoiceName: string | null
}

type ReminderState = ReturnType<typeof getReminderStatus>

function App() {
  const [speechSupport, setSpeechSupport] = useState<SpeechSupportState>({
    supported: false,
    initialized: false,
    voiceCount: 0,
    defaultVoiceName: null,
  })
  const [audioStatus, setAudioStatus] = useState(
    "Press Test Audio to run a speech check."
  )
  const [reminderState, setReminderState] = useState<ReminderState>({
    enabled: false,
    permission: "unsupported",
    supported: false,
  })
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false)

  useEffect(() => {
    let cancelled = false

    void initializeSpeech().then((diagnostics) => {
      if (cancelled) {
        return
      }

      setSpeechSupport({
        supported: diagnostics.supported,
        initialized: diagnostics.initialized,
        voiceCount: diagnostics.voiceCount,
        defaultVoiceName: diagnostics.defaultVoiceName,
      })

      setAudioStatus(
        diagnostics.error ??
          (diagnostics.initialized
            ? "Easy Speech is ready."
            : "Speech is not available in this browser.")
      )
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const syncReminderState = () => {
      setReminderState(getReminderStatus())
    }

    const handleStorage = (event: StorageEvent) => {
      if (!isReminderStorageKey(event.key)) {
        return
      }

      syncReminderState()
    }

    syncReminderState()
    window.addEventListener(REMINDER_SETTINGS_EVENT, syncReminderState)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(REMINDER_SETTINGS_EVENT, syncReminderState)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  async function testSpeechSynthesis() {
    const diagnostics = await initializeSpeech()

    setSpeechSupport({
      supported: diagnostics.supported,
      initialized: diagnostics.initialized,
      voiceCount: diagnostics.voiceCount,
      defaultVoiceName: diagnostics.defaultVoiceName,
    })

    if (!diagnostics.supported || !diagnostics.initialized) {
      setAudioStatus(diagnostics.error ?? "Speech is not available in this browser.")
      return
    }

    setAudioStatus(
      `Queued "hello" with ${diagnostics.defaultVoiceName ?? "default voice"}.`
    )

    await speakText("hello", {
      start: () => {
        setAudioStatus(
          `Started speaking with ${diagnostics.defaultVoiceName ?? "default voice"}.`
        )
      },
      end: () => {
        setAudioStatus(
          `Finished speaking with ${diagnostics.defaultVoiceName ?? "default voice"}.`
        )
      },
      error: (message) => {
        setAudioStatus(`Speech synthesis error: ${message}.`)
      },
    })
  }

  async function toggleReminders() {
    if (reminderState.enabled) {
      setReminderEnabled(false)
      return
    }

    setIsUpdatingReminder(true)

    try {
      const permission =
        reminderState.permission === "granted"
          ? "granted"
          : await requestReminderPermission()

      if (permission === "granted") {
        setReminderEnabled(true)
      }
    } finally {
      setReminderState(getReminderStatus())
      setIsUpdatingReminder(false)
    }
  }

  const reminderDescription = !reminderState.supported
    ? "Browser notifications are not available here."
    : reminderState.enabled && reminderState.permission === "granted"
      ? "Reminders are on. This app will send a browser notification every 30 minutes while it stays open."
      : reminderState.permission === "denied"
        ? "Notifications are blocked for this site. Allow them in your browser settings to turn reminders on."
        : "Enable browser reminders to get a 30-minute pushup check-in."

  const reminderButtonLabel = reminderState.enabled
    ? "Turn Off Reminders"
    : reminderState.permission === "denied"
      ? "Blocked in Browser"
      : "Enable Reminders"

  return (
    <AppScreen
      title="Ready for today?"
      subtitle="Pick a quick pushup challenge or review your last sessions."
    >
      <div className="flex h-full flex-col justify-between gap-8">
        <div className="space-y-3">
          <div className="rounded-[1.75rem] border border-[#f0d9c4] bg-[#fff5ea] p-5 text-sm leading-6 text-[#6b5140]">
            Hit start to generate a random pushup challenge between 5 and 10 reps.
          </div>
          <div className="rounded-[1.75rem] border border-[#ead7c4] bg-white/70 p-5 text-sm leading-6 text-[#6b5140]">
            <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
              Audio Check
            </p>
            <p className="mt-2">
              Easy Speech support:{" "}
              <span className="font-semibold text-[#1f130b]">
                {speechSupport.supported ? "available" : "not available"}
              </span>
            </p>
            <p>
              Initialized:{" "}
              <span className="font-semibold text-[#1f130b]">
                {speechSupport.initialized ? "yes" : "no"}
              </span>
            </p>
            <p>
              Voices detected:{" "}
              <span className="font-semibold text-[#1f130b]">
                {speechSupport.voiceCount}
              </span>
            </p>
            <p>
              Default voice:{" "}
              <span className="font-semibold text-[#1f130b]">
                {speechSupport.defaultVoiceName ?? "none"}
              </span>
            </p>
            <p className="mt-2 text-xs leading-5 text-[#7d614d]">
              {audioStatus}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#ead7c4] bg-white/70 p-5 text-sm leading-6 text-[#6b5140]">
            <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
              Reminders
            </p>
            <p className="mt-2 text-sm text-[#1f130b]">{reminderDescription}</p>
            <Button
              type="button"
              variant={reminderState.enabled ? "outline" : "default"}
              className="mt-4 h-11 rounded-2xl px-4 text-xs font-semibold tracking-[0.2em] uppercase"
              onClick={toggleReminders}
              disabled={
                isUpdatingReminder ||
                !reminderState.supported ||
                (!reminderState.enabled && reminderState.permission === "denied")
              }
            >
              {isUpdatingReminder ? "Updating..." : reminderButtonLabel}
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <Link to="/challenge">Start</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 rounded-2xl border-[#e7c5a8] bg-white/60 text-sm font-semibold tracking-[0.2em] text-[#1f130b] uppercase"
          >
            <Link to="/history">View History</Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 rounded-2xl text-sm font-semibold tracking-[0.18em] text-[#6b5140] uppercase"
            onClick={testSpeechSynthesis}
            disabled={!speechSupport.supported || !speechSupport.initialized}
          >
            Test Audio
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}

import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"

const COUNTDOWN_STEPS = [
  { label: "3", speech: "Three" },
  { label: "2", speech: "Two" },
  { label: "1", speech: "One" },
  { label: "GO", speech: "Go" },
] as const

const COUNTDOWN_STEP_DELAY_MS = 1000

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})

function ChallengeScreen() {
  const [target] = useState(() => getRandomTarget())
  const [workout] = useState(() => getRandomWorkout())
  const [hasStarted, setHasStarted] = useState(false)
  const [currentStep, setCurrentStep] =
    useState<(typeof COUNTDOWN_STEPS)[number]["label"]>("3")
  const countdownTimeoutRef = useRef<number | null>(null)
  const countdownSessionRef = useRef(0)

  useEffect(() => {
    void initializeSpeech()

    return () => {
      clearSequence()
    }
  }, [])

  function clearSequence() {
    countdownSessionRef.current += 1

    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current)
      countdownTimeoutRef.current = null
    }

    void cancelSpeech()
  }

  function announceStep(stepIndex: number, sessionId: number) {
    if (countdownSessionRef.current !== sessionId) {
      return
    }

    const step = COUNTDOWN_STEPS[stepIndex]
    setCurrentStep(step.label)
    void speakText(step.speech)

    if (stepIndex === COUNTDOWN_STEPS.length - 1) {
      countdownTimeoutRef.current = null
      return
    }

    countdownTimeoutRef.current = window.setTimeout(() => {
      announceStep(stepIndex + 1, sessionId)
    }, COUNTDOWN_STEP_DELAY_MS)
  }

  function handleStart() {
    const sessionId = countdownSessionRef.current + 1
    countdownSessionRef.current = sessionId

    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current)
      countdownTimeoutRef.current = null
    }

    void cancelSpeech()
    setHasStarted(true)
    announceStep(0, sessionId)
  }

  function handleReset() {
    clearSequence()
    setCurrentStep(COUNTDOWN_STEPS[0].label)
    setHasStarted(false)
  }

  return (
    <AppScreen
      headerStart={
        hasStarted ? (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
          >
            <ChevronLeft className="size-4" />
            <span>Challenge</span>
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
          >
            <ChevronLeft className="size-4" />
            <span>Home</span>
          </Link>
        )
      }
      showBranding={false}
    >
      <div className="flex h-full flex-col gap-5 py-6">
        <section className="rounded-[1.75rem] border border-border/70 bg-card/72 p-5 text-center shadow-sm shadow-primary/5 dark:shadow-black/20">
          <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
            Workout
          </p>
          <p className="mt-3 text-4xl leading-none font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
            {workout.label}
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-border/70 bg-card/72 p-5 text-center shadow-sm shadow-primary/5 dark:shadow-black/20">
          <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
            Target Reps
          </p>
          <p className="mt-3 text-7xl leading-none font-semibold tracking-[-0.08em] text-foreground sm:text-8xl">
            {target}
          </p>
        </section>

        {hasStarted ? (
          <div className="flex flex-1 flex-col justify-center gap-6 pt-2">
            <section className="countdown-stage flex min-h-80 items-center justify-center rounded-[2rem] border border-border/70 bg-card/68 p-6 shadow-[0_28px_80px_rgba(17,72,137,0.16)] dark:shadow-[0_28px_80px_rgba(3,8,20,0.36)]">
              <p
                aria-live="assertive"
                className={
                  currentStep === "GO"
                    ? "text-5xl font-semibold tracking-[0.24em] text-primary uppercase sm:text-6xl"
                    : "text-8xl leading-none font-semibold tracking-[-0.08em] text-foreground sm:text-[8rem]"
                }
              >
                {currentStep}
              </p>
            </section>
            <p className="text-center text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
              Get into position
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center space-y-4 pt-10 text-center sm:pt-14">
            <Button
              type="button"
              size="lg"
              onClick={handleStart}
              className="go-button-pulse mx-auto h-48 w-48 rounded-full border-0 bg-primary text-3xl font-semibold tracking-[0.28em] uppercase shadow-[0_26px_70px_rgba(17,87,166,0.35)] hover:bg-primary/92 sm:h-56 sm:w-56"
            >
              GO
            </Button>
            <p className="text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
              Tap to begin
            </p>
          </div>
        )}
      </div>
    </AppScreen>
  )
}

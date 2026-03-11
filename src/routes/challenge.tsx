import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft, CircleHelp } from "lucide-react"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"

const COUNTDOWN_STEPS = [
  { label: "3", speech: "3", delay: 0 },
  { label: "2", speech: "2", delay: 1000 },
  { label: "1", speech: "1", delay: 2000 },
  { label: "START", speech: "Start", delay: 3000 },
] as const

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})

function ChallengeScreen() {
  const [target] = useState(() => getRandomTarget())
  const [workout] = useState(() => getRandomWorkout())
  const [hasStarted, setHasStarted] = useState(false)
  const [isWorkoutTipOpen, setIsWorkoutTipOpen] = useState(false)
  const [currentStep, setCurrentStep] =
    useState<(typeof COUNTDOWN_STEPS)[number]["label"]>("3")
  const timeoutIdsRef = useRef<Array<number>>([])

  const clearSequence = useEffectEvent(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    timeoutIdsRef.current = []

    void cancelSpeech()
  })

  const announceStep = useEffectEvent((step: (typeof COUNTDOWN_STEPS)[number]) => {
    setCurrentStep(step.label)
    void speakText(step.speech)
  })

  useEffect(() => {
    if (!hasStarted) {
      return
    }

    void initializeSpeech()
    announceStep(COUNTDOWN_STEPS[0])

    COUNTDOWN_STEPS.slice(1).forEach((step) => {
      const timeoutId = window.setTimeout(() => {
        announceStep(step)
      }, step.delay)

      timeoutIdsRef.current.push(timeoutId)
    })

    return () => {
      clearSequence()
    }
  }, [announceStep, clearSequence, hasStarted])

  function handleStart() {
    setCurrentStep(COUNTDOWN_STEPS[0].label)
    setHasStarted(true)
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
          <div className="mt-3 flex items-center justify-center gap-2">
            <p className="text-4xl leading-none font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
              {workout.label}
            </p>
            <div
              className="relative flex items-center"
              onMouseEnter={() => setIsWorkoutTipOpen(true)}
              onMouseLeave={() => setIsWorkoutTipOpen(false)}
            >
              <button
                type="button"
                aria-label={`How to do ${workout.label} properly`}
                aria-describedby="workout-tip"
                aria-expanded={isWorkoutTipOpen}
                onClick={() => setIsWorkoutTipOpen((current) => !current)}
                onBlur={() => setIsWorkoutTipOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary"
              >
                <CircleHelp className="size-4" />
              </button>
              {isWorkoutTipOpen ? (
                <div
                  id="workout-tip"
                  role="tooltip"
                  className="absolute top-full left-1/2 z-10 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-border/70 bg-popover px-4 py-3 text-left text-sm leading-6 text-popover-foreground shadow-lg shadow-primary/10"
                >
                  {workout.instructions}
                </div>
              ) : null}
            </div>
          </div>
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
                  currentStep === "START"
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
          <div className="flex flex-1 flex-col justify-center space-y-4 pt-2 text-center">
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

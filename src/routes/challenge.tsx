import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft, CircleHelp } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { ChallengeSequencePhase } from "@/lib/challenge-sequence"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { getChallengeSequence } from "@/lib/challenge-sequence"
import { storeChallenge } from "@/lib/challenges"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})

function ChallengeScreen() {
  const [target] = useState(() => getRandomTarget())
  const [workout] = useState(() => getRandomWorkout())
  const challengeSequence = getChallengeSequence(target, workout)
  const initialStep = challengeSequence[0]
  const [hasStarted, setHasStarted] = useState(false)
  const [isWorkoutTipOpen, setIsWorkoutTipOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(initialStep.label)
  const [sequencePhase, setSequencePhase] = useState<ChallengeSequencePhase>(
    initialStep.phase
  )
  const sequenceTimeoutRef = useRef<number | null>(null)
  const sequenceSessionRef = useRef(0)

  useEffect(() => {
    void initializeSpeech()

    return () => {
      clearSequence()
    }
  }, [])

  function clearSequence() {
    sequenceSessionRef.current += 1

    if (sequenceTimeoutRef.current !== null) {
      window.clearTimeout(sequenceTimeoutRef.current)
      sequenceTimeoutRef.current = null
    }

    void cancelSpeech()
  }

  function runSequenceStep(stepIndex: number, sessionId: number) {
    if (sequenceSessionRef.current !== sessionId) {
      return
    }

    const step = challengeSequence[stepIndex]

    setCurrentStep(step.label)
    setSequencePhase(step.phase)
    void speakText(step.speech)

    if (step.phase === "complete") {
      sequenceTimeoutRef.current = null

      try {
        storeChallenge({
          challenge_type: workout.id,
          timestamp: new Date().toISOString(),
          amount: target,
        })
      } catch {
        // Ignore storage failures so the challenge flow can finish on screen.
      }

      return
    }

    sequenceTimeoutRef.current = window.setTimeout(() => {
      runSequenceStep(stepIndex + 1, sessionId)
    }, step.delayMs ?? 0)
  }

  function handleStart() {
    const sessionId = sequenceSessionRef.current + 1
    sequenceSessionRef.current = sessionId

    if (sequenceTimeoutRef.current !== null) {
      window.clearTimeout(sequenceTimeoutRef.current)
      sequenceTimeoutRef.current = null
    }

    void cancelSpeech()
    setHasStarted(true)
    setCurrentStep(initialStep.label)
    setSequencePhase(initialStep.phase)
    runSequenceStep(0, sessionId)
  }

  function handleExit() {
    clearSequence()
  }

  const isWordStep = Number.isNaN(Number(currentStep))
  const stageHint =
    sequencePhase === "countdown"
      ? "Get into position"
      : sequencePhase === "active"
        ? "Follow the audio count"
        : "Challenge complete"

  return (
    <AppScreen
      headerStart={
        hasStarted ? null : (
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
          >
            <ChevronLeft className="size-4" />
            <span>Home</span>
          </Link>
        )
      }
      headerEnd={
        hasStarted ? (
          <Link
            to="/"
            onClick={handleExit}
            className="text-sm font-medium text-primary transition-opacity hover:opacity-75"
          >
            Exit
          </Link>
        ) : null
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
                  isWordStep
                    ? "text-5xl font-semibold tracking-[0.24em] text-primary uppercase sm:text-6xl"
                    : "text-8xl leading-none font-semibold tracking-[-0.08em] text-foreground sm:text-[8rem]"
                }
              >
                {currentStep}
              </p>
            </section>
            <p className="text-center text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
              {stageHint}
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

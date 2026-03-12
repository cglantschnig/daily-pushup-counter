import { Link, useNavigate } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { ChevronLeft, CircleHelp, DoorOpen } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { ChallengeSequencePhase } from "@/lib/challenge-sequence"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { getChallengeSequence } from "@/lib/challenge-sequence"
import {
  ChallengeSaveError,
  type ChallengePayload,
  saveChallengeCompletion,
} from "@/lib/challenge-completion"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"
import { api } from "../../convex/_generated/api"

export function ChallengeScreen() {
  const navigate = useNavigate()
  const saveChallenge = useMutation(api.challenges.create)
  const [target] = useState(() => getRandomTarget())
  const [workout] = useState(() => getRandomWorkout())
  const challengeSequence = getChallengeSequence(target, workout)
  const initialStep = challengeSequence[0]
  const [hasStarted, setHasStarted] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isWorkoutTipOpen, setIsWorkoutTipOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(initialStep.label)
  const [sequencePhase, setSequencePhase] = useState<ChallengeSequencePhase>(
    initialStep.phase
  )
  const sequenceTimeoutRef = useRef<number | null>(null)
  const sequenceSessionRef = useRef(0)
  const completionPayloadRef = useRef<ChallengePayload | null>(null)

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
    if (step.speech) {
      void speakText(step.speech)
    }

    if (step.phase === "complete") {
      sequenceTimeoutRef.current = null
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
    setSaveError(null)
    completionPayloadRef.current = null
    setCurrentStep(initialStep.label)
    setSequencePhase(initialStep.phase)
    runSequenceStep(0, sessionId)
  }

  function handleExit() {
    clearSequence()
  }

  async function handleComplete() {
    if (isCompleting) {
      return
    }

    setIsCompleting(true)
    setSaveError(null)
    clearSequence()

    try {
      const payload = await saveChallengeCompletion({
        existingPayload: completionPayloadRef.current,
        workoutId: workout.id,
        target,
        saveChallenge,
        navigateHome: () => navigate({ to: "/" }),
      })

      completionPayloadRef.current = payload
    } catch (error) {
      if (error instanceof ChallengeSaveError) {
        completionPayloadRef.current = error.payload
        setSaveError(error.message)
      } else {
        setSaveError("Could not save this challenge. Check your connection and retry.")
      }

      setIsCompleting(false)
    }
  }

  const isWordStep = Number.isNaN(Number(currentStep))

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
            className="inline-flex items-center gap-1 text-sm font-medium text-destructive transition-opacity hover:opacity-75"
          >
            <DoorOpen className="size-4" />
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
                  className="absolute top-full left-1/2 z-10 mt-4 w-64 -translate-x-1/2 rounded-xl border border-border/70 bg-popover px-5 py-4 text-left text-sm leading-6 text-popover-foreground shadow-lg shadow-primary/10"
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
          <div className="flex flex-1 flex-col justify-center pt-2">
            <section className="countdown-stage flex min-h-80 items-center justify-center rounded-[2rem] border border-border/70 bg-card/68 p-6 shadow-[0_28px_80px_rgba(17,72,137,0.16)] dark:shadow-[0_28px_80px_rgba(3,8,20,0.36)]">
              {sequencePhase === "complete" ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="text-lg font-semibold tracking-[0.24em] text-primary uppercase transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
                  >
                    Done
                  </button>
                  {saveError ? (
                    <>
                      <p className="max-w-xs text-sm leading-6 text-destructive">
                        {saveError}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleComplete}
                        disabled={isCompleting}
                        className="rounded-2xl text-xs font-semibold tracking-[0.18em] uppercase"
                      >
                        Retry Save
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : (
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
              )}
            </section>
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

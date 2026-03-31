import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { Flag, LoaderCircle, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { ChallengePayload } from "@/lib/challenge-completion"
import type { ChallengeSequencePhase } from "@/lib/challenge-sequence"
import {
  ChallengeSaveError,
  saveChallengeCompletion,
} from "@/lib/challenge-completion"
import { getChallengeSequence } from "@/lib/challenge-sequence"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export function ChallengeScreen() {
  const navigate = useNavigate()
  const saveChallenge = useMutation(api.challenges.create)
  const [workout] = useState(() => getRandomWorkout())
  const [target] = useState(() => getRandomTarget(workout))
  const challengeSequence = getChallengeSequence(target, workout)
  const initialStep = challengeSequence[0]
  const [hasStarted, setHasStarted] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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

  function resetChallengeState() {
    clearSequence()
    completionPayloadRef.current = null
    setHasStarted(false)
    setIsCompleting(false)
    setSaveError(null)
    setCurrentStep(initialStep.label)
    setSequencePhase(initialStep.phase)
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
    setIsCompleting(false)
    setSaveError(null)
    completionPayloadRef.current = null
    setCurrentStep(initialStep.label)
    setSequencePhase(initialStep.phase)
    runSequenceStep(0, sessionId)
  }

  function handleExit() {
    resetChallengeState()
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
        navigateHome: () => navigate({ to: "/history" }),
      })

      completionPayloadRef.current = payload
    } catch (error) {
      if (error instanceof ChallengeSaveError) {
        completionPayloadRef.current = error.payload
        setSaveError(error.message)
      } else {
        setSaveError(
          "Could not save this challenge. Check your connection and retry."
        )
      }

      setIsCompleting(false)
    }
  }

  const isWordStep = Number.isNaN(Number(currentStep))
  const stageLabel =
    sequencePhase === "complete"
      ? "Set finished"
      : hasStarted
        ? "Live countdown"
        : "Ready to start"

  return (
    <AppShell
      section="challenge"
      eyebrow="Default Screen"
      title="Challenge"
      subtitle="Launch straight into the next set, follow the audio countdown, and save the result into your training history."
      headerAction={
        hasStarted ? (
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/8 px-4 py-2 text-sm font-semibold text-destructive transition-opacity hover:opacity-80"
          >
            <X className="size-4" />
            Cancel set
          </button>
        ) : null
      }
    >
      <section className="countdown-stage flex min-h-[28rem] flex-col px-3 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.28em] text-primary uppercase">
              Today&apos;s draw
            </p>
            <h2 className="mt-3 text-[clamp(2.2rem,5vw,4.4rem)] leading-none font-semibold tracking-[-0.09em] text-foreground">
              {workout.label}
            </h2>
          </div>

          <div className="text-right">
            <p className="[font-family:var(--font-display)] text-[0.68rem] tracking-[0.24em] text-muted-foreground uppercase">
              Target
            </p>
            <p className="mt-2 text-4xl leading-none font-semibold tracking-[-0.08em] text-foreground">
              {target}
            </p>
            <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              reps
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          {hasStarted ? (
            sequencePhase === "complete" ? (
              <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <p className="[font-family:var(--font-display)] text-[0.76rem] tracking-[0.3em] text-primary uppercase">
                  Session complete
                </p>
                <h3 className="text-5xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                  Save that set.
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Store this result in your history, then come back for the next
                  challenge.
                </p>

                <Button
                  type="button"
                  size="lg"
                  disabled={isCompleting}
                  onClick={handleComplete}
                  className="h-14 rounded-full px-8 text-sm font-semibold tracking-[0.18em] uppercase"
                >
                  {isCompleting ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Flag className="size-4" />
                  )}
                  {isCompleting ? "Saving..." : "Save Session"}
                </Button>

                {saveError ? (
                  <p className="text-sm leading-6 text-destructive">{saveError}</p>
                ) : null}
              </div>
            ) : (
              <div className="text-center">
                <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.28em] text-primary uppercase">
                  {stageLabel}
                </p>
                <p
                  aria-live="assertive"
                  className={
                    isWordStep
                      ? "mt-6 text-5xl font-semibold tracking-[0.24em] text-primary uppercase sm:text-6xl"
                      : "mt-6 text-[clamp(5rem,18vw,9rem)] leading-none font-semibold tracking-[-0.1em] text-foreground"
                  }
                >
                  {currentStep}
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <button
                type="button"
                onClick={handleStart}
                className="go-button-pulse flex h-48 w-48 items-center justify-center rounded-full border border-primary/20 bg-primary text-3xl font-semibold tracking-[0.3em] text-primary-foreground uppercase shadow-[0_28px_70px_rgba(247,86,54,0.35)] transition-transform hover:scale-[1.02] sm:h-56 sm:w-56"
              >
                GO
              </button>
              <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Tap to begin the countdown
              </p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  )
}

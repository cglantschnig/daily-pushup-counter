import { useNavigate } from "@tanstack/react-router"
import { useMutation } from "convex/react"
import { Flag, LoaderCircle, Volume2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { api } from "../../convex/_generated/api"
import type { ChallengeSequencePhase } from "@/lib/challenge-sequence"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { getChallengeSequence } from "@/lib/challenge-sequence"
import {
  ChallengeSaveError,
  type ChallengePayload,
  saveChallengeCompletion,
} from "@/lib/challenge-completion"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"

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
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground">
            <Volume2 className="size-4 text-primary" />
            Audio cues ready
          </div>
        )
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(21rem,0.9fr)]">
        <section className="countdown-stage flex min-h-[28rem] flex-col rounded-[2.3rem] border border-border/70 bg-card/72 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="[font-family:var(--font-display)] text-[0.72rem] tracking-[0.28em] text-primary uppercase">
                Today&apos;s draw
              </p>
              <h2 className="mt-3 text-[clamp(2.2rem,5vw,4.4rem)] leading-none font-semibold tracking-[-0.09em] text-foreground">
                {workout.label}
              </h2>
            </div>

            <div className="rounded-[1.7rem] border border-border/70 bg-background/88 px-5 py-4 text-right shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
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
                    Store this result in your history, then come back for the
                    next challenge.
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
                    <div className="rounded-[1.4rem] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm leading-6 text-destructive">
                      {saveError}
                    </div>
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

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-border/60 bg-background/72 px-4 py-3">
            <div>
              <p className="[font-family:var(--font-display)] text-[0.68rem] tracking-[0.24em] text-muted-foreground uppercase">
                Session state
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {hasStarted
                  ? sequencePhase === "complete"
                    ? "Countdown finished. Save the result."
                    : "Keep pace with the voice prompts."
                  : "Fresh challenge ready whenever you are."}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              {stageLabel}
            </div>
          </div>
        </section>

        <div className="grid gap-5">
          <section className="rounded-[2rem] border border-border/70 bg-card/74 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <p className="[font-family:var(--font-display)] text-[0.7rem] tracking-[0.26em] text-primary uppercase">
              Form cue
            </p>
            <p className="mt-3 text-2xl leading-none font-semibold tracking-[-0.06em] text-foreground">
              Clean reps first.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {workout.instructions}
            </p>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-card/74 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <p className="[font-family:var(--font-display)] text-[0.7rem] tracking-[0.26em] text-primary uppercase">
              Flow
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-[1.4rem] border border-border/60 bg-background/78 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  1. Start
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Open the challenge and begin from this screen by default.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-border/60 bg-background/78 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  2. Train
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Follow the audio countdown and finish the assigned reps.
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-border/60 bg-background/78 px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  3. Save
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Completed sets land in history so you can review progress.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

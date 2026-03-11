import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"
import {
  getRandomTarget,
  getRandomWorkout,
  getWorkoutLabel,
  isWorkoutId,
} from "@/lib/workouts"

const COUNTDOWN_STEPS = [
  { label: "3", speech: "3", delay: 0 },
  { label: "2", speech: "2", delay: 1000 },
  { label: "1", speech: "1", delay: 2000 },
  { label: "START", speech: "Start", delay: 3000 },
] as const

export const Route = createFileRoute("/workout")({
  validateSearch: (search: Record<string, unknown>) => {
    const parsedTarget =
      typeof search.target === "string" || typeof search.target === "number"
        ? Number(search.target)
        : Number.NaN
    const rawWorkout =
      typeof search.workout === "string" ? search.workout : getRandomWorkout().id

    return {
      target: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : getRandomTarget(),
      workout: isWorkoutId(rawWorkout) ? rawWorkout : getRandomWorkout().id,
    }
  },
  component: WorkoutScreen,
})

function WorkoutScreen() {
  const { target, workout } = Route.useSearch()
  const [currentStep, setCurrentStep] = useState<(typeof COUNTDOWN_STEPS)[number]["label"]>("3")
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
    void initializeSpeech()

    COUNTDOWN_STEPS.forEach((step) => {
      if (step.delay === 0) {
        announceStep(step)
        return
      }

      const timeoutId = window.setTimeout(() => {
        announceStep(step)
      }, step.delay)

      timeoutIdsRef.current.push(timeoutId)
    })

    return () => {
      clearSequence()
    }
  }, [announceStep, clearSequence])

  return (
    <AppScreen
      headerStart={
        <Link
          to="/challenge"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          <ChevronLeft className="size-4" />
          <span>Challenge</span>
        </Link>
      }
      showBranding={false}
      title="Workout"
      subtitle="Audio-assisted countdown before you start your set."
    >
      <div className="flex h-full flex-col justify-center gap-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[1.75rem] border border-border/70 bg-card/72 p-5 text-center shadow-sm shadow-primary/5 dark:shadow-black/20">
            <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
              Workout
            </p>
            <p className="mt-3 text-3xl leading-none font-semibold tracking-[-0.05em] text-foreground">
              {getWorkoutLabel(workout)}
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border/70 bg-card/72 p-5 text-center shadow-sm shadow-primary/5 dark:shadow-black/20">
            <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
              Target Reps
            </p>
            <p className="mt-3 text-5xl leading-none font-semibold tracking-[-0.08em] text-foreground">
              {target}
            </p>
          </article>
        </section>

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
      </div>
    </AppScreen>
  )
}

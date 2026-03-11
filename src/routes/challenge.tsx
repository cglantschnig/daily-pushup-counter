import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { StarBorder } from "@/components/ui/star-border"
import { storeChallenge } from "@/lib/challenges"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"

const COUNTDOWN_INTERVAL_MS = 1000
const REP_INTERVAL_MS = 1800

const WORKOUT_OPTIONS = [
  {
    id: "pushup",
    label: "Pushups",
  },
] as const

type ChallengePhase = "ready" | "active"
type WorkoutOption = (typeof WORKOUT_OPTIONS)[number]

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})

function getRandomTarget() {
  return Math.floor(Math.random() * 6) + 5
}

function getRandomWorkout() {
  return WORKOUT_OPTIONS[Math.floor(Math.random() * WORKOUT_OPTIONS.length)]!
}

function ChallengeScreen() {
  const [target, setTarget] = useState(() => getRandomTarget())
  const [workout, setWorkout] = useState<WorkoutOption>(() => getRandomWorkout())
  const [phase, setPhase] = useState<ChallengePhase>("ready")
  const timeoutIdsRef = useRef<Array<number>>([])

  const speak = useEffectEvent((message: string) => {
    void speakText(message)
  })

  const clearSequence = useEffectEvent(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    timeoutIdsRef.current = []

    void cancelSpeech()
  })

  const queueStep = useEffectEvent((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(callback, delay)
    timeoutIdsRef.current.push(timeoutId)
  })

  const finishChallenge = useEffectEvent(() => {
    try {
      storeChallenge({
        challenge_type: workout.id,
        timestamp: new Date().toISOString(),
        amount: target,
      })
    } catch {
      // Ignore storage failures and still let the user finish the session.
    }

    speak("Done")
    setTarget(getRandomTarget())
    setWorkout(getRandomWorkout())
    setPhase("ready")
  })

  useEffect(() => {
    void initializeSpeech()

    return () => {
      clearSequence()
    }
  }, [clearSequence])

  function startChallenge() {
    clearSequence()
    setPhase("active")
    speak("3")

    queueStep(() => {
      speak("2")
    }, COUNTDOWN_INTERVAL_MS)

    queueStep(() => {
      speak("1")
    }, COUNTDOWN_INTERVAL_MS * 2)

    queueStep(() => {
      speak("Go")
    }, COUNTDOWN_INTERVAL_MS * 3)

    for (let count = 1; count <= target; count += 1) {
      queueStep(() => {
        speak(String(count))
      }, COUNTDOWN_INTERVAL_MS * 4 + REP_INTERVAL_MS * (count - 1))
    }

    queueStep(finishChallenge, COUNTDOWN_INTERVAL_MS * 4 + REP_INTERVAL_MS * target)
  }

  const isActive = phase === "active"

  return (
    <AppScreen
      headerStart={
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          <ChevronLeft className="size-4" />
          <span>Home</span>
        </Link>
      }
      showBranding={false}
    >
      <div className="flex h-full flex-col justify-center gap-5 py-6">
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

        <div className="pt-1">
          <StarBorder>
            <Button
              size="lg"
              className="h-24 w-full rounded-[1.55rem] border-0 bg-primary text-xl font-semibold tracking-[0.24em] uppercase shadow-none hover:bg-primary/92"
              onClick={startChallenge}
              disabled={isActive}
            >
              GO
            </Button>
          </StarBorder>
        </div>
      </div>
    </AppScreen>
  )
}

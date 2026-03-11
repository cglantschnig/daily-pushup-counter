import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { storeChallenge } from "@/lib/challenges"
import { cancelSpeech, initializeSpeech, speakText } from "@/lib/speech"

const COUNTDOWN_INTERVAL_MS = 1000
const REP_INTERVAL_MS = 1800

type ChallengePhase = "ready" | "countdown" | "running" | "complete"

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})

function getRandomTarget() {
  return Math.floor(Math.random() * 6) + 5
}

function ChallengeScreen() {
  const [target, setTarget] = useState(() => getRandomTarget())
  const [phase, setPhase] = useState<ChallengePhase>("ready")
  const [countdownValue, setCountdownValue] = useState("3")
  const [currentCount, setCurrentCount] = useState(0)
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
        challenge_type: "pushup",
        timestamp: new Date().toISOString(),
        amount: target,
      })
    } catch {
      // Ignore storage failures and still let the user finish the session.
    }

    setPhase("complete")
    speak("Done")
  })

  useEffect(() => {
    void initializeSpeech()

    return () => {
      clearSequence()
    }
  }, [clearSequence])

  function resetChallenge() {
    clearSequence()
    setTarget(getRandomTarget())
    setPhase("ready")
    setCountdownValue("3")
    setCurrentCount(0)
  }

  function startChallenge() {
    clearSequence()
    setPhase("countdown")
    setCountdownValue("3")
    setCurrentCount(0)
    speak("3")

    queueStep(() => {
      setCountdownValue("2")
      speak("2")
    }, COUNTDOWN_INTERVAL_MS)

    queueStep(() => {
      setCountdownValue("1")
      speak("1")
    }, COUNTDOWN_INTERVAL_MS * 2)

    queueStep(() => {
      setCountdownValue("GO")
      speak("Go")
    }, COUNTDOWN_INTERVAL_MS * 3)

    for (let count = 1; count <= target; count += 1) {
      queueStep(() => {
        setPhase("running")
        setCurrentCount(count)
        speak(String(count))
      }, COUNTDOWN_INTERVAL_MS * 4 + REP_INTERVAL_MS * (count - 1))
    }

    queueStep(finishChallenge, COUNTDOWN_INTERVAL_MS * 4 + REP_INTERVAL_MS * target)
  }

  const isActive = phase === "countdown" || phase === "running"

  return (
    <AppScreen
      title="Challenge"
      subtitle="Follow the spoken countdown, then match your reps to the spoken count."
    >
      <div className="flex h-full flex-col gap-6">
        <div className="rounded-[1.75rem] border border-border/70 bg-card/70 p-5 shadow-sm shadow-primary/5 dark:shadow-black/20">
          <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
            Target Reps
          </p>
          <p className="mt-3 text-7xl leading-none font-semibold tracking-[-0.08em] text-foreground">
            {target}
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center rounded-[1.75rem] border border-border/70 bg-card/74 px-6 py-8 text-center shadow-inner shadow-primary/6 dark:shadow-black/20">
          {phase === "ready" ? (
            <>
              <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
                Random Challenge
              </p>
              <p className="mt-4 text-5xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                {target}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Press GO when you are in position.
              </p>
            </>
          ) : null}

          {phase === "countdown" ? (
            <>
              <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
                Countdown
              </p>
              <p className="mt-4 text-6xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                {countdownValue}
              </p>
            </>
          ) : null}

          {phase === "running" ? (
            <>
              <p className="text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
                Count
              </p>
              <p className="mt-4 text-6xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                {currentCount}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Keep moving until you hit {target}.
              </p>
            </>
          ) : null}

          {phase === "complete" ? (
            <>
              <p className="text-sm font-medium tracking-[0.3em] text-primary uppercase">
                Complete
              </p>
              <p className="mt-4 text-5xl leading-none font-semibold tracking-[-0.08em] text-foreground">
                {target} reps
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This challenge has been saved to your history.
              </p>
            </>
          ) : null}
        </div>

        <div className="grid gap-3">
          {phase === "ready" ? (
            <Button
              size="lg"
              className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
              onClick={startChallenge}
            >
              GO
            </Button>
          ) : null}

          {phase === "complete" ? (
            <Button
              size="lg"
              className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
              onClick={resetChallenge}
            >
              Next Challenge
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="lg"
            className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
            onClick={resetChallenge}
            disabled={isActive}
          >
            New Number
          </Button>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-2xl text-sm font-semibold tracking-[0.18em] uppercase"
          >
            <Link to="/history">View History</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-2xl text-sm font-semibold tracking-[0.18em] uppercase"
          >
            <Link to="/">Back Home</Link>
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}

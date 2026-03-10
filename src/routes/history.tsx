import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import type { ChallengeRecord } from "@/lib/challenges"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { getStoredChallenges } from "@/lib/challenges"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export const Route = createFileRoute("/history")({
  component: HistoryScreen,
})

function HistoryScreen() {
  const [challenges, setChallenges] = useState<Array<ChallengeRecord>>([])

  useEffect(() => {
    setChallenges(getStoredChallenges().slice(0, 20))
  }, [])

  return (
    <AppScreen
      title="History"
      subtitle="Your 20 most recent pushup challenges are stored on this device."
    >
      <div className="flex h-full flex-col gap-6">
        <div className="flex-1 space-y-3">
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <article
                key={challenge.id}
                className="rounded-[1.5rem] border border-[#f0d9c4] bg-[#fff7ef] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium tracking-[0.3em] text-primary uppercase">
                      {challenge.challenge_type}
                    </p>
                    <p className="mt-2 text-2xl leading-none font-semibold tracking-[-0.05em] text-[#1f130b]">
                      {challenge.amount} reps
                    </p>
                  </div>
                  <p className="max-w-[11rem] text-right text-xs leading-5 text-[#6b5140]">
                    {dateFormatter.format(new Date(challenge.timestamp))}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[#e7c5a8] bg-white/55 px-5 py-8 text-center text-sm leading-6 text-[#6b5140]">
              No challenges saved yet. Complete a pushup challenge to see it here.
            </div>
          )}
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
            <Link to="/">Back Home</Link>
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}

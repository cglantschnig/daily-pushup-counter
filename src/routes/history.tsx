import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useEffect, useState } from "react"
import type { ChallengeRecord } from "@/lib/challenges"
import { AppScreen } from "@/components/app-screen"
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
      title="History"
      subtitle="Recent pushup sets saved on this device."
    >
      <div className="flex h-full flex-col gap-6">
        <section className="flex-1 rounded-[1.75rem] border border-primary/12 bg-white/60 p-5 shadow-sm shadow-primary/5">
          {challenges.length > 0 ? (
            <div className="space-y-4">
              {challenges.map((challenge, index) => (
                <article key={challenge.id}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-2xl leading-none font-semibold tracking-[-0.05em] text-foreground">
                      {challenge.amount} reps
                    </p>
                    <p className="max-w-[11rem] text-right text-sm leading-6 text-muted-foreground">
                      {dateFormatter.format(new Date(challenge.timestamp))}
                    </p>
                  </div>

                  {index < challenges.length - 1 ? (
                    <div className="mt-4 h-px bg-primary/10" />
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-primary/20 bg-white/52 px-5 py-8 text-center text-sm leading-6 text-muted-foreground">
              No challenges saved yet. Complete a pushup challenge to see it here.
            </div>
          )}
        </section>
      </div>
    </AppScreen>
  )
}

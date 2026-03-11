import { Link, createFileRoute } from "@tanstack/react-router"
import { ChevronLeft } from "lucide-react"
import { useState } from "react"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"
import { getRandomTarget, getRandomWorkout } from "@/lib/workouts"

export const Route = createFileRoute("/challenge")({
  component: ChallengeScreen,
})

function ChallengeScreen() {
  const [target] = useState(() => getRandomTarget())
  const [workout] = useState(() => getRandomWorkout())

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

        <div className="space-y-4 pt-2 text-center">
          <Button
            asChild
            size="lg"
            className="go-button-pulse mx-auto h-48 w-48 rounded-full border-0 bg-primary text-3xl font-semibold tracking-[0.28em] uppercase shadow-[0_26px_70px_rgba(17,87,166,0.35)] hover:bg-primary/92 sm:h-56 sm:w-56"
          >
            <Link
              to="/workout"
              search={{
                target,
                workout: workout.id,
              }}
            >
              GO
            </Link>
          </Button>
          <p className="text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
            Tap to begin
          </p>
        </div>
      </div>
    </AppScreen>
  )
}

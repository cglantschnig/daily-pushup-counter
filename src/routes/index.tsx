import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { AppScreen } from "@/components/app-screen"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <AppScreen>
      <div className="flex h-full flex-col justify-center gap-10 py-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl leading-none font-semibold tracking-[-0.06em] text-foreground">
            Daily Pushup Counter
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Start a challenge or review your recent sessions.
          </p>
        </div>

        <div className="grid gap-3">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <Link to="/challenge">Start Challenge</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 rounded-2xl text-sm font-semibold tracking-[0.2em] uppercase"
          >
            <Link to="/history">View History</Link>
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}

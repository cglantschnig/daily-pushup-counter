import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { AppScreen } from "@/components/app-screen"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <AppScreen showBranding={false}>
      <div className="flex h-full flex-col justify-center gap-10 py-8">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-32 items-center justify-center rounded-[2rem] border border-primary/15 bg-linear-to-br from-white via-accent/30 to-primary/15 shadow-[0_28px_60px_rgba(17,87,166,0.2)]">
            <img
              src="/android-chrome-192x192.png"
              alt="Daily Pushup Counter logo"
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="bg-linear-to-r from-primary via-sky-500 to-primary bg-clip-text text-4xl leading-none font-semibold tracking-[0.28em] text-transparent uppercase sm:text-5xl">
            DAILY PUSHUP COUNTER
          </h1>
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
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-2xl text-sm font-semibold tracking-[0.18em] uppercase"
          >
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}

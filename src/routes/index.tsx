import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { AppScreen } from "@/components/app-screen"
import { StarBorder } from "@/components/ui/star-border"
import { requireAuthenticatedUser } from "@/lib/require-auth"

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => requireAuthenticatedUser(location.href),
  component: App,
})

function App() {
  return (
    <AppScreen showBranding={false}>
      <div className="flex h-full flex-col justify-center gap-10 py-8">
        <div className="space-y-5 text-center">
          <img
            src="/android-chrome-192x192.png"
            alt="Daily Pushup Counter logo"
            className="mx-auto h-28 w-28 rounded-[1.8rem] object-contain shadow-[0_26px_60px_rgba(17,87,166,0.2)] sm:h-32 sm:w-32"
          />
          <h1 className="bg-linear-to-r from-primary via-sky-500 to-primary bg-clip-text text-[clamp(1.1rem,5vw,1.85rem)] leading-none font-semibold tracking-[0.08em] whitespace-nowrap text-transparent uppercase sm:text-[2rem]">
            DAILY PUSHUP COUNTER
          </h1>
        </div>

        <div className="grid gap-3">
          <StarBorder>
            <Button
              asChild
              size="lg"
              className="h-14 w-full rounded-[1.55rem] border-0 bg-primary text-sm font-semibold tracking-[0.2em] uppercase shadow-none hover:bg-primary/92"
            >
              <Link to="/challenge">Start Challenge</Link>
            </Button>
          </StarBorder>
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

import { Link } from "@tanstack/react-router"
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"
import { AppScreen } from "@/components/app-screen"
import { Button } from "@/components/ui/button"

type ConvexAuthGateProps = {
  loadingTitle: string
  unavailableTitle: string
  unavailableMessage: string
  children: React.ReactNode
}

export function ConvexAuthGate({
  loadingTitle,
  unavailableTitle,
  unavailableMessage,
  children,
}: ConvexAuthGateProps) {
  return (
    <>
      <AuthLoading>
        <AuthLoadingScreen title={loadingTitle} />
      </AuthLoading>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <AppScreen
          showBranding={false}
          title={unavailableTitle}
          subtitle={unavailableMessage}
        >
          <div className="flex flex-1 flex-col justify-center gap-3 py-6">
            <Button
              type="button"
              size="lg"
              onClick={() => window.location.reload()}
              className="h-14 rounded-2xl text-sm font-semibold tracking-[0.18em] uppercase"
            >
              Retry
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-2xl text-sm font-semibold tracking-[0.18em] uppercase"
            >
              <Link to="/">Back Home</Link>
            </Button>
          </div>
        </AppScreen>
      </Unauthenticated>
    </>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { ChallengeScreen } from "@/components/challenge-screen"
import { ConvexAuthGate } from "@/components/convex-auth-gate"
import { requireAuthenticatedUser } from "@/lib/require-auth"

export const Route = createFileRoute("/challenge")({
  beforeLoad: ({ location }) => requireAuthenticatedUser(location.href),
  component: ChallengeRouteComponent,
})

function ChallengeRouteComponent() {
  return (
    <ConvexAuthGate
      loadingTitle="Loading challenge"
      unavailableTitle="Challenge unavailable"
      unavailableMessage="Your account is signed in, but the app could not connect that session to Convex. Refresh and try again."
    >
        <ChallengeScreen />
    </ConvexAuthGate>
  )
}

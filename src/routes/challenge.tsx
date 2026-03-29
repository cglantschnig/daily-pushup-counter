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
      unavailableMessage="Your account is signed in, but Clerk could not issue the `convex` JWT template Convex expects. Create that template in Clerk, make sure this app and Convex use the same Clerk instance, then refresh and try again."
    >
      <ChallengeScreen />
    </ConvexAuthGate>
  )
}

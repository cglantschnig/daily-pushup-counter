import { AuthLoading, Authenticated } from "convex/react"
import { createFileRoute } from "@tanstack/react-router"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"
import { ChallengeScreen } from "@/components/challenge-screen"
import { requireAuthenticatedUser } from "@/lib/require-auth"

export const Route = createFileRoute("/challenge")({
  beforeLoad: ({ location }) => requireAuthenticatedUser(location.href),
  component: ChallengeRouteComponent,
})

function ChallengeRouteComponent() {
  return (
    <>
      <AuthLoading>
        <AuthLoadingScreen title="Loading challenge" />
      </AuthLoading>
      <Authenticated>
        <ChallengeScreen />
      </Authenticated>
    </>
  )
}

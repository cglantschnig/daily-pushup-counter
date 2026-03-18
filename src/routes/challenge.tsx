import { AuthLoading, Authenticated } from "convex/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"
import { ChallengeScreen } from "@/components/challenge-screen"
import { getSignInHref } from "@/lib/auth-redirect"
import { getAuthState } from "@/lib/require-auth"

export const Route = createFileRoute("/challenge")({
  beforeLoad: async ({ location }) => {
    const { userId } = await getAuthState()

    if (!userId) {
      throw redirect({ href: getSignInHref(location.href) })
    }
  },
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

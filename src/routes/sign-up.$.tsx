import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { SignUp } from "@clerk/tanstack-react-start"
import { AppScreen } from "@/components/app-screen"
import {
  getAuthSearch,
  getSignInHref,
  validateRedirectTo,
} from "@/lib/auth-redirect"
import { getAuthState } from "@/lib/require-auth"

export const Route = createFileRoute("/sign-up/$")({
  validateSearch: (search) => getAuthSearch(search),
  beforeLoad: async ({ search }) => {
    const { userId } = await getAuthState()

    if (userId) {
      throw redirect({ href: validateRedirectTo(search.redirectTo) })
    }
  },
  component: SignUpScreen,
})

function SignUpScreen() {
  const search = Route.useSearch()
  const redirectTo = validateRedirectTo(search.redirectTo)

  return (
    <AppScreen
      headerStart={
        <Link
          to="/sign-in/$"
          params={{ _splat: "" }}
          search={{ redirectTo }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          <span>Sign in</span>
        </Link>
      }
      showBranding={false}
      title="Create account"
      subtitle="Create an account to keep your workout history private to you."
    >
      <div className="flex flex-1 items-center justify-center py-4">
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl={getSignInHref(redirectTo)}
          fallbackRedirectUrl={redirectTo}
          forceRedirectUrl={redirectTo}
        />
      </div>
    </AppScreen>
  )
}

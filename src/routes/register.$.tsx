import { SignUp } from "@clerk/tanstack-react-start"
import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { AuthShell } from "@/components/auth-shell"
import {
  getAuthSearch,
  getSignInHref,
  validateRedirectTo,
} from "@/lib/auth-redirect"
import { getAuthState } from "@/lib/require-auth"

export const Route = createFileRoute("/register/$")({
  validateSearch: (search) => getAuthSearch(search),
  beforeLoad: async ({ search }) => {
    const { userId } = await getAuthState()

    if (userId) {
      throw redirect({ href: validateRedirectTo(search.redirectTo) })
    }
  },
  component: RegisterScreen,
})

function RegisterScreen() {
  const search = Route.useSearch()
  const redirectTo = validateRedirectTo(search.redirectTo)

  return (
    <AuthShell
      eyebrow="New Account"
      title="Register"
      subtitle="Create an account to save completed challenges, review your reps, and sync your settings."
      alternateAction={
        <Link
          to="/login/$"
          params={{ _splat: "" }}
          search={{ redirectTo }}
          className="inline-flex rounded-full border border-border/70 bg-card/72 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-card"
        >
          Login
        </Link>
      }
    >
      <div className="w-full">
        <SignUp
          path="/register"
          routing="path"
          signInUrl={getSignInHref(redirectTo)}
          fallbackRedirectUrl={redirectTo}
          forceRedirectUrl={redirectTo}
        />
      </div>
    </AuthShell>
  )
}

import { SignIn } from "@clerk/tanstack-react-start"
import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { AuthShell } from "@/components/auth-shell"
import {
  getAuthSearch,
  getSignUpHref,
  validateRedirectTo,
} from "@/lib/auth-redirect"
import { getAuthState } from "@/lib/require-auth"

export const Route = createFileRoute("/login/$")({
  validateSearch: (search) => getAuthSearch(search),
  beforeLoad: async ({ search }) => {
    const { userId } = await getAuthState()

    if (userId) {
      throw redirect({ href: validateRedirectTo(search.redirectTo) })
    }
  },
  component: LoginScreen,
})

function LoginScreen() {
  const search = Route.useSearch()
  const redirectTo = validateRedirectTo(search.redirectTo)

  return (
    <AuthShell
      eyebrow="Account Access"
      title="Login"
      subtitle="Sign in to start with the challenge screen and keep your workout history private."
      alternateAction={
        <Link
          to="/register/$"
          params={{ _splat: "" }}
          search={{ redirectTo }}
          className="inline-flex rounded-full border border-border/70 bg-card/72 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-card"
        >
          Register
        </Link>
      }
    >
      <div className="w-full">
        <SignIn
          path="/login"
          routing="path"
          signUpUrl={getSignUpHref(redirectTo)}
          fallbackRedirectUrl={redirectTo}
          forceRedirectUrl={redirectTo}
        />
      </div>
    </AuthShell>
  )
}

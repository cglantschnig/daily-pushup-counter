import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { SignIn } from "@clerk/tanstack-react-start"
import { ChevronLeft } from "lucide-react"
import { AppScreen } from "@/components/app-screen"
import {
  getAuthSearch,
  getSignUpHref,
  validateRedirectTo,
} from "@/lib/auth-redirect"
import { getAuthState } from "@/lib/require-auth"

export const Route = createFileRoute("/sign-in/$")({
  validateSearch: (search) => getAuthSearch(search),
  beforeLoad: async ({ search }) => {
    const { userId } = await getAuthState()

    if (userId) {
      throw redirect({ href: validateRedirectTo(search.redirectTo) })
    }
  },
  component: SignInScreen,
})

function SignInScreen() {
  const search = Route.useSearch()
  const redirectTo = validateRedirectTo(search.redirectTo)

  return (
    <AppScreen
      headerStart={
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          <ChevronLeft className="size-4" />
          <span>Home</span>
        </Link>
      }
      showBranding={false}
      title="Sign in"
      subtitle="Sign in to save workouts to your personal history."
    >
      <div className="flex flex-1 items-center justify-center py-4">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl={getSignUpHref(redirectTo)}
          fallbackRedirectUrl={redirectTo}
          forceRedirectUrl={redirectTo}
        />
      </div>
    </AppScreen>
  )
}

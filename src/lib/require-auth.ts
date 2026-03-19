import { auth } from "@clerk/tanstack-react-start/server"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getSignInHref } from "@/lib/auth-redirect"

export const getAuthState = createServerFn({ method: "GET" }).handler(
  async () => {
    const { userId } = await auth()

    return {
      userId: userId ?? null,
    }
  }
)

export async function requireAuthenticatedUser(redirectTo: string) {
  const { userId } = await getAuthState()

  if (!userId) {
    throw redirect({ href: getSignInHref(redirectTo) })
  }

  return { userId }
}

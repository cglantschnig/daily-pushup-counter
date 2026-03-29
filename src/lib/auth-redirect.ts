const DEFAULT_AUTH_REDIRECT = "/challenge"

export function validateRedirectTo(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_AUTH_REDIRECT
  }

  const redirectTo = value.trim()

  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT
  }

  return redirectTo
}

export function getAuthSearch(search: Record<string, unknown>) {
  return {
    redirectTo:
      typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }
}

export function getSignInHref(redirectTo?: string) {
  if (!redirectTo) {
    return "/login"
  }

  return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

export function getSignUpHref(redirectTo?: string) {
  if (!redirectTo) {
    return "/register"
  }

  return `/register?redirectTo=${encodeURIComponent(redirectTo)}`
}

import { describe, expect, it } from "vitest"
import {
  getAuthSearch,
  getSignInHref,
  getSignUpHref,
  validateRedirectTo,
} from "./auth-redirect"

describe("auth redirect helpers", () => {
  it("falls back to the home page for invalid redirect targets", () => {
    expect(validateRedirectTo(undefined)).toBe("/")
    expect(validateRedirectTo("https://example.com/history")).toBe("/")
    expect(validateRedirectTo("//example.com/history")).toBe("/")
    expect(validateRedirectTo("history")).toBe("/")
  })

  it("keeps same-app redirect targets", () => {
    expect(validateRedirectTo("/history?tab=week")).toBe("/history?tab=week")
  })

  it("normalizes auth route search parameters", () => {
    expect(getAuthSearch({ redirectTo: "/challenge" })).toEqual({
      redirectTo: "/challenge",
    })
    expect(getAuthSearch({ redirectTo: 123 })).toEqual({
      redirectTo: undefined,
    })
  })

  it("builds auth hrefs with redirect targets", () => {
    expect(getSignInHref("/history?tab=week")).toBe(
      "/sign-in?redirectTo=%2Fhistory%3Ftab%3Dweek"
    )
    expect(getSignUpHref("/challenge")).toBe("/sign-up?redirectTo=%2Fchallenge")
  })
})

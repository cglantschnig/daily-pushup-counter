// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"
import { getStoredChallenges, storeChallenge } from "@/lib/challenges"

describe("challenge storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useRealTimers()
  })

  it("stores pushup challenges with the newest entry first", () => {
    vi.setSystemTime(new Date("2026-03-10T10:00:00.000Z"))
    const firstChallenge = storeChallenge({
      challenge_type: "pushup",
      timestamp: "2026-03-10T10:00:00.000Z",
      amount: 6,
    })

    vi.setSystemTime(new Date("2026-03-10T11:00:00.000Z"))
    const secondChallenge = storeChallenge({
      challenge_type: "pushup",
      timestamp: "2026-03-10T11:00:00.000Z",
      amount: 9,
    })

    const challenges = getStoredChallenges()

    expect(challenges).toHaveLength(2)
    expect(challenges[0]?.id).toBe(secondChallenge.id)
    expect(challenges[1]?.id).toBe(firstChallenge.id)
  })

  it("ignores malformed values in localStorage", () => {
    window.localStorage.setItem(
      "daily-pushup-counter:challenges",
      JSON.stringify([
        {
          id: "valid",
          challenge_type: "pushup",
          timestamp: "2026-03-10T11:00:00.000Z",
          amount: 8,
        },
        {
          challenge_type: "situp",
        },
      ])
    )

    expect(getStoredChallenges()).toEqual([
      {
        id: "valid",
        challenge_type: "pushup",
        timestamp: "2026-03-10T11:00:00.000Z",
        amount: 8,
      },
    ])
  })
})

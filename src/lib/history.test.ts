import { describe, expect, it } from "vitest"
import type { ChallengeRecord } from "@/lib/challenges"
import {
  getCurrentMonthDailyRepTotals,
  getCurrentMonthRange,
} from "@/lib/history"

function createChallenge(
  id: string,
  date: Date,
  reps: number
): ChallengeRecord {
  return {
    id,
    challenge_type: "pushup",
    timestamp: date.toISOString(),
    reps_count: reps,
  }
}

describe("history helpers", () => {
  it("returns the current month start and end timestamps in local time", () => {
    const now = new Date(2026, 2, 20, 9, 0, 0)

    expect(getCurrentMonthRange(now)).toEqual({
      startMs: new Date(2026, 2, 1).getTime(),
      endMs: new Date(2026, 3, 1).getTime(),
    })
  })

  it("sums reps for each day in the current month", () => {
    const now = new Date(2026, 2, 11, 9, 0, 0)
    const totals = getCurrentMonthDailyRepTotals(
      [
        createChallenge("first", new Date(2026, 2, 4, 8, 0, 0), 8),
        createChallenge("second", new Date(2026, 2, 4, 18, 0, 0), 12),
        createChallenge("third", new Date(2026, 2, 11, 7, 0, 0), 10),
      ],
      now
    )

    expect(totals).toHaveLength(31)
    expect(totals[0]).toEqual({ day: 1, totalReps: 0 })
    expect(totals[3]).toEqual({ day: 4, totalReps: 20 })
    expect(totals[10]).toEqual({ day: 11, totalReps: 10 })
  })

  it("ignores workouts outside the current month", () => {
    const now = new Date(2026, 2, 20, 9, 0, 0)
    const totals = getCurrentMonthDailyRepTotals(
      [
        createChallenge("previous-month", new Date(2026, 1, 28, 10, 0, 0), 14),
        createChallenge("current-month", new Date(2026, 2, 31, 12, 0, 0), 9),
        createChallenge("next-month", new Date(2026, 3, 1, 12, 0, 0), 16),
      ],
      now
    )

    expect(totals[30]).toEqual({ day: 31, totalReps: 9 })
    expect(totals.reduce((sum, entry) => sum + entry.totalReps, 0)).toBe(9)
  })
})

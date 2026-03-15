import { describe, expect, it } from "vitest"
import type { ChallengeRecord } from "@/lib/challenges"
import {
  getRollingWeekDailyRepTotals,
  getRollingWeekRange,
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
  it("returns a 7-day rolling range ending tomorrow in local time", () => {
    const now = new Date(2026, 2, 20, 9, 0, 0)

    expect(getRollingWeekRange(now)).toEqual({
      startMs: new Date(2026, 2, 14).getTime(),
      endMs: new Date(2026, 2, 21).getTime(),
    })
  })

  it("sums reps for each day in the rolling week", () => {
    const now = new Date(2026, 2, 20, 9, 0, 0)
    const totals = getRollingWeekDailyRepTotals(
      [
        createChallenge("first", new Date(2026, 2, 16, 8, 0, 0), 8),
        createChallenge("second", new Date(2026, 2, 16, 18, 0, 0), 12),
        createChallenge("third", new Date(2026, 2, 20, 7, 0, 0), 10),
      ],
      now
    )

    expect(totals).toHaveLength(7)
    expect(totals[0]).toMatchObject({
      date: new Date(2026, 2, 14),
      totalReps: 0,
      isToday: false,
    })
    expect(totals[2]).toMatchObject({
      date: new Date(2026, 2, 16),
      totalReps: 20,
      isToday: false,
    })
    expect(totals[6]).toMatchObject({
      date: new Date(2026, 2, 20),
      totalReps: 10,
      isToday: true,
    })
  })

  it("ignores workouts outside the rolling week", () => {
    const now = new Date(2026, 2, 20, 9, 0, 0)
    const totals = getRollingWeekDailyRepTotals(
      [
        createChallenge("before-range", new Date(2026, 2, 13, 10, 0, 0), 14),
        createChallenge("inside-range", new Date(2026, 2, 20, 12, 0, 0), 9),
        createChallenge("after-range", new Date(2026, 2, 21, 12, 0, 0), 16),
      ],
      now
    )

    expect(totals[6]).toMatchObject({
      date: new Date(2026, 2, 20),
      totalReps: 9,
      isToday: true,
    })
    expect(totals.reduce((sum, entry) => sum + entry.totalReps, 0)).toBe(9)
  })
})

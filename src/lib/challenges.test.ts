import { describe, expect, it } from "vitest"
import { type ChallengeRecordInput, toChallengeRecord } from "@/lib/challenges"

function createChallengeId(value: string): ChallengeRecordInput["id"] {
  return value as ChallengeRecordInput["id"]
}

describe("challenge records", () => {
  it("maps Convex challenge fields to the UI record shape", () => {
    expect(
      toChallengeRecord({
        id: createChallengeId("challenge-1"),
        challengeType: "pushup",
        completedAt: Date.UTC(2026, 2, 10, 11, 0, 0),
        repsCount: 8,
      })
    ).toEqual({
      id: "challenge-1",
      challenge_type: "pushup",
      timestamp: "2026-03-10T11:00:00.000Z",
      reps_count: 8,
    })
  })

  it("preserves zero-rep records without changing their values", () => {
    expect(
      toChallengeRecord({
        id: createChallengeId("challenge-2"),
        challengeType: "pushup",
        completedAt: Date.UTC(2026, 2, 10, 12, 30, 0),
        repsCount: 0,
      })
    ).toMatchObject({
      challenge_type: "pushup",
      reps_count: 0,
    })
  })
})

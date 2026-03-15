import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

const convexModules = import.meta.glob("./**/*.{ts,js}")

describe("convex challenges", () => {
  it("creates a challenge and returns the UI record shape", async () => {
    const t = convexTest(schema, convexModules)

    const challenge = await t.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 10, 0, 0),
      repsCount: 8,
    })

    expect(challenge.id).toBeTypeOf("string")
    expect(challenge).toMatchObject({
      challenge_type: "pushup",
      timestamp: "2026-03-10T10:00:00.000Z",
      reps_count: 8,
    })
  })

  it("lists recent challenges newest first and respects the limit", async () => {
    const t = convexTest(schema, convexModules)

    await t.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 10, 0, 0),
      repsCount: 6,
    })
    await t.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 11, 0, 0),
      repsCount: 9,
    })

    const challenges = await t.query(api.challenges.listRecent, { limit: 1 })

    expect(challenges).toHaveLength(1)
    expect(challenges[0]).toMatchObject({
      challenge_type: "pushup",
      timestamp: "2026-03-10T11:00:00.000Z",
      reps_count: 9,
    })
  })

  it("lists only challenges inside the requested date range", async () => {
    const t = convexTest(schema, convexModules)

    await t.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 1, 28, 12, 0, 0),
      repsCount: 7,
    })
    await t.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 15, 8, 30, 0),
      repsCount: 10,
    })
    await t.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 3, 1, 9, 0, 0),
      repsCount: 12,
    })

    const challenges = await t.query(api.challenges.listForRange, {
      startMs: Date.UTC(2026, 2, 1, 0, 0, 0),
      endMs: Date.UTC(2026, 3, 1, 0, 0, 0),
    })

    expect(challenges).toEqual([
      expect.objectContaining({
        challenge_type: "pushup",
        timestamp: "2026-03-15T08:30:00.000Z",
        reps_count: 10,
      }),
    ])
  })
})

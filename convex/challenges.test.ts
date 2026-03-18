import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

const convexModules = import.meta.glob("./**/*.{ts,js}")

describe("convex challenges", () => {
  it("creates a challenge and returns the UI record shape", async () => {
    const t = convexTest(schema, convexModules)
    const authed = t.withIdentity({ subject: "user_1" })

    const challenge = await authed.mutation(api.challenges.create, {
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
    const userOne = t.withIdentity({ subject: "user_1" })
    const userTwo = t.withIdentity({ subject: "user_2" })

    await userOne.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 10, 0, 0),
      repsCount: 6,
    })
    await userOne.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 11, 0, 0),
      repsCount: 9,
    })
    await userTwo.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 12, 0, 0),
      repsCount: 12,
    })

    const challenges = await userOne.query(api.challenges.listRecent, {
      limit: 5,
    })

    expect(challenges).toHaveLength(2)
    expect(challenges[0]).toMatchObject({
      challenge_type: "pushup",
      timestamp: "2026-03-10T11:00:00.000Z",
      reps_count: 9,
    })
    expect(challenges[1]).toMatchObject({
      challenge_type: "pushup",
      timestamp: "2026-03-10T10:00:00.000Z",
      reps_count: 6,
    })
  })

  it("deletes an existing challenge", async () => {
    const t = convexTest(schema, convexModules)
    const owner = t.withIdentity({ subject: "user_1" })

    const challenge = await owner.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 11, 0, 0),
      repsCount: 9,
    })

    const deleted = await owner.mutation(api.challenges.deleteOne, {
      id: challenge.id,
    })

    const challenges = await owner.query(api.challenges.listRecent, {
      limit: 10,
    })

    expect(deleted).toBe(true)
    expect(challenges).toEqual([])
  })

  it("lists only challenges inside the requested date range", async () => {
    const t = convexTest(schema, convexModules)
    const userOne = t.withIdentity({ subject: "user_1" })
    const userTwo = t.withIdentity({ subject: "user_2" })

    await userOne.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 1, 28, 12, 0, 0),
      repsCount: 7,
    })
    await userOne.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 15, 8, 30, 0),
      repsCount: 10,
    })
    await userOne.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 3, 1, 9, 0, 0),
      repsCount: 12,
    })
    await userTwo.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 20, 9, 0, 0),
      repsCount: 20,
    })

    const challenges = await userOne.query(api.challenges.listForRange, {
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

  it("does not allow one user to delete another user's challenge", async () => {
    const t = convexTest(schema, convexModules)
    const owner = t.withIdentity({ subject: "user_1" })
    const otherUser = t.withIdentity({ subject: "user_2" })

    const challenge = await owner.mutation(api.challenges.create, {
      challengeType: "pushup",
      completedAt: Date.UTC(2026, 2, 10, 11, 0, 0),
      repsCount: 9,
    })

    const deleted = await otherUser.mutation(api.challenges.deleteOne, {
      id: challenge.id,
    })

    const challenges = await owner.query(api.challenges.listRecent, {
      limit: 10,
    })

    expect(deleted).toBe(false)
    expect(challenges).toHaveLength(1)
  })

  it("rejects unauthenticated access", async () => {
    const t = convexTest(schema, convexModules)

    await expect(
      t.mutation(api.challenges.create, {
        challengeType: "pushup",
        completedAt: Date.UTC(2026, 2, 10, 10, 0, 0),
        repsCount: 8,
      })
    ).rejects.toThrow("Authentication required.")

    await expect(
      t.query(api.challenges.listRecent, { limit: 20 })
    ).rejects.toThrow("Authentication required.")

    await expect(
      t.query(api.challenges.listForRange, {
        startMs: Date.UTC(2026, 2, 1, 0, 0, 0),
        endMs: Date.UTC(2026, 3, 1, 0, 0, 0),
      })
    ).rejects.toThrow("Authentication required.")
  })
})

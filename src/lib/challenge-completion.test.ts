import { describe, expect, it, vi } from "vitest"
import {
  getChallengePayload,
  saveChallengeCompletion,
} from "@/lib/challenge-completion"

describe("challenge completion", () => {
  it("reuses the same payload across retries", () => {
    const firstPayload = getChallengePayload(null, "pushup", 8, () => 1234)

    expect(getChallengePayload(firstPayload, "pushup", 8, () => 5678)).toEqual(
      firstPayload
    )
  })

  it("keeps the failed payload available for a retry and does not navigate", async () => {
    const saveChallenge = vi.fn().mockRejectedValue(new Error("network"))
    const navigateHome = vi.fn().mockResolvedValue(undefined)

    await expect(
      saveChallengeCompletion({
        existingPayload: null,
        workoutId: "pushup",
        target: 9,
        saveChallenge,
        navigateHome,
        now: () => 2000,
      })
    ).rejects.toMatchObject({
      message: "Could not save this challenge. Check your connection and retry.",
      payload: {
        challengeType: "pushup",
        completedAt: 2000,
        repsCount: 9,
      },
    })

    expect(navigateHome).not.toHaveBeenCalled()
    expect(saveChallenge).toHaveBeenCalledWith({
      challengeType: "pushup",
      completedAt: 2000,
      repsCount: 9,
    })
  })

  it("navigates after a successful retry using the original payload", async () => {
    const saveChallenge = vi.fn()
    const navigateHome = vi.fn().mockResolvedValue(undefined)
    const payload = {
      challengeType: "pushup" as const,
      completedAt: 2000,
      repsCount: 9,
    }

    await expect(
      saveChallengeCompletion({
        existingPayload: payload,
        workoutId: "pushup",
        target: 9,
        saveChallenge,
        navigateHome,
        now: () => 5000,
      })
    ).resolves.toEqual(payload)

    expect(saveChallenge).toHaveBeenCalledWith(payload)
    expect(navigateHome).toHaveBeenCalledOnce()
  })
})

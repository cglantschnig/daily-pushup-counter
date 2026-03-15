import { describe, expect, it } from "vitest"
import { getChallengeSequence } from "@/lib/challenge-sequence"
import { WORKOUT_OPTIONS } from "@/lib/workouts"

describe("challenge sequence", () => {
  it("counts from one through the target number for pushups", () => {
    const pushupWorkout = WORKOUT_OPTIONS[0]
    const sequence = getChallengeSequence(5, pushupWorkout)

    expect(sequence.map((step) => step.label)).toEqual([
      "3",
      "2",
      "1",
      "GO",
      "1",
      "2",
      "3",
      "4",
      "5",
      "DONE",
    ])
    expect(sequence[0]?.delayMs).toBe(1500)
    expect(sequence[4]?.delayMs).toBe(2000)
    expect(sequence[8]?.delayMs).toBe(2000)
    expect(sequence[9]).toMatchObject({
      label: "DONE",
      speech: "",
      phase: "complete",
      delayMs: null,
    })
  })
})

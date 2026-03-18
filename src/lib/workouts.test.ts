import { describe, expect, it } from "vitest"
import {
  getCalendarWeekIndex,
  getIsoWeekStart,
  getRandomTarget,
  getTargetRange,
  type WorkoutOption,
  WORKOUT_OPTIONS,
} from "@/lib/workouts"

const pushupWorkout = WORKOUT_OPTIONS[0]

function localTime(
  year: number,
  monthIndex: number,
  day: number,
  hour = 12,
  minute = 0
) {
  return new Date(year, monthIndex, day, hour, minute).getTime()
}

describe("workouts", () => {
  it("returns the local Monday midnight for an ISO week", () => {
    expect(getIsoWeekStart(new Date(2025, 0, 8, 15, 30))).toEqual(
      new Date(2025, 0, 6, 0, 0, 0, 0)
    )
    expect(getIsoWeekStart(new Date(2025, 0, 12, 22, 15))).toEqual(
      new Date(2025, 0, 6, 0, 0, 0, 0)
    )
  })

  it("keeps week zero at the anchor week", () => {
    expect(getCalendarWeekIndex(() => localTime(2025, 0, 6))).toBe(0)
    expect(getTargetRange(pushupWorkout, () => localTime(2025, 0, 6))).toEqual({
      min: 5,
      max: 10,
    })
  })

  it("advances the pushup range after two calendar weeks", () => {
    expect(getCalendarWeekIndex(() => localTime(2025, 0, 20))).toBe(2)
    expect(getTargetRange(pushupWorkout, () => localTime(2025, 0, 20))).toEqual({
      min: 6,
      max: 11,
    })
  })

  it("continues progressing after four calendar weeks", () => {
    expect(getCalendarWeekIndex(() => localTime(2025, 1, 3))).toBe(4)
    expect(getTargetRange(pushupWorkout, () => localTime(2025, 1, 3))).toEqual({
      min: 7,
      max: 12,
    })
  })

  it("caps the pushup range after enough weeks have passed", () => {
    expect(getTargetRange(pushupWorkout, () => localTime(2026, 0, 5))).toEqual({
      min: 12,
      max: 20,
    })
  })

  it("does not reset week indexing across the year boundary", () => {
    expect(getCalendarWeekIndex(() => localTime(2026, 0, 5))).toBe(52)
  })

  it("changes weeks only when the local Monday rollover is reached", () => {
    expect(getCalendarWeekIndex(() => localTime(2025, 0, 12, 23, 59))).toBe(0)
    expect(getCalendarWeekIndex(() => localTime(2025, 0, 13, 0, 0))).toBe(1)
    expect(getTargetRange(pushupWorkout, () => localTime(2025, 0, 19, 23, 59))).toEqual({
      min: 5,
      max: 10,
    })
    expect(getTargetRange(pushupWorkout, () => localTime(2025, 0, 20, 0, 0))).toEqual({
      min: 6,
      max: 11,
    })
  })

  it("returns the minimum target when the random source is zero", () => {
    expect(getRandomTarget(pushupWorkout, () => localTime(2025, 0, 6), () => 0)).toBe(
      5
    )
  })

  it("returns the maximum target when the random source is near one", () => {
    expect(
      getRandomTarget(pushupWorkout, () => localTime(2025, 0, 6), () => 0.999999)
    ).toBe(10)
  })

  it("always generates a value within the workout's current range", () => {
    const target = getRandomTarget(
      pushupWorkout,
      () => localTime(2025, 1, 3),
      () => 0.42
    )

    expect(target).toBeGreaterThanOrEqual(7)
    expect(target).toBeLessThanOrEqual(12)
  })

  it("supports different target ranges for different workout configs", () => {
    const customWorkout = {
      ...pushupWorkout,
      targetConfig: {
        ...pushupWorkout.targetConfig,
        initialMin: 9,
        initialMax: 14,
        maxMin: 16,
        maxMax: 24,
      },
    } as unknown as WorkoutOption

    expect(getTargetRange(pushupWorkout, () => localTime(2025, 0, 20))).toEqual({
      min: 6,
      max: 11,
    })
    expect(getTargetRange(customWorkout, () => localTime(2025, 0, 20))).toEqual({
      min: 10,
      max: 15,
    })
  })
})

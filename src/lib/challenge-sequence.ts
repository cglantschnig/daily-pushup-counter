import type { WorkoutOption } from "@/lib/workouts"

export type ChallengeSequencePhase = "countdown" | "active" | "complete"

export type ChallengeSequenceStep = {
  label: string
  speech: string
  phase: ChallengeSequencePhase
  delayMs: number | null
}

const COUNTDOWN_STEP_DELAY_MS = 1000

const COUNTDOWN_STEPS = [
  { label: "3", speech: "Three" },
  { label: "2", speech: "Two" },
  { label: "1", speech: "One" },
  { label: "GO", speech: "Go" },
] as const

export function getChallengeSequence(
  target: number,
  workout: Pick<WorkoutOption, "repIntervalMs">
): Array<ChallengeSequenceStep> {
  const normalizedTarget = Number.isFinite(target) ? Math.max(0, Math.floor(target)) : 0
  const repSteps = Array.from({ length: normalizedTarget }, (_, index) => ({
    label: String(index + 1),
    speech: String(index + 1),
    phase: "active" as const,
    delayMs: workout.repIntervalMs,
  }))

  return [
    ...COUNTDOWN_STEPS.map((step) => ({
      ...step,
      phase: "countdown" as const,
      delayMs: COUNTDOWN_STEP_DELAY_MS,
    })),
    ...repSteps,
    {
      label: "DONE",
      speech: "Done",
      phase: "complete" as const,
      delayMs: null,
    },
  ]
}

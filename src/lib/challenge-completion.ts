import type { WorkoutId } from "@/lib/workouts"

export type ChallengePayload = {
  challengeType: WorkoutId
  completedAt: number
  repsCount: number
}

export class ChallengeSaveError extends Error {
  constructor(
    message: string,
    public readonly payload: ChallengePayload,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = "ChallengeSaveError"
  }
}

type SaveChallengeCompletionOptions = {
  existingPayload: ChallengePayload | null
  workoutId: WorkoutId
  target: number
  saveChallenge: (payload: ChallengePayload) => Promise<unknown>
  navigateHome: () => Promise<unknown>
  now?: () => number
}

export function getChallengePayload(
  existingPayload: ChallengePayload | null,
  workoutId: WorkoutId,
  target: number,
  now: () => number = () => Date.now()
): ChallengePayload {
  return (
    existingPayload ?? {
      challengeType: workoutId,
      completedAt: now(),
      repsCount: target,
    }
  )
}

export async function saveChallengeCompletion({
  existingPayload,
  workoutId,
  target,
  saveChallenge,
  navigateHome,
  now,
}: SaveChallengeCompletionOptions): Promise<ChallengePayload> {
  const payload = getChallengePayload(existingPayload, workoutId, target, now)

  try {
    await saveChallenge(payload)
    await navigateHome()
    return payload
  } catch (error) {
    throw new ChallengeSaveError(
      "Could not save this challenge. Check your connection and retry.",
      payload,
      { cause: error }
    )
  }
}

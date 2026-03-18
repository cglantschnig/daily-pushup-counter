import type { Id } from "../../convex/_generated/dataModel"
import type { WorkoutId } from "@/lib/workouts"

export type ChallengeRecord = {
  id: Id<"challenges">
  challenge_type: WorkoutId
  timestamp: string
  reps_count: number
}

export type ChallengeRecordInput = {
  id: Id<"challenges">
  challengeType: WorkoutId
  completedAt: number
  repsCount: number
}

export function toChallengeRecord({
  id,
  challengeType,
  completedAt,
  repsCount,
}: ChallengeRecordInput): ChallengeRecord {
  return {
    id,
    challenge_type: challengeType,
    timestamp: new Date(completedAt).toISOString(),
    reps_count: repsCount,
  }
}

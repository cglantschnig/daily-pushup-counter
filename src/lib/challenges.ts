import type { WorkoutId } from "@/lib/workouts"

export type ChallengeRecord = {
  id: string
  challenge_type: WorkoutId
  timestamp: string
  reps_count: number
}

const STORAGE_KEY = "daily-pushup-counter:challenges"

function isChallengeRecord(value: unknown): value is ChallengeRecord {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Partial<ChallengeRecord>

  return (
    typeof candidate.id === "string" &&
    typeof candidate.challenge_type === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.reps_count === "number"
  )
}

function normalizeStoredChallenge(value: unknown): ChallengeRecord | null {
  if (isChallengeRecord(value)) {
    return value
  }

  if (typeof value !== "object" || value === null) {
    return null
  }

  const legacyCandidate = value as {
    id?: unknown
    challenge_type?: unknown
    timestamp?: unknown
    amount?: unknown
  }

  if (
    typeof legacyCandidate.id === "string" &&
    typeof legacyCandidate.challenge_type === "string" &&
    typeof legacyCandidate.timestamp === "string" &&
    typeof legacyCandidate.amount === "number"
  ) {
    return {
      id: legacyCandidate.id,
      challenge_type: legacyCandidate.challenge_type as WorkoutId,
      timestamp: legacyCandidate.timestamp,
      reps_count: legacyCandidate.amount,
    }
  }

  return null
}

export function getStoredChallenges(): Array<ChallengeRecord> {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map(normalizeStoredChallenge)
      .filter((challenge): challenge is ChallengeRecord => challenge !== null)
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      )
  } catch {
    return []
  }
}

export function storeChallenge(
  challenge: Omit<ChallengeRecord, "id">
): ChallengeRecord {
  if (typeof window === "undefined") {
    throw new Error("Challenges can only be stored in the browser.")
  }

  const nextChallenge: ChallengeRecord = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...challenge,
  }

  const nextChallenges = [nextChallenge, ...getStoredChallenges()]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextChallenges))

  return nextChallenge
}

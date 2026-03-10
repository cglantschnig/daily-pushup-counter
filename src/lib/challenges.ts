export type ChallengeRecord = {
  id: string
  challenge_type: "pushup"
  timestamp: string
  amount: number
}

const STORAGE_KEY = "daily-pushup-counter:challenges"

function isChallengeRecord(value: unknown): value is ChallengeRecord {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Partial<ChallengeRecord>

  return (
    typeof candidate.id === "string" &&
    candidate.challenge_type === "pushup" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.amount === "number"
  )
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
      .filter(isChallengeRecord)
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

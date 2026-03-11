import type { ChallengeRecord } from "@/lib/challenges"

export type DailyRepTotal = {
  day: number
  totalReps: number
}

export function getCurrentMonthDailyRepTotals(
  challenges: Array<ChallengeRecord>,
  now = new Date()
): Array<DailyRepTotal> {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const totals = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    totalReps: 0,
  }))

  challenges.forEach((challenge) => {
    const challengeDate = new Date(challenge.timestamp)

    if (
      challengeDate.getFullYear() !== currentYear ||
      challengeDate.getMonth() !== currentMonth
    ) {
      return
    }

    const entry = totals[challengeDate.getDate() - 1]

    entry.totalReps += challenge.reps_count
  })

  return totals
}

import type { ChallengeRecord } from "@/lib/challenges"

export type DailyRepTotal = {
  date: Date
  totalReps: number
  isToday: boolean
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function getRollingWeekRange(now = new Date()) {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  return {
    startMs: new Date(currentYear, currentMonth, currentDay - 6).getTime(),
    endMs: new Date(currentYear, currentMonth, currentDay + 1).getTime(),
  }
}

export function getRollingWeekDailyRepTotals(
  challenges: Array<ChallengeRecord>,
  now = new Date()
): Array<DailyRepTotal> {
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const totals = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentYear, currentMonth, currentDay - 6 + index)

    return {
      date,
      totalReps: 0,
      isToday: index === 6,
    }
  })
  const totalsByDateKey = new Map(
    totals.map((entry) => [getDateKey(entry.date), entry])
  )

  challenges.forEach((challenge) => {
    const challengeDate = new Date(challenge.timestamp)
    const entry = totalsByDateKey.get(getDateKey(challengeDate))

    if (!entry) {
      return
    }

    entry.totalReps += challenge.reps_count
  })

  return totals
}

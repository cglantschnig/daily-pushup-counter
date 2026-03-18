export const WORKOUT_OPTIONS = [
  {
    id: "pushup",
    label: "Pushups",
    repIntervalMs: 1500,
    targetConfig: {
      initialMin: 5,
      initialMax: 10,
      rampWeeksPerRep: 2,
      maxMin: 12,
      maxMax: 20,
    },
    instructions:
      "Keep your body in a straight line, lower your chest until your elbows reach about 90 degrees, and press back up with control.",
  },
] as const

export type WorkoutTargetConfig = {
  initialMin: number
  initialMax: number
  rampWeeksPerRep: number
  maxMin: number
  maxMax: number
}

export type WorkoutOption = (typeof WORKOUT_OPTIONS)[number]
export type WorkoutId = WorkoutOption["id"]

const workoutIds = new Set<string>(WORKOUT_OPTIONS.map((workout) => workout.id))
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const PROGRESSION_ANCHOR = new Date(2025, 0, 6)

export function getIsoWeekStart(date: Date) {
  const weekStart = new Date(date)
  const dayOfWeek = weekStart.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() + diffToMonday)

  return weekStart
}

function getStableWeekStartTimestamp(date: Date) {
  const weekStart = getIsoWeekStart(date)

  return Date.UTC(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate()
  )
}

export function getCalendarWeekIndex(now: () => number = () => Date.now()) {
  const currentWeekStart = getStableWeekStartTimestamp(new Date(now()))
  const anchorWeekStart = getStableWeekStartTimestamp(PROGRESSION_ANCHOR)

  return Math.max(0, Math.floor((currentWeekStart - anchorWeekStart) / WEEK_MS))
}

export function getTargetRange(
  workout: WorkoutOption,
  now: () => number = () => Date.now()
) {
  const {
    initialMin,
    initialMax,
    rampWeeksPerRep,
    maxMin,
    maxMax,
  } = workout.targetConfig
  const weeklyStep = Math.floor(getCalendarWeekIndex(now) / rampWeeksPerRep)

  return {
    min: Math.min(initialMin + weeklyStep, maxMin),
    max: Math.min(initialMax + weeklyStep, maxMax),
  }
}

export function getRandomTarget(
  workout: WorkoutOption,
  now: () => number = () => Date.now(),
  random: () => number = Math.random
) {
  const { min, max } = getTargetRange(workout, now)
  const normalizedRandom = Math.min(Math.max(random(), 0), 1 - Number.EPSILON)

  return Math.floor(normalizedRandom * (max - min + 1)) + min
}

export function getRandomWorkout() {
  return WORKOUT_OPTIONS[0]
}

export function isWorkoutId(value: string): value is WorkoutId {
  return workoutIds.has(value)
}

export function getWorkoutLabel(workoutId: WorkoutId) {
  return (
    WORKOUT_OPTIONS.find((workout) => workout.id === workoutId)?.label ??
    WORKOUT_OPTIONS[0].label
  )
}

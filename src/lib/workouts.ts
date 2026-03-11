export const WORKOUT_OPTIONS = [
  {
    id: "pushup",
    label: "Pushups",
    repIntervalMs: 2000,
    instructions:
      "Keep your body in a straight line, lower your chest until your elbows reach about 90 degrees, and press back up with control.",
  },
] as const

export type WorkoutOption = (typeof WORKOUT_OPTIONS)[number]
export type WorkoutId = WorkoutOption["id"]

const workoutIds = new Set<string>(WORKOUT_OPTIONS.map((workout) => workout.id))

export function getRandomTarget() {
  return Math.floor(Math.random() * 6) + 5
}

export function getRandomWorkout() {
  return WORKOUT_OPTIONS[0]
}

export function isWorkoutId(value: string): value is WorkoutId {
  return workoutIds.has(value)
}

export function getWorkoutLabel(_workoutId: WorkoutId) {
  return WORKOUT_OPTIONS[0].label
}

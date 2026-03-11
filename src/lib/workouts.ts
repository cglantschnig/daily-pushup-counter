export const WORKOUT_OPTIONS = [
  {
    id: "pushup",
    label: "Pushups",
  },
] as const

export type WorkoutOption = (typeof WORKOUT_OPTIONS)[number]
export type WorkoutId = WorkoutOption["id"]

const workoutIds = new Set<WorkoutId>(WORKOUT_OPTIONS.map((workout) => workout.id))

export function getRandomTarget() {
  return Math.floor(Math.random() * 6) + 5
}

export function getRandomWorkout() {
  return WORKOUT_OPTIONS[Math.floor(Math.random() * WORKOUT_OPTIONS.length)]!
}

export function isWorkoutId(value: string): value is WorkoutId {
  return workoutIds.has(value as WorkoutId)
}

export function getWorkoutLabel(workoutId: WorkoutId) {
  return (
    WORKOUT_OPTIONS.find((workout) => workout.id === workoutId)?.label ?? "Workout"
  )
}

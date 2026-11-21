export type Workout = {
  id: number
  name: string
  focus: string
  description: string
}

export type Exercise = {
  id: number
  workoutId: number
  name: string
  muscle: string
  setsReps: string
  rest: number
  tip: string
  videoUrl?: string
  completed: boolean
}

export type WorkoutInput = Omit<Workout, 'id'>
export type ExerciseInput = Omit<Exercise, 'id' | 'completed'>

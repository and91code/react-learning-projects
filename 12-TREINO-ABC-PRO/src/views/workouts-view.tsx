import { Archive, ArchiveRestore, ArrowDown, ArrowUp, ChevronDown, Dumbbell, Pencil, PlayCircle, Plus, Star, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { PageHeading } from '../components/commons/page-heading'
import type { WorkoutModel } from '../lib/db/model-repository'
import type { Exercise, Workout } from '../types'

type WorkoutsViewProps = {
  models: WorkoutModel[]
  routinesByModel: Record<number, Workout[]>
  exercisesByModel: Record<number, Exercise[]>
  onCreateModel: () => void
  onEditModel: (model: WorkoutModel) => void
  onActivateModel: (id: number) => void
  onArchiveModel: (id: number, archived: boolean) => void
  onReorderModels: (ids: number[]) => void
  onCreateRoutine: (modelId: number) => void
  onStartRoutine: (routineId: number) => void
  onEditRoutine: (routine: Workout, modelId: number) => void
  onDeleteRoutine: (id: number) => void
  onReorderRoutines: (modelId: number, ids: number[]) => void
  onCreateExercise: (routineId: number, modelId: number) => void
  onEditExercise: (exercise: Exercise, modelId: number) => void
  onDeleteExercise: (exercise: Exercise) => void
  onPreviewVideo: (url: string, title: string) => void
}

export function WorkoutsView({
  models,
  routinesByModel,
  exercisesByModel,
  onCreateModel,
  onEditModel,
  onActivateModel,
  onArchiveModel,
  onReorderModels,
  onCreateRoutine,
  onStartRoutine,
  onEditRoutine,
  onDeleteRoutine,
  onReorderRoutines,
  onCreateExercise,
  onEditExercise,
  onDeleteExercise,
  onPreviewVideo,
}: WorkoutsViewProps) {
  function moveModel(index: number, offset: number) {
    const next = [...models]
    const destination = index + offset
    ;[next[index], next[destination]] = [next[destination], next[index]]
    onReorderModels(next.map((model) => model.id))
  }

  function moveRoutine(modelId: number, routines: Workout[], index: number, offset: number) {
    const next = [...routines]
    const destination = index + offset
    ;[next[index], next[destination]] = [next[destination], next[index]]
    onReorderRoutines(modelId, next.map((routine) => routine.id))
  }

  return (
    <section className="route-page">
      <PageHeading
        eyebrow="MODELOS E ROTINAS"
        title="Treinos"
        description="Organize seus modelos, a ordem das rotinas e os exercícios de cada treino."
        action={<div className="flex flex-wrap items-center gap-2"><Button onClick={onCreateModel} disabled={models.length >= 5}><Plus size={16} /> Adicionar modelo {models.length}/5</Button>{models.length >= 5 && <span className="text-xs text-amber-300">Limite de 5 modelos atingido; arquivados também contam.</span>}</div>}
      />
      {models.length ? <div className="route-workout-list">
        {models.map((model, modelIndex) => {
          const routines = routinesByModel[model.id] ?? []
          const exercises = exercisesByModel[model.id] ?? []
          return (
            <article className="route-workout-card collapsible-card" key={model.id}>
              <details className="training-collapsible" open={model.active}>
                <summary className="flex items-center gap-3 p-1">
                  <span className={`workout-dot color-${modelIndex % 3}`}><Dumbbell size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">{model.name}</strong>
                    <span className="mt-1 block truncate text-xs text-slate-500">{model.description || `${routines.length} treinos · ${exercises.length} exercícios`}</span>
                  </span>
                  {model.active && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300"><Star size={12} className="mr-1 inline" />Ativo</span>}
                  {model.archived && <span className="rounded-full bg-slate-700 px-2.5 py-1 text-xs text-slate-300">Arquivado</span>}
                  <ChevronDown className="collapse-indicator" size={17} />
                </summary>
                <div className="collapsible-content mt-3 border-t border-slate-800 pt-3">
                  <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" aria-label={`Mover ${model.name} para cima`} disabled={modelIndex === 0} onClick={() => moveModel(modelIndex, -1)}><ArrowUp size={15} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Mover ${model.name} para baixo`} disabled={modelIndex === models.length - 1} onClick={() => moveModel(modelIndex, 1)}><ArrowDown size={15} /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Editar ${model.name}`} onClick={() => onEditModel(model)}><Pencil size={15} /></Button>
                    <Button variant="ghost" size="icon" aria-label={model.archived ? `Desarquivar ${model.name}` : `Arquivar ${model.name}`} onClick={() => onArchiveModel(model.id, !model.archived)}>{model.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}</Button>
                    {!model.archived && !model.active && <Button variant="secondary" size="sm" onClick={() => onActivateModel(model.id)}>Ativar modelo</Button>}
                  </div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div><strong className="text-sm">Treinos</strong><span className="ml-2 text-xs text-slate-500">{routines.length}</span></div>
                    <Button variant="secondary" size="sm" onClick={() => onCreateRoutine(model.id)}><Plus size={14} /> Adicionar treino</Button>
                  </div>
                  {routines.length ? <div className="space-y-3">
                    {routines.map((routine, routineIndex) => {
                      const routineExercises = exercises.filter((exercise) => exercise.workoutId === routine.id)
                      return <details className="routine-collapsible rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={routine.id} open={model.active && routineIndex === 0}>
                        <summary className="flex items-center gap-2">
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-sm">{routine.name}</strong>
                            <span className="mt-1 block truncate text-xs text-slate-500">{routine.focus}{routine.focus ? ' · ' : ''}{routineExercises.length} exercícios</span>
                          </span>
                          <ChevronDown className="collapse-indicator" size={15} />
                        </summary>
                        <div className="mt-3 border-t border-slate-800 pt-2">
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label={`Mover ${routine.name} para cima`} disabled={routineIndex === 0} onClick={() => moveRoutine(model.id, routines, routineIndex, -1)}><ArrowUp size={14} /></Button>
                            <Button variant="ghost" size="icon" aria-label={`Mover ${routine.name} para baixo`} disabled={routineIndex === routines.length - 1} onClick={() => moveRoutine(model.id, routines, routineIndex, 1)}><ArrowDown size={14} /></Button>
                            <Button variant="ghost" size="icon" aria-label={`Editar ${routine.name}`} onClick={() => onEditRoutine(routine, model.id)}><Pencil size={14} /></Button>
                            {model.active && <Button variant="secondary" size="sm" onClick={() => onStartRoutine(routine.id)}><PlayCircle size={14} /> Iniciar treino</Button>}
                            <Button variant="ghost" size="icon" aria-label={`Excluir ${routine.name}`} onClick={() => {
                              if (window.confirm(`Excluir ${routine.name} e seus exercícios?`)) onDeleteRoutine(routine.id)
                            }}><Trash2 size={14} /></Button>
                            <Button variant="secondary" size="sm" onClick={() => onCreateExercise(routine.id, model.id)}><Plus size={14} /> Exercício</Button>
                          </div>
                          {routineExercises.length > 0 ? <ul className="mt-2 divide-y divide-slate-800">
                            {routineExercises.map((exercise) => <li className="flex items-center gap-2 py-2 text-sm" key={exercise.id}>
                              <span className="min-w-0 flex-1 truncate text-slate-300">{exercise.name}<small className="ml-2 text-slate-500">{exercise.setsReps}</small></span>
                              {exercise.videoUrl && <Button variant="ghost" size="icon" aria-label={`Assistir vídeo de ${exercise.name}`} onClick={() => onPreviewVideo(exercise.videoUrl!, exercise.name)}><PlayCircle size={15} /></Button>}
                              <Button variant="ghost" size="icon" aria-label={`Editar ${exercise.name}`} onClick={() => onEditExercise(exercise, model.id)}><Pencil size={14} /></Button>
                              <Button variant="ghost" size="icon" aria-label={`Excluir ${exercise.name}`} onClick={() => {
                                if (window.confirm(`Excluir ${exercise.name}?`)) onDeleteExercise(exercise)
                              }}><Trash2 size={14} /></Button>
                            </li>)}
                          </ul> : <p className="mt-3 text-xs text-slate-500">Nenhum exercício cadastrado.</p>}
                        </div>
                      </details>
                    })}
                  </div> : <p className="text-sm text-slate-500">Adicione o primeiro treino a este modelo.</p>}
                </div>
              </details>
            </article>
          )
        })}
      </div> : <div className="empty-state"><div><Dumbbell size={22} /></div><strong>Nenhum modelo cadastrado</strong><p>Crie seu primeiro modelo e organize seus treinos.</p><Button size="sm" onClick={onCreateModel}><Plus size={15} /> Criar modelo</Button></div>}
    </section>
  )
}

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Activity, ChevronDown, CircleHelp, Dumbbell, ListChecks, Play, Plus, RefreshCw, Settings2, Timer, X } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from './components/ui/button'
import { VideoModal } from './components/commons/video-modal'
import { exerciseCatalog, type ExerciseSuggestion } from './domain/training/exercise-catalog'
import { legacyExerciseFormSchema, legacyWorkoutFormSchema, workoutModelFormSchema, type LegacyExerciseFormInput, type LegacyWorkoutFormInput, type WorkoutModelFormInput } from './domain/training/schemas'
import { activateWorkoutModel, archiveWorkoutModel, beginWorkoutSession, getSuggestedRoutineId, listExercises, listModelExercises, listModelRoutines, listTrainingSessions, listWorkoutModels, listWorkouts, loadActiveTrainingSession, removeExercise, removeWorkout, reorderModelRoutines, reorderWorkoutModels, retryDatabaseInitialization, saveExercise, saveModelRoutine, saveWorkout, saveWorkoutModel } from './lib/database'
import { useSystemStore } from './store/system/system-store'
import type { Exercise, ExerciseInput, Workout } from './types'
import type { WorkoutModel } from './lib/db/model-repository'
import type { TrainingSessionSnapshot } from './lib/db/session-repository'
import { AccountView } from './views/account-view'
import { HomeView } from './views/home-view'
import { SessionView } from './views/session-view'
import { WorkoutsView } from './views/workouts-view'

type Modal = { type: 'model'; item?: WorkoutModel } | { type: 'workout'; item?: Workout; modelId: number } | { type: 'exercise'; item?: Exercise; workoutId: number; modelId: number } | undefined

function App() {
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [models, setModels] = useState<WorkoutModel[]>([])
  const [routinesByModel, setRoutinesByModel] = useState<Record<number, Workout[]>>({})
  const [exercisesByModel, setExercisesByModel] = useState<Record<number, Exercise[]>>({})
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [monthSessions, setMonthSessions] = useState<TrainingSessionSnapshot[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [suggestedRoutineId, setSuggestedRoutineId] = useState<number>()
  const [sessionInProgress, setSessionInProgress] = useState(false)
  const [activeId, setActiveId] = useState<number | 'all'>('all')
  const [modal, setModal] = useState<Modal>()
  const sessionRestoreAttempted = useRef(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<ExerciseSuggestion>()
  const [videoPreview, setVideoPreview] = useState<{ url: string; title: string }>()
  const databaseState = useSystemStore((state) => state.databaseState)
  const databaseError = useSystemStore((state) => state.databaseError)
  const setDatabaseState = useSystemStore((state) => state.setDatabaseState)
  const workoutForm = useForm<LegacyWorkoutFormInput>({
    resolver: zodResolver(legacyWorkoutFormSchema),
    defaultValues: { name: '', focus: '', description: '' },
  })
  const exerciseForm = useForm<LegacyExerciseFormInput>({
    resolver: zodResolver(legacyExerciseFormSchema),
    defaultValues: { workoutId: 0, name: '', muscle: '', setsReps: '', rest: 60, tip: '', videoUrl: '' },
  })
  const modelForm = useForm<WorkoutModelFormInput>({
    resolver: zodResolver(workoutModelFormSchema),
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [nextModels, nextWorkouts, nextExercises, activeSession] = await Promise.all([
        listWorkoutModels(),
        listWorkouts(),
        listExercises(),
        loadActiveTrainingSession(),
      ])
      const modelData = await Promise.all(nextModels.map(async (model) => {
        const [routines, modelExercises] = await Promise.all([listModelRoutines(model.id), listModelExercises(model.id)])
        return [model.id, routines, modelExercises] as const
      }))
      setModels(nextModels)
      setRoutinesByModel(Object.fromEntries(modelData.map(([id, routines]) => [id, routines])))
      setExercisesByModel(Object.fromEntries(modelData.map(([id, , modelExercises]) => [id, modelExercises])))
      setWorkouts(nextWorkouts)
      setExercises(nextExercises)
      setSessionInProgress(Boolean(activeSession))
      const activeModel = nextModels.find((model) => model.active)
      setSuggestedRoutineId(activeModel ? await getSuggestedRoutineId(activeModel.id) : undefined)
      if (!sessionRestoreAttempted.current) {
        sessionRestoreAttempted.current = true
        if (activeSession) navigate('/sessao', { replace: true })
      }
      setDatabaseState('ready')
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível acessar o banco de dados.')
    }
  }, [navigate, setDatabaseState])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const startDate = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    const endDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`
    void listTrainingSessions(startDate, endDate).then(setMonthSessions).catch((reason: unknown) => {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico de treinos.')
    })
  }, [month, setDatabaseState, workouts, models])
  const activeWorkout = workouts.find((workout) => workout.id === activeId)
  function openWorkout(item?: Workout) {
    workoutForm.reset(item
      ? { name: item.name, focus: item.focus, description: item.description }
      : { name: '', focus: '', description: '' })
    const modelId = models.find((model) => model.active)?.id
    if (modelId === undefined) return
    setModal({ type: 'workout', item, modelId })
  }

  function openModel(item?: WorkoutModel) {
    modelForm.reset(item ? { name: item.name, description: item.description } : { name: '', description: '' })
    setModal({ type: 'model', item })
  }

  function openRoutine(item?: Workout, modelId = models.find((model) => model.active)?.id) {
    if (modelId === undefined) return
    workoutForm.reset(item
      ? { name: item.name, focus: item.focus, description: item.description }
      : { name: '', focus: '', description: '' })
    setModal({ type: 'workout', item, modelId })
  }

  function openExercise(
    item?: Exercise,
    workoutId = activeId === 'all' ? workouts[0]?.id : activeId,
    modelId = models.find((model) => model.active)?.id,
  ) {
    if (workoutId === undefined || modelId === undefined) return
    exerciseForm.reset(item
      ? { workoutId: item.workoutId, name: item.name, muscle: item.muscle, setsReps: item.setsReps, rest: item.rest, tip: item.tip, videoUrl: item.videoUrl ?? '' }
      : { workoutId, name: '', muscle: '', setsReps: '', rest: 60, tip: '', videoUrl: '' })
    setModal({ type: 'exercise', item, workoutId, modelId })
  }

  function applyExerciseSuggestion(suggestion: ExerciseSuggestion) {
    exerciseForm.setValue('muscle', suggestion.muscle, { shouldDirty: true, shouldValidate: true })
    exerciseForm.setValue('setsReps', suggestion.setsReps, { shouldDirty: true, shouldValidate: true })
    exerciseForm.setValue('rest', suggestion.rest, { shouldDirty: true, shouldValidate: true })
    exerciseForm.setValue('tip', suggestion.tip, { shouldDirty: true, shouldValidate: true })
  }

  function chooseExerciseSuggestion(event: ChangeEvent<HTMLSelectElement>) {
    const name = event.target.value
    exerciseForm.setValue('name', name, { shouldDirty: true, shouldValidate: true })
    const suggestion = exerciseCatalog.find((item) => item.name === name)
    if (!suggestion) return

    if (modal?.type === 'exercise' && modal.item && modal.item.name !== name) {
      setPendingSuggestion(suggestion)
      return
    }

    applyExerciseSuggestion(suggestion)
  }

  async function runDatabaseAction(action: () => Promise<void>, onSuccess?: () => void) {
    try {
      await action()
      onSuccess?.()
      await refresh()
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível salvar as alterações no banco local.')
    }
  }

  async function submitWorkout(input: LegacyWorkoutFormInput) {
    await runDatabaseAction(
      () => modal?.type === 'workout'
        ? saveModelRoutine(modal.modelId, input, modal.item?.id)
        : saveWorkout(input),
      () => setModal(undefined),
    )
  }

  async function submitModel(input: WorkoutModelFormInput) {
    await runDatabaseAction(
      () => saveWorkoutModel(input, modal?.type === 'model' ? modal.item?.id : undefined),
      () => setModal(undefined),
    )
  }

  async function submitExercise(values: LegacyExerciseFormInput) {
    const input: ExerciseInput = {
      workoutId: values.workoutId,
      name: values.name,
      muscle: values.muscle,
      setsReps: values.setsReps,
      rest: values.rest,
      tip: values.tip,
      videoUrl: values.videoUrl,
    }
    await runDatabaseAction(
      () => saveExercise(input, modal?.type === 'exercise' ? modal.item?.id : undefined),
      () => setModal(undefined),
    )
  }

  if (databaseState === 'loading') return <div role="status" className="grid min-h-screen place-items-center text-slate-400"><Activity className="mr-3 animate-pulse text-emerald-400" />Abrindo seu banco de treinos...</div>

  return (
    <div className="min-h-screen">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Treino ABC Pro, início">
          <div className="brand-mark"><Dumbbell size={21} /></div>
          <span><strong>TREINO<span className="text-emerald-400">ABC</span></strong><small>STRENGTH WORKSPACE</small></span>
        </NavLink>
        <div className="header-right">
          <div className="db-status" role="status"><i /> {isOnline ? 'SQLite local' : 'Offline · dados locais'}</div>
          <Button asChild variant="secondary" size="icon"><NavLink to="/conta" aria-label="Configurações"><Settings2 size={17} /></NavLink></Button>
          <NavLink className="avatar" to="/conta" aria-label="Perfil">A</NavLink>
        </div>
      </header>

      {databaseState === 'error' && <div role="alert" className="error-banner mx-auto mt-4 flex max-w-7xl items-center justify-between gap-4 px-4">
        <span>Não foi possível acessar ou salvar os dados locais: {databaseError}</span>
        <Button variant="secondary" size="sm" onClick={() => {
          retryDatabaseInitialization()
          setDatabaseState('loading')
          void refresh()
        }}><RefreshCw size={14} /> Tentar novamente</Button>
      </div>}

      <div className="app-layout">
        <aside className="sidebar">
          <div className="section-label">MENU PRINCIPAL</div>
          <nav className="primary-nav" aria-label="Navegação principal">
            <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Activity size={17} /> Painel</NavLink>
            <NavLink to="/treinos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><ListChecks size={17} /> Treinos e modelos</NavLink>
            <NavLink to="/sessao" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Timer size={17} /> Sessão atual</NavLink>
          </nav>
          <div className="sidebar-heading"><span>MEUS TREINOS</span><button aria-label="Criar treino" onClick={() => openWorkout()}><Plus size={16} /></button></div>
          <nav className="workout-nav">
            {workouts.map((workout, index) => (
              <button key={workout.id} className={`workout-link ${activeId === workout.id ? 'selected' : ''}`} onClick={() => { setActiveId(workout.id); navigate('/') }}>
                <span className={`workout-dot color-${index % 3}`}>{workout.name.slice(-1)}</span>
                <span className="truncate">{workout.name}<small>{workout.focus}</small></span>
                <ChevronDown className="ml-auto -rotate-90 text-slate-600" size={14} />
              </button>
            ))}
            {workouts.length === 0 && <p className="px-3 text-xs leading-5 text-slate-500">Crie um treino para começar.</p>}
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card"><CircleHelp size={18} className="text-emerald-400" /><strong>Seu treino, do seu jeito</strong><p>Crie rotinas e adicione exercícios para organizar sua evolução.</p></div>
            <div className="local-note"><i /> Seus dados ficam salvos neste navegador</div>
          </div>
        </aside>

        <Routes>
        <Route path="/" element={<HomeView
          activeWorkout={activeWorkout}
          workouts={workouts}
          exerciseCount={exercises.length}
          month={month}
          monthSessions={monthSessions}
          selectedDate={selectedDate}
          suggestedRoutine={routinesByModel[models.find((model) => model.active)?.id ?? -1]?.find((routine) => routine.id === suggestedRoutineId)}
          sessionInProgress={sessionInProgress}
          activeModelName={models.find((model) => model.active)?.name ?? ''}
          modelCount={models.length}
          onMonthChange={(offset) => {
            const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1)
            setMonth(nextMonth)
            setSelectedDate(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`)
          }}
          onSelectDate={setSelectedDate}
          onStartRoutine={(routineId) => { void runDatabaseAction(async () => { await beginWorkoutSession(routineId); navigate('/sessao') }) }}
        />} />
        <Route path="/treinos" element={<main className="main-content"><WorkoutsView
          models={models}
          routinesByModel={routinesByModel}
          exercisesByModel={exercisesByModel}
          onCreateModel={() => openModel()}
          onEditModel={(model) => openModel(model)}
          onActivateModel={(id) => { void runDatabaseAction(() => activateWorkoutModel(id)) }}
          onArchiveModel={(id, archived) => { void runDatabaseAction(() => archiveWorkoutModel(id, archived)) }}
          onReorderModels={(ids) => { void runDatabaseAction(() => reorderWorkoutModels(ids)) }}
          onCreateRoutine={(modelId) => openRoutine(undefined, modelId)}
          onStartRoutine={(routineId) => { void runDatabaseAction(async () => { await beginWorkoutSession(routineId); navigate('/sessao') }) }}
          onEditRoutine={(routine, modelId) => openRoutine(routine, modelId)}
          onDeleteRoutine={(id) => { void runDatabaseAction(() => removeWorkout(id)) }}
          onReorderRoutines={(modelId, ids) => { void runDatabaseAction(() => reorderModelRoutines(modelId, ids)) }}
          onCreateExercise={(routineId, modelId) => openExercise(undefined, routineId, modelId)}
          onEditExercise={(exercise, modelId) => openExercise(exercise, exercise.workoutId, modelId)}
          onDeleteExercise={(exercise) => { void runDatabaseAction(() => removeExercise(exercise.id)) }}
          onPreviewVideo={(url, title) => setVideoPreview({ url, title })}
        /></main>} />
        <Route path="/conta" element={<main className="main-content"><AccountView /></main>} />
        <Route path="/sessao" element={<main className="main-content"><SessionView /></main>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(undefined) }}>
        <form className="modal-card" onSubmit={modal.type === 'model' ? modelForm.handleSubmit(submitModel) : modal.type === 'workout' ? workoutForm.handleSubmit(submitWorkout) : exerciseForm.handleSubmit(submitExercise)}>
          <div className="modal-heading"><div><div className="eyebrow">PERSONALIZE SUA ROTINA</div><h2>{modal.type === 'model' ? (modal.item ? 'Editar modelo' : 'Novo modelo') : modal.type === 'workout' ? (modal.item ? 'Editar treino' : 'Novo treino') : (modal.item ? 'Editar exercício' : 'Novo exercício')}</h2></div><Button variant="ghost" size="icon" type="button" aria-label="Fechar" onClick={() => setModal(undefined)}><X size={18} /></Button></div>
          {modal.type === 'model' ? <>
            <label className="field-label">Nome do modelo<input {...modelForm.register('name')} maxLength={60} placeholder="Ex.: Hipertrofia" aria-invalid={Boolean(modelForm.formState.errors.name)} />{modelForm.formState.errors.name?.message && <small className="field-error" role="alert">{modelForm.formState.errors.name.message}</small>}</label>
            <label className="field-label">Descrição<textarea {...modelForm.register('description')} maxLength={180} placeholder="Descreva o objetivo deste modelo." aria-invalid={Boolean(modelForm.formState.errors.description)} />{modelForm.formState.errors.description?.message && <small className="field-error" role="alert">{modelForm.formState.errors.description.message}</small>}</label>
          </> : modal.type === 'workout' ? <>
            <label className="field-label">Nome do treino<input {...workoutForm.register('name')} maxLength={60} placeholder="Ex.: Treino A" aria-invalid={Boolean(workoutForm.formState.errors.name)} />{workoutForm.formState.errors.name?.message && <small className="field-error" role="alert">{workoutForm.formState.errors.name.message}</small>}</label>
            <label className="field-label">Foco<input {...workoutForm.register('focus')} maxLength={60} placeholder="Ex.: Empurrar" aria-invalid={Boolean(workoutForm.formState.errors.focus)} />{workoutForm.formState.errors.focus?.message && <small className="field-error" role="alert">{workoutForm.formState.errors.focus.message}</small>}</label>
            <label className="field-label">Descrição<textarea {...workoutForm.register('description')} maxLength={180} placeholder="Quais grupos musculares serão trabalhados?" aria-invalid={Boolean(workoutForm.formState.errors.description)} />{workoutForm.formState.errors.description?.message && <small className="field-error" role="alert">{workoutForm.formState.errors.description.message}</small>}</label>
          </> : <>
            <label className="field-label">Nome do exercício
              <select {...exerciseForm.register('name')} onChange={chooseExerciseSuggestion} aria-invalid={Boolean(exerciseForm.formState.errors.name)}>
                <option value="">Selecione um exercício sugerido</option>
                {modal.item && !exerciseCatalog.some((item) => item.name === modal.item?.name) && <option value={modal.item.name}>{modal.item.name} (personalizado)</option>}
                {exerciseCatalog.map((suggestion) => <option value={suggestion.name} key={suggestion.id}>{suggestion.name}</option>)}
              </select>
              {exerciseForm.formState.errors.name?.message && <small className="field-error" role="alert">{exerciseForm.formState.errors.name.message}</small>}
            </label>
            <label className="field-label">Grupo muscular<input {...exerciseForm.register('muscle')} maxLength={60} placeholder="Ex.: Peitoral superior" aria-invalid={Boolean(exerciseForm.formState.errors.muscle)} />{exerciseForm.formState.errors.muscle?.message && <small className="field-error" role="alert">{exerciseForm.formState.errors.muscle.message}</small>}</label>
            <div className="field-pair"><label className="field-label">Séries e repetições<input {...exerciseForm.register('setsReps')} maxLength={30} placeholder="3 x 12" aria-invalid={Boolean(exerciseForm.formState.errors.setsReps)} />{exerciseForm.formState.errors.setsReps?.message && <small className="field-error" role="alert">{exerciseForm.formState.errors.setsReps.message}</small>}</label><label className="field-label">Descanso (seg.)<input {...exerciseForm.register('rest', { valueAsNumber: true })} type="number" min="0" max="3600" /></label></div>
            <label className="field-label">Dica de execução<textarea {...exerciseForm.register('tip')} maxLength={220} placeholder="Anote uma dica para executar melhor." aria-invalid={Boolean(exerciseForm.formState.errors.tip)} />{exerciseForm.formState.errors.tip?.message && <small className="field-error" role="alert">{exerciseForm.formState.errors.tip.message}</small>}</label>
            <label className="field-label">Link opcional do vídeo
              <div className="flex items-center gap-2">
                <input {...exerciseForm.register('videoUrl')} type="url" placeholder="https://..." aria-invalid={Boolean(exerciseForm.formState.errors.videoUrl)} />
                {exerciseForm.watch('videoUrl') && <Button type="button" variant="secondary" size="sm" onClick={() => setVideoPreview({ url: exerciseForm.getValues('videoUrl') ?? '', title: exerciseForm.getValues('name') || 'Vídeo do exercício' })}><Play size={14} /> Prévia</Button>}
              </div>
              {exerciseForm.formState.errors.videoUrl?.message && <small className="field-error" role="alert">{exerciseForm.formState.errors.videoUrl.message}</small>}
            </label>
          </>}
          <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setModal(undefined)}>Cancelar</Button><Button type="submit">{modal.type === 'model' ? modal.item ? 'Salvar modelo' : 'Criar modelo' : modal.type === 'workout' ? modal.item ? 'Salvar treino' : 'Criar treino' : modal.item ? 'Salvar exercício' : 'Adicionar exercício'}</Button></div>
        </form>
      </div>}
      {pendingSuggestion && <div className="modal-backdrop suggestion-backdrop">
        <section className="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="suggestion-title">
          <div className="modal-heading"><div><div className="eyebrow">SUGESTÃO DO CATÁLOGO</div><h2 id="suggestion-title">Atualizar dados do exercício?</h2></div></div>
          <p className="text-sm leading-6 text-slate-300">Deseja alterar os dados com sugestão ao exercício <strong>{pendingSuggestion.name}</strong>?</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setPendingSuggestion(undefined)}>Não, manter os dados</Button>
            <Button onClick={() => {
              applyExerciseSuggestion(pendingSuggestion)
              setPendingSuggestion(undefined)
            }}>Sim, atualizar os dados</Button>
          </div>
        </section>
      </div>}
      {videoPreview && <VideoModal title={videoPreview.title} url={videoPreview.url} onClose={() => setVideoPreview(undefined)} />}
    </div>
  )
}

export default App

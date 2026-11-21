import { Activity, Check, ChevronDown, CircleStop, Clock3, Play, Timer, Video } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VideoModal } from '../components/commons/video-modal'
import { Button } from '../components/ui/button'
import {
  completeTrainingSession,
  loadActiveTrainingSession,
  saveTrainingSet,
  setTrainingExerciseCompleted,
  setTrainingExerciseEstimate,
  setTrainingSessionDate,
  setTrainingSessionEstimate,
  startTrainingExercise,
  startTrainingRest,
  stopTrainingRest,
} from '../lib/database'
import type { SessionExerciseRecord, SessionSetRecord, TrainingSessionSnapshot } from '../lib/db/session-repository'
import { useSystemStore } from '../store/system/system-store'
import { formatDuration } from '../utils'

export function SessionView() {
  const [snapshot, setSnapshot] = useState<TrainingSessionSnapshot>()
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [resultMessage, setResultMessage] = useState('')
  const [videoPreview, setVideoPreview] = useState<{ url: string; title: string }>()
  const setDatabaseState = useSystemStore((state) => state.setDatabaseState)

  const load = useCallback(async () => {
    try {
      setSnapshot(await loadActiveTrainingSession())
      setDatabaseState('ready')
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível carregar a sessão.')
    } finally {
      setLoading(false)
    }
  }, [setDatabaseState])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (!snapshot?.session.restStartedAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [snapshot?.session.restStartedAt])

  async function perform(action: () => Promise<unknown>, reload = true) {
    try {
      await action()
      if (reload) await load()
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível salvar o progresso da sessão.')
    }
  }

  function changeDate(trainingDate: string) {
    if (!snapshot) return
    setSnapshot({ ...snapshot, session: { ...snapshot.session, trainingDate } })
    void perform(() => setTrainingSessionDate(snapshot.session.id, trainingDate), false)
  }

  function changeSecondsPerSet(secondsPerSet: number) {
    if (!snapshot || !Number.isInteger(secondsPerSet) || secondsPerSet < 1 || secondsPerSet > 600) return
    setSnapshot({ ...snapshot, session: { ...snapshot.session, secondsPerSet } })
    void perform(() => setTrainingSessionEstimate(snapshot.session.id, secondsPerSet), false)
  }

  function changeExerciseEstimate(exercise: SessionExerciseRecord, seconds: number) {
    if (!snapshot || !Number.isInteger(seconds) || seconds < 0 || seconds > 86400) return
    const exercises = snapshot.exercises.map((item) => item.id === exercise.id ? { ...item, estimatedDurationSeconds: seconds } : item)
    setSnapshot({ ...snapshot, exercises })
    void perform(() => setTrainingExerciseEstimate(exercise.id, seconds), false)
  }

  function changeSetValue(set: SessionSetRecord, field: 'load' | 'performedRepetitions', value: string) {
    const parsed = value === '' ? null : Number(value)
    if (parsed !== null && !Number.isFinite(parsed)) return
    void perform(
      () => saveTrainingSet(set.id, field === 'load' ? { load: parsed } : { performedRepetitions: parsed }),
      false,
    )
  }

  function toggleSet(set: SessionSetRecord, exercise: SessionExerciseRecord) {
    if (!snapshot) return
    void perform(async () => {
      await saveTrainingSet(set.id, { completed: !set.completed })
      if (!set.completed && exercise.restSeconds > 0 && set.position < exercise.sets.length) {
        await startTrainingRest(snapshot.session.id, exercise.restSeconds)
      }
    })
  }

  async function finishSession() {
    if (!snapshot) return
    try {
      const status = await completeTrainingSession(snapshot.session.id)
      setResultMessage(status === 'completed'
        ? 'Treino concluído e registrado no calendário.'
        : status === 'partial'
          ? 'Treino parcial registrado. Ele não será marcado no calendário.'
          : 'Treino parado registrado. Ele não será marcado no calendário.')
      await load()
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível finalizar o treino.')
    }
  }

  const completedExercises = snapshot?.exercises.filter((exercise) => exercise.status === 'completed').length ?? 0
  const progress = snapshot?.exercises.length ? Math.round(completedExercises / snapshot.exercises.length * 100) : 0
  const estimatedRemaining = useMemo(() => {
    if (!snapshot) return 0
    return snapshot.exercises.reduce((total, exercise) => {
      if (exercise.status === 'completed') return total
      const pendingSets = exercise.sets.filter((set) => !set.completed).length
      if (exercise.estimatedDurationSeconds > 0) return total + exercise.estimatedDurationSeconds
      return total
        + pendingSets * snapshot.session.secondsPerSet
        + Math.max(0, pendingSets - 1) * exercise.restSeconds
    }, 0)
  }, [snapshot])
  const remainingRest = snapshot?.session.restStartedAt && snapshot.session.restDurationSeconds
    ? Math.max(0, Math.ceil((Date.parse(snapshot.session.restStartedAt) + snapshot.session.restDurationSeconds * 1000 - now) / 1000))
    : 0

  if (loading) return <section className="route-page" role="status">Carregando sessão...</section>

  if (!snapshot) return (
    <section className="route-page">
      <header className="route-heading"><div><div className="eyebrow"><Activity size={14} /> SESSÃO DE TREINO</div><h1>Treino em andamento</h1><p>{resultMessage || 'Nenhuma sessão em andamento. Inicie um treino do modelo ativo para começar.'}</p></div></header>
      <Button asChild><Link to="/treinos">Ir para meus treinos</Link></Button>
    </section>
  )

  const { session, exercises } = snapshot
  return (
    <section className="route-page session-page">
      <header className="route-heading">
        <div>
          <div className="eyebrow"><Activity size={14} /> SESSÃO DE TREINO</div>
          <h1>{session.routineName}</h1>
          <p>Seu progresso é salvo automaticamente neste dispositivo.</p>
        </div>
        <Button variant="secondary" onClick={finishSession}><CircleStop size={15} /> Finalizar treino</Button>
      </header>

      <section className="session-overview">
        <label className="field-label">Data do treino<input type="date" value={session.trainingDate} onChange={(event) => changeDate(event.target.value)} /></label>
        <div className="session-progress">
          <div className="flex items-center justify-between gap-3"><strong>{completedExercises} de {exercises.length} exercícios concluídos</strong><span>{progress}%</span></div>
          <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
          <p>{formatDuration(estimatedRemaining)} estimados · não inclui o descanso em andamento</p>
        </div>
        <label className="field-label">Estimativa por série (seg.)<input type="number" min="1" max="600" value={session.secondsPerSet} onChange={(event) => changeSecondsPerSet(Number(event.target.value))} /></label>
      </section>

      {session.restStartedAt && <section className={`session-rest ${remainingRest === 0 ? 'is-finished' : ''}`} role="status">
        <Timer size={18} />
        <div><strong>{remainingRest ? `Descanso · ${formatDuration(remainingRest)}` : 'Descanso concluído'}</strong><span>{remainingRest ? 'A contagem continua mesmo se você fechar o aplicativo.' : 'O tempo terminou enquanto o app estava fechado ou em segundo plano.'}</span></div>
        <Button variant="ghost" size="sm" onClick={() => { void perform(() => stopTrainingRest(session.id)) }}>Encerrar descanso</Button>
      </section>}

      <div className="session-exercise-list">
        {exercises.map((exercise) => {
          const canMarkComplete = exercise.status === 'in_progress' || exercise.status === 'completed'
          return <details className="session-exercise-card" key={exercise.id} open={session.currentExerciseId === exercise.id}>
            <summary>
              <span className={`session-status-indicator status-${exercise.status}`} />
              <span className="min-w-0 flex-1"><strong>{exercise.name}</strong><small>{exercise.muscle} · {exercise.setsReps}</small></span>
              <span className="session-status-label">{exercise.status === 'completed' ? 'Concluído' : exercise.status === 'in_progress' ? 'Em andamento' : 'Não iniciado'}</span>
              <ChevronDown className="collapse-indicator" size={16} />
            </summary>
            <div className="session-exercise-content">
              <div className="flex justify-between mt-4">
                <p>{exercise.tip}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {exercise.status === 'not_started' && <Button size="sm" onClick={() => { void perform(() => startTrainingExercise(exercise.id)) }}><Play size={14} /> Iniciar exercício</Button>}
                  {canMarkComplete && <Button variant={exercise.status === 'completed' ? 'secondary' : 'default'} size="sm" onClick={() => { void perform(() => setTrainingExerciseCompleted(exercise.id, exercise.status !== 'completed')) }}>
                    <Check size={14} /> {exercise.status === 'completed' ? 'Desmarcar como feito' : 'Marcar exercício como feito'}
                  </Button>}
                  {exercise.videoUrl && <Button variant="ghost" size="sm" onClick={() => setVideoPreview({ url: exercise.videoUrl, title: exercise.name })}><Video size={14} /> Assistir vídeo</Button>}
                </div>
              </div>
              {exercise.estimatedDurationSeconds > 0 && <label className="field-label session-duration-field">Duração estimada para este exercício (min.)<input
                type="number"
                min="0"
                max="1440"
                value={Math.round(exercise.estimatedDurationSeconds / 60)}
                onChange={(event) => changeExerciseEstimate(exercise, Number(event.target.value) * 60)}
              /></label>}
              <div className="session-sets">
                <div className="session-set-count" aria-live="polite">
                  {exercise.sets.filter((set) => set.completed).length}/{exercise.sets.length} séries registradas
                </div>
                {exercise.sets.map((set) => <div className={`session-set-row ${set.completed ? 'is-completed' : ''}`} key={set.id}>
                  <div className="session-set-target"><strong>Série {set.position}</strong><span>{set.targetRepetitions} rep.</span></div>
                  <label>Carga (kg)<input
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={set.load ?? ''}
                    disabled={exercise.status === 'not_started'}
                    onChange={(event) => changeSetValue(set, 'load', event.target.value)}
                  /></label>
                  <label>Repetições<input
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={set.performedRepetitions ?? ''}
                    disabled={exercise.status === 'not_started'}
                    onChange={(event) => changeSetValue(set, 'performedRepetitions', event.target.value)}
                  /></label>
                  <Button
                    variant={set.completed ? 'secondary' : 'ghost'}
                    size="sm"
                    disabled={exercise.status === 'not_started'}
                    onClick={() => toggleSet(set, exercise)}
                    aria-label={set.completed ? `Desmarcar série ${set.position}` : `Registrar série ${set.position}`}
                  >{set.completed ? 'Feita' : 'Registrar série'}</Button>
                  {exercise.restSeconds > 0 && set.position < exercise.sets.length && <Button
                    variant="ghost"
                    size="icon"
                    disabled={exercise.status === 'not_started'}
                    aria-label={`Iniciar descanso de ${exercise.restSeconds} segundos`}
                    onClick={() => { void perform(() => startTrainingRest(session.id, exercise.restSeconds)) }}
                  ><Clock3 size={15} /></Button>}
                </div>)}
              </div>
            </div>
          </details>
        })}
      </div>
      {videoPreview && <VideoModal title={videoPreview.title} url={videoPreview.url} onClose={() => setVideoPreview(undefined)} />}
    </section>
  )
}

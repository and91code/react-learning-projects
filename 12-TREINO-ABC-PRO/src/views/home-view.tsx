import { CalendarDays, Check, ChevronLeft, ChevronRight, Dumbbell, ListChecks } from 'lucide-react'
import { Button } from '../components/ui/button'
import type { Workout } from '../types'
import type { TrainingSessionSnapshot } from '../lib/db/session-repository'

type HomeViewProps = {
  activeWorkout?: Workout
  workouts: Workout[]
  exerciseCount: number
  month: Date
  monthSessions: TrainingSessionSnapshot[]
  selectedDate: string
  suggestedRoutine?: Workout
  sessionInProgress: boolean
  activeModelName: string
  modelCount: number
  onMonthChange: (offset: number) => void
  onSelectDate: (date: string) => void
  onStartRoutine: (routineId: number) => void
}

export function HomeView({
  activeWorkout,
  workouts,
  exerciseCount,
  month,
  monthSessions,
  selectedDate,
  suggestedRoutine,
  sessionInProgress,
  activeModelName,
  modelCount,
  onMonthChange,
  onSelectDate,
  onStartRoutine,
}: HomeViewProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const calendarDays = Array.from({ length: Math.ceil((firstDayOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDayOffset + 1
    return day > 0 && day <= daysInMonth ? day : undefined
  })
  const dateSessions = monthSessions.filter(({ session }) => session.trainingDate === selectedDate)
  const completedSessions = monthSessions.filter(({ session }) => session.status === 'completed')
  const completedExercises = completedSessions.reduce(
    (count, { exercises: sessionExercises }) => count + sessionExercises.filter((exercise) => exercise.status === 'completed').length,
    0,
  )
  const selectedDay = Number(selectedDate.slice(-2))

  return (
    <main className="main-content">
      <div className="breadcrumb">Painel <span>/</span> <b>{activeWorkout?.name ?? 'Visão geral'}</b></div>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="pulse-dot" /> SEU ESPAÇO DE TREINO</div>
          <h1>{activeWorkout ? activeWorkout.name : 'Bom treino.'} <span>Vamos nessa.</span></h1>
          <p>{activeWorkout?.description ?? 'Acompanhe seus treinos e mantenha o foco em cada repetição.'}</p>
        </div>
      </section>

      <section className="home-history-grid">
        <div className="calendar-card">
          <div className="calendar-heading">
            <div><span className="section-label">HISTÓRICO DE TREINOS</span><h2><CalendarDays size={19} /> Calendário</h2></div>
            <div className="calendar-month-controls">
              <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => onMonthChange(-1)}><ChevronLeft size={18} /></Button>
              <strong>{monthLabel}</strong>
              <Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => onMonthChange(1)}><ChevronRight size={18} /></Button>
            </div>
          </div>
          <div className="calendar-summary"><span><b>{completedSessions.length}</b> treinos concluídos</span><span><b>{completedExercises}</b> exercícios concluídos</span></div>
          <div className="calendar-grid" role="grid" aria-label={`Calendário de ${monthLabel}`}>
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span className="calendar-weekday" role="columnheader" key={day}>{day}</span>)}
            {calendarDays.map((day, index) => {
              const date = day ? `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const sessions = monthSessions.filter(({ session }) => session.trainingDate === date)
              const hasCompletedSession = sessions.some(({ session }) => session.status === 'completed')
              return day
                ? <button
                    className={`calendar-day ${selectedDate === date ? 'selected' : ''} ${hasCompletedSession ? 'has-completed' : ''}`}
                    key={date}
                    aria-label={`${day} de ${monthLabel}${hasCompletedSession ? ', treino concluído' : sessions.length ? ', treino não concluído' : ''}`}
                    aria-pressed={selectedDate === date}
                    onClick={() => onSelectDate(date)}
                  >{day}{hasCompletedSession && <span className="calendar-dot" />}</button>
                : <span className="calendar-day empty" key={`empty-${index}`} aria-hidden="true" />
            })}
          </div>
          <div className="calendar-details">
            <strong>{selectedDay} de {month.toLocaleDateString('pt-BR', { month: 'long' })}</strong>
            {dateSessions.length ? dateSessions.map(({ session, exercises: sessionExercises }) => (
              <article className="history-session" key={session.id}>
                <div><b>{session.routineName}</b><span>{session.status === 'completed' ? 'Concluído' : session.status === 'partial' ? 'Parcial' : session.status === 'stopped' ? 'Parado' : 'Em andamento'}</span></div>
                <small>{sessionExercises.map((exercise) => `${exercise.name} (${exercise.status === 'completed' ? 'feito' : exercise.status === 'skipped' ? 'não iniciado' : 'pendente'})`).join(' · ')}</small>
              </article>
            )) : <p>Nenhuma sessão registrada neste dia.</p>}
          </div>
        </div>
        <div className="suggestion-card">
          <span className="section-label">SEU PRÓXIMO TREINO</span>
          <small className="home-model-summary">{activeModelName || 'Sem modelo ativo'} · {modelCount} {modelCount === 1 ? 'modelo' : 'modelos'}</small>
          {suggestedRoutine ? <>
            <div className="suggestion-icon"><Dumbbell size={21} /></div>
            <h2>{suggestedRoutine.name}</h2>
            <p>{suggestedRoutine.focus || suggestedRoutine.description || 'Continue sua sequência de treinos.'}</p>
            <Button onClick={() => onStartRoutine(suggestedRoutine.id)} disabled={sessionInProgress}><Check size={16} /> {sessionInProgress ? 'Treino em andamento' : 'Iniciar treino'}</Button>
          </> : <p>Adicione uma rotina ao modelo ativo para começar.</p>}
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card"><div className="stat-icon mint"><Dumbbell size={18} /></div><div><span>TREINOS CRIADOS</span><strong>{String(workouts.length).padStart(2, '0')}</strong></div><small>rotinas no modelo ativo</small></div>
        <div className="stat-card"><div className="stat-icon blue"><ListChecks size={18} /></div><div><span>EXERCÍCIOS CADASTRADOS</span><strong>{String(exerciseCount).padStart(2, '0')}</strong></div><small>no modelo ativo</small></div>
      </section>
    </main>
  )
}

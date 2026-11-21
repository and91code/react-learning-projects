import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { ImagePlus, Pencil, Trash2, UserRound } from 'lucide-react'
import { Button } from '../components/ui/button'
import { MAX_PROFILE_PHOTO_BYTES } from '../lib/db/profile-repository'
import {
  clearHistoricalSet,
  listExerciseLoadHistory,
  loadLocalProfile,
  saveLocalProfile,
  updateHistoricalSet,
} from '../lib/database'
import type { ExerciseLoadHistory, ExerciseLoadHistoryEntry } from '../lib/db/history-repository'
import { useSystemStore } from '../store/system/system-store'
import type { LocalProfile } from '../lib/db/profile-repository'
import { PageHeading } from '../components/commons/page-heading'
import 'react-easy-crop/react-easy-crop.css'

type CropPixels = Area

async function toWebpDataUrl(source: string, area: CropPixels) {
  const image = new Image()
  image.src = source
  await image.decode()
  const canvas = document.createElement('canvas')
  const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]
  const dimensions = [512, 384, 256]

  for (const dimension of dimensions) {
    const outputSize = Math.max(1, Math.min(dimension, Math.floor(area.width), Math.floor(area.height)))
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a imagem para o recorte.')
    context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outputSize, outputSize)

    for (const quality of qualities) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
      if (!blob) throw new Error('O navegador não conseguiu converter a foto para WebP.')
      if (blob.size <= MAX_PROFILE_PHOTO_BYTES) {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Falha ao ler a foto recortada.'))
          reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler a foto recortada.'))
          reader.readAsDataURL(blob)
        })
      }
    }
  }
  throw new Error('A foto ainda excede 200 KiB após a compressão. Escolha uma imagem mais simples.')
}

function formatTrainingDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

export function AccountView() {
  const setDatabaseState = useSystemStore((state) => state.setDatabaseState)
  const [profile, setProfile] = useState<LocalProfile>({ name: 'Atleta', photoDataUrl: null })
  const [name, setName] = useState('Atleta')
  const [history, setHistory] = useState<ExerciseLoadHistory[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [editingEntry, setEditingEntry] = useState<ExerciseLoadHistoryEntry>()
  const [editLoad, setEditLoad] = useState('')
  const [editRepetitions, setEditRepetitions] = useState('')
  const [imageSource, setImageSource] = useState<string>()
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropPixels, setCropPixels] = useState<CropPixels>()
  const [croppedPhoto, setCroppedPhoto] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [nextProfile, nextHistory] = await Promise.all([loadLocalProfile(), listExerciseLoadHistory()])
      setProfile(nextProfile)
      setName(nextProfile.name)
      setHistory(nextHistory)
      setSelectedExercise((selected) => nextHistory.some((item) => item.exerciseName === selected)
        ? selected
        : nextHistory[0]?.exerciseName ?? '')
      setDatabaseState('ready')
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível carregar o perfil local.')
    } finally {
      setLoading(false)
    }
  }, [setDatabaseState])

  useEffect(() => { void loadData() }, [loadData])
  useEffect(() => {
    if (!imageSource) return
    return () => URL.revokeObjectURL(imageSource)
  }, [imageSource])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const next = { name, photoDataUrl: croppedPhoto ?? profile.photoDataUrl }
      await saveLocalProfile(next)
      setProfile(next)
      setCroppedPhoto(undefined)
      setMessage('Perfil salvo neste dispositivo.')
      setDatabaseState('ready')
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Escolha um arquivo de imagem.')
      return
    }
    setImageSource(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCropPixels(undefined)
    setMessage('')
  }

  async function applyPhotoCrop() {
    if (!imageSource || !cropPixels) return
    setSaving(true)
    try {
      setCroppedPhoto(await toWebpDataUrl(imageSource, cropPixels))
      setImageSource(undefined)
      setMessage('Recorte pronto. Salve o perfil para aplicar a foto.')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Não foi possível recortar a foto.')
    } finally {
      setSaving(false)
    }
  }

  async function editHistoryEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingEntry || !window.confirm('Salvar as alterações desta série no histórico?')) return
    setSaving(true)
    try {
      await updateHistoricalSet(editingEntry.setId, {
        load: editLoad === '' ? null : Number(editLoad),
        performedRepetitions: editRepetitions === '' ? null : Number(editRepetitions),
      })
      setEditingEntry(undefined)
      await loadData()
      setMessage('Registro atualizado.')
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível editar o registro.')
    } finally {
      setSaving(false)
    }
  }

  async function clearHistoryEntry(entry: ExerciseLoadHistoryEntry) {
    if (!window.confirm('Limpar carga e repetições desta série? A sessão será mantida no histórico.')) return
    setSaving(true)
    try {
      await clearHistoricalSet(entry.setId)
      await loadData()
      setMessage('Carga e repetições removidas. A sessão foi preservada.')
    } catch (reason) {
      setDatabaseState('error', reason instanceof Error ? reason.message : 'Não foi possível limpar o registro.')
    } finally {
      setSaving(false)
    }
  }

  const selectedHistory = history.find((item) => item.exerciseName === selectedExercise)
  const avatar = croppedPhoto ?? profile.photoDataUrl

  return (
    <section className="route-page account-page">
      <PageHeading eyebrow="PERFIL LOCAL" title="Conta" description="Seu perfil e histórico ficam armazenados somente neste dispositivo." icon={<UserRound size={22} />} />
      {loading ? <p role="status">Carregando seus dados locais...</p> : <>
        <form className="account-profile-card" onSubmit={(event) => { void saveProfile(event) }}>
          <div className="account-avatar">
            {avatar ? <img src={avatar} alt={`Foto de ${name || 'perfil'}`} /> : <UserRound size={32} />}
          </div>
          <div className="account-profile-fields">
            <label className="field-label">Nome<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <div className="account-photo-actions">
              <label className="account-file-button">
                <ImagePlus size={16} /> Escolher foto
                <input type="file" accept="image/*" onChange={choosePhoto} />
              </label>
              {avatar && <Button type="button" variant="ghost" size="sm" onClick={() => { setCroppedPhoto(undefined); setProfile({ ...profile, photoDataUrl: null }) }}>Remover foto</Button>}
              <small>Recorte quadrado · WebP até 512 × 512 px e 200 KiB</small>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar perfil'}</Button>
            {message && <p className="account-message" role="status">{message}</p>}
          </div>
        </form>

        <section className="account-history-card">
          <div className="account-history-heading">
            <div><span className="section-label">EVOLUÇÃO</span><h2>Histórico de cargas</h2></div>
            {history.length > 0 && <label className="field-label">Exercício<select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
              {history.map((item) => <option key={item.exerciseName} value={item.exerciseName}>{item.exerciseName}</option>)}
            </select></label>}
          </div>
          {selectedHistory ? <div className="account-history-list">
            {selectedHistory.entries.map((entry) => <article className="account-history-row" key={entry.setId}>
              <div className="account-history-values">
                <strong>{formatTrainingDate(entry.trainingDate)} · Série {entry.setPosition}</strong>
                <span>{entry.routineName}</span>
                {editingEntry?.setId === entry.setId ? <form className="account-edit-set" onSubmit={(event) => { void editHistoryEntry(event) }}>
                  <label>Carga (kg)<input type="number" min="0" step="0.5" value={editLoad} onChange={(event) => setEditLoad(event.target.value)} /></label>
                  <label>Repetições<input type="number" min="1" step="1" value={editRepetitions} onChange={(event) => setEditRepetitions(event.target.value)} /></label>
                  <Button size="sm" type="submit" disabled={saving}>Confirmar edição</Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setEditingEntry(undefined)}>Cancelar</Button>
                </form> : <span>{entry.load === null ? '—' : `${entry.load} kg`} · {entry.performedRepetitions === null ? '—' : `${entry.performedRepetitions} rep.`}</span>}
              </div>
              {editingEntry?.setId !== entry.setId && <div className="account-history-actions">
                <Button variant="ghost" size="icon" aria-label={`Editar série ${entry.setPosition}`} onClick={() => {
                  setEditingEntry(entry)
                  setEditLoad(entry.load === null ? '' : String(entry.load))
                  setEditRepetitions(entry.performedRepetitions === null ? '' : String(entry.performedRepetitions))
                }}><Pencil size={15} /></Button>
                <Button variant="ghost" size="icon" aria-label={`Limpar série ${entry.setPosition}`} onClick={() => { void clearHistoryEntry(entry) }}><Trash2 size={15} /></Button>
              </div>}
            </article>)}
          </div> : <p className="account-empty-history">As cargas registradas aparecerão aqui após finalizar uma sessão.</p>}
        </section>
      </>}

      {imageSource && <div className="cropper-backdrop">
        <section className="cropper-dialog" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
          <h2 id="cropper-title">Recortar foto do perfil</h2>
          <div className="cropper-viewport">
            <Cropper
              image={imageSource}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCropPixels(pixels)}
            />
          </div>
          <label className="field-label cropper-zoom">Zoom<input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
          <div className="cropper-actions">
            <Button type="button" variant="ghost" onClick={() => setImageSource(undefined)}>Cancelar</Button>
            <Button type="button" disabled={saving || !cropPixels} onClick={() => { void applyPhotoCrop() }}>{saving ? 'Processando...' : 'Aplicar recorte'}</Button>
          </div>
        </section>
      </div>}
    </section>
  )
}

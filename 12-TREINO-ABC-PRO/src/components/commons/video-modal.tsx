import { ExternalLink, X } from 'lucide-react'
import { Button } from '../ui/button'

type VideoSource = { type: 'video' | 'iframe'; url: string }

function getVideoSource(value: string): VideoSource | undefined {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined

  const host = url.hostname.replace(/^www\./, '')
  if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const id = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]
    return id && /^[\w-]{11}$/.test(id)
      ? { type: 'iframe', url: `https://www.youtube-nocookie.com/embed/${id}` }
      : { type: 'iframe', url: url.toString() }
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(?:video\/)?(\d+)/)?.[1]
    return id ? { type: 'iframe', url: `https://player.vimeo.com/video/${id}` } : { type: 'iframe', url: url.toString() }
  }

  return /\.(?:mp4|webm|ogg)$/i.test(url.pathname)
    ? { type: 'video', url: url.toString() }
    : { type: 'iframe', url: url.toString() }
}

type VideoModalProps = {
  title: string
  url: string
  onClose: () => void
}

export function VideoModal({ title, url, onClose }: VideoModalProps) {
  const source = getVideoSource(url)

  return (
    <div className="modal-backdrop video-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="video-modal-card" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
        <header className="video-modal-header">
          <h2 id="video-modal-title">{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Fechar vídeo" onClick={onClose}><X size={18} /></Button>
        </header>
        {source ? <div className="video-frame">
          {source.type === 'video'
            ? <video src={source.url} controls playsInline aria-label={title} />
            : <iframe
              src={source.url}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />}
        </div> : <p className="text-sm text-slate-300">Este link não pode ser exibido como vídeo. Tente abrir diretamente.</p>}
        <a className="video-modal-external" href={url} target="_blank" rel="noreferrer">
          Abrir vídeo em nova aba <ExternalLink size={14} />
        </a>
      </section>
    </div>
  )
}

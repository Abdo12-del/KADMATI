/**
 * The editor page — the shell that wires the stores, canvas, panels, keyboard layer, autosave and
 * presentation mode together. Route: /edit/:id.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { TopBar } from '../editor/TopBar'
import { LeftPanel } from '../editor/LeftPanel'
import { RightPanel } from '../editor/RightPanel'
import { StatusBar } from '../editor/StatusBar'
import { CanvasStage } from '../editor/CanvasStage'
import { PresentMode } from '../editor/PresentMode'
import { useKeyboard } from '../editor/useKeyboard'
import { useDoc } from '../store/useDoc'
import { useLibrary } from '../store/useLibrary'
import { useUI } from '../store/useUI'
import { useAutosave } from '../store/autosave'
import { createEmptyDoc } from '../document/factory'
import { DialogHost } from '../components/Dialogs'
import { AnimationDock } from '../editor/anim/AnimationDock'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [presenting, setPresenting] = useState(false)
  const [animOpen, setAnimOpen] = useState(false)
  const load = useDoc((s) => s.load)
  const projectId = useDoc((s) => s.projectId)
  const doc = useDoc((s) => s.doc)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!id) {
        navigate('/', { replace: true })
        return
      }
      if (projectId === id && useDoc.getState().doc.slides.length) {
        setState('ready')
        return
      }
      setState('loading')
      const record = await useLibrary.getState().openDoc(id)
      if (cancelled) return
      if (!record) {
        setState('missing')
        return
      }
      load(record, id)
      setState('ready')
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [id, load, navigate, projectId])

  useAutosave(id ?? '', state === 'ready')

  const exitPresent = useCallback(() => setPresenting(false), [])

  useEffect(() => {
    const start = () => setPresenting(true)
    window.addEventListener('kadmati:present', start)
    return () => window.removeEventListener('kadmati:present', start)
  }, [])

  useEffect(() => {
    const close = () => setAnimOpen(false)
    window.addEventListener('kadmati:anim-close', close)
    return () => window.removeEventListener('kadmati:anim-close', close)
  }, [])

  useKeyboard({
    onPresent: () => setPresenting(true),
    onSave: () => {
      if (!id) return
      useDoc.getState().markSaved('saving')
      void useLibrary.getState().persistDoc(id, useDoc.getState().doc).then(() => useDoc.getState().markSaved('saved'))
    },
    onEscape: () => {
      if (presenting) {
        setPresenting(false)
        return true
      }
      if (useUI.getState().dialog) {
        useUI.getState().closeDialog()
        return true
      }
      return false
    },
  })

  if (state === 'loading') {
    return (
      <div className="grid h-full place-items-center bg-ink-950">
        <div className="flex items-center gap-2 text-[13px] text-ink-300">
          <Loader2 size={15} className="animate-spin" /> يُفتح العرض…
        </div>
      </div>
    )
  }

  if (state === 'missing') {
    return (
      <div className="grid h-full place-items-center bg-ink-950 px-6">
        <div className="max-w-sm text-center">
          <AlertTriangle size={22} className="mx-auto text-warn" />
          <h2 className="mt-3 font-display text-[19px] font-semibold text-ink-50">لم نجد هذا العرض</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">
            ربما حُذف من السلة أو فُتح في متصفح آخر — المشاريع تُخزَّن محليًا في هذا الجهاز.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="aur-fill mt-4 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            العودة إلى المكتبة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-ink-950">
      <TopBar onPresent={() => setPresenting(true)} animOpen={animOpen} onToggleAnim={() => setAnimOpen((v) => !v)} />
      <div className="flex min-h-0 flex-1">
        <LeftPanel />
        <main className="relative flex min-w-0 flex-1 flex-col">
          <CanvasStage />
          {animOpen && doc ? <AnimationDock /> : null}
        </main>
        <RightPanel />
      </div>
      <StatusBar />
      <DialogHost />
      {presenting ? <PresentMode doc={doc ?? createEmptyDoc()} startAt={useDoc.getState().slideIndex} onExit={exitPresent} /> : null}
    </div>
  )
}

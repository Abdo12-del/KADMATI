/**
 * Autosave. Local-first: every mutation is debounced into IndexedDB, and the UI reports the
 * exact state (`saved` / `saving` / `offline` / `dirty`). A refresh never loses work.
 */
import { toJpeg } from 'html-to-image'
import { useEffect, useRef } from 'react'
import { useLibrary } from './useLibrary'
import { useDoc } from './useDoc'

const DEBOUNCE = 900

/** The element the editor registers so autosave can capture a real thumbnail of the current slide. */
let slideNode: HTMLElement | null = null
export function registerSlideNode(el: HTMLElement | null) {
  slideNode = el
}

export async function captureThumbnail(): Promise<string | undefined> {
  if (!slideNode) return undefined
  try {
    const dataUrl = await toJpeg(slideNode, {
      quality: 0.72,
      cacheBust: true,
      pixelRatio: 0.34,
      backgroundColor: '#ffffff',
      skipFonts: true,
    })
    return dataUrl
  } catch {
    return undefined
  }
}

export function useAutosave(projectId: string, enabled = true) {
  const timer = useRef<number | null>(null)
  const pending = useRef(false)
  const save = useLibrary((s) => s.persistDoc)

  useEffect(() => {
    if (!enabled) return
    const flush = async () => {
      const { doc, markSaved } = useDoc.getState()
      markSaved('saving')
      const thumbnail = await captureThumbnail()
      try {
        await save(projectId, doc, thumbnail)
        markSaved(navigator.onLine ? 'saved' : 'offline')
      } catch {
        markSaved('error')
      }
    }
    const unsub = useDoc.subscribe((state, prev) => {
      if (state.doc === prev.doc) return
      pending.current = true
      state.markDirty()
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        if (!pending.current) return
        pending.current = false
        void flush()
      }, DEBOUNCE)
    })
    return () => {
      unsub()
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [projectId, enabled, save])

  // Flush on tab hide so a crash/refresh mid-edit still lands.
  useEffect(() => {
    if (!enabled) return
    const onHide = () => {
      if (document.visibilityState === 'hidden' && pending.current) {
        pending.current = false
        void save(projectId, useDoc.getState().doc)
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [projectId, enabled, save])

  useEffect(() => {
    if (!enabled) return
    const offline = () => useDoc.getState().markSaved('offline')
    const online = () => useDoc.getState().markSaved('saved')
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [enabled])
}

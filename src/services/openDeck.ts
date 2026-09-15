/**
 * Cross-cutting deck opening: import flows (PPTX drop, "open" from dashboard, AI generation)
 * need to create/load a project and move the router — without importing the router themselves.
 */
import { useNavigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { useDoc } from '../store/useDoc'
import { useLibrary } from '../store/useLibrary'
import type { Presentation } from '../document/types'
import { toast } from '../store/useUI'

type OpenDetail = { projectId?: string; doc?: Presentation; focus?: boolean }

const bus = new EventTarget()
let pending: OpenDetail | null = null

export function requestOpenProject(detail: OpenDetail) {
  pending = detail
  bus.dispatchEvent(new CustomEvent('shafaq:open', { detail }))
}

/** Mounted once in App; consumes open requests as soon as the router exists. */
export function useDeckOpener() {
  const navigate = useNavigate()
  const handle = useCallback(
    async (detail: OpenDetail) => {
      const library = useLibrary.getState()
      let projectId = detail.projectId
      if (detail.doc) {
        const record = await library.createProject(detail.doc)
        projectId = record.id
      }
      if (!projectId) return
      const doc = await library.openDoc(projectId)
      if (!doc) {
        toast({ kind: 'error', title: 'تعذّر فتح العرض', body: 'قد يكون محذوفًا من السلة.' })
        return
      }
      useDoc.getState().load(doc, projectId)
      navigate(`/edit/${projectId}`)
    },
    [navigate],
  )

  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<OpenDetail>).detail
      pending = null
      void handle(detail)
    }
    bus.addEventListener('shafaq:open', listener)
    if (pending) {
      const p = pending
      pending = null
      void handle(p)
    }
    return () => bus.removeEventListener('shafaq:open', listener)
  }, [handle])
}

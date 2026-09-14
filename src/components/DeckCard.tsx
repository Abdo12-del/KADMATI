/**
 * Library cards. The thumbnails are *rendered from the stored document* — not saved screenshots —
 * so a deck's card always shows its real current state, and deleting/renaming is instant.
 */
import { useNavigate } from 'react-router-dom'
import { Copy, Eye, FolderInput, Heart, MoreVertical, Trash2 } from 'lucide-react'
import { SlideView } from '../render/SlideView'
import { MenuItem, Popover } from './ui'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { toast } from '../store/useUI'
import { cn } from '../lib/cn'
import type { Presentation, ProjectRecord } from '../document/types'

export function DeckThumb({ doc, which = 0, className }: { doc: Presentation; which?: number; className?: string }) {
  const slide = doc.slides[Math.min(which, doc.slides.length - 1)] ?? doc.slides[0]
  // The card is ~240px wide; scaling the real slide is cheaper and truer than a cached image.
  const scale = 240 / doc.size.w
  if (!slide) return <div className={cn('aspect-video w-full bg-ink-900', className)} />
  return (
    <div className={cn('relative overflow-hidden bg-ink-950', className)} style={{ aspectRatio: `${doc.size.w} / ${doc.size.h}` }}>
      <div className="absolute inset-0" style={{ width: doc.size.w, height: doc.size.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SlideView slide={slide} doc={doc} mode="thumb" static />
      </div>
    </div>
  )
}

export function DeckCard({ record, onOpen }: { record: ProjectRecord; onOpen?: () => void }) {
  const navigate = useNavigate()
  const library = useLibrary()
  const doc = record.doc
  const title = doc.metadata.title || 'بدون عنوان'

  return (
    <article className="group relative overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-ink-600">
      <button type="button" onClick={() => (onOpen ? onOpen() : requestOpenProject({ projectId: record.id }))} className="block w-full text-start">
        <div className="relative">
          <DeckThumb doc={doc} />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <span className="absolute bottom-1.5 end-1.5 rounded-md bg-ink-950/80 px-1.5 py-0.5 font-mono text-[10px] text-ink-200 backdrop-blur">
            {doc.slides.length} شريحة
          </span>
        </div>
        <div className="px-3 pb-2 pt-2.5">
          <h3 className="truncate text-[13.5px] font-semibold text-ink-50">{title}</h3>
          <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
            {relative(record.updatedAt)} · {doc.theme.name}
          </p>
        </div>
      </button>
      <div className="absolute end-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          title={record.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          onClick={() => void library.toggleFavorite(record.id)}
          className={cn('grid size-7 place-items-center rounded-lg bg-ink-950/75 backdrop-blur transition-colors hover:bg-ink-900', record.favorite ? 'text-signal' : 'text-ink-200')}
        >
          <Heart size={12} className={record.favorite ? 'fill-current' : undefined} />
        </button>
        <button
          type="button"
          title="فتح"
          onClick={() => (onOpen ? onOpen() : requestOpenProject({ projectId: record.id }))}
          className="grid size-7 place-items-center rounded-lg bg-ink-950/75 text-ink-200 backdrop-blur transition-colors hover:bg-ink-900"
        >
          <Eye size={12} />
        </button>
        <Popover
          align="end"
          trigger={(p) => (
            <button
              type="button"
              title="المزيد"
              className={cn('grid size-7 place-items-center rounded-lg bg-ink-950/75 text-ink-200 backdrop-blur hover:bg-ink-900', p.open && 'bg-ink-900')}
              onClick={p.toggle}
            >
              <MoreVertical size={12} />
            </button>
          )}
        >
          {(close) => (
            <div className="w-48 p-1">
              <MenuItem
                icon={<Copy size={13} />}
                onClick={async () => {
                  const created = await library.duplicateProject(record.id)
                  close()
                  toast({ kind: created ? 'success' : 'error', title: created ? 'أُنسخ العرض' : 'تعذّر النسخ' })
                }}
              >
                تكرار
              </MenuItem>
              <MenuItem
                icon={<Eye size={13} />}
                onClick={() => {
                  navigate(`/preview/${record.id}`)
                  close()
                }}
              >
                معاينة الشرائح
              </MenuItem>
              {library.folders.length || record.folderId ? (
                <div className="border-t border-ink-800 py-1">
                  <p className="px-2 pb-1 pt-0.5 text-[10px] uppercase tracking-wider text-ink-500">نقل إلى مجلد</p>
                  <MenuItem icon={<FolderInput size={13} />} onClick={() => { void library.moveToFolder(record.id); close() }}>
                    بلا مجلد
                  </MenuItem>
                  {library.folders.map((folder) => (
                    <MenuItem
                      key={folder.id}
                      icon={<span className={cn('ms-1 size-1.5 rounded-full', record.folderId === folder.id ? 'bg-signal' : 'bg-ink-600')} />}
                      onClick={() => {
                        void library.moveToFolder(record.id, folder.id)
                        close()
                        toast({ kind: 'success', title: `نُقل إلى «${folder.name}»` })
                      }}
                    >
                      {folder.name}
                    </MenuItem>
                  ))}
                </div>
              ) : null}
              <MenuItem
                danger
                icon={<Trash2 size={13} />}
                onClick={async () => {
                  await library.trashProject(record.id)
                  close()
                  toast({ kind: 'info', title: 'أُضيف إلى السلة', body: 'يمكنك استعادته من سلة المحذوفات.', action: { label: 'تراجع', run: () => void library.restoreProject(record.id) } })
                }}
              >
                نقل إلى السلة
              </MenuItem>
            </div>
          )}
        </Popover>
      </div>
    </article>
  )
}

export function relative(ts: number): string {
  if (!ts) return 'بدون تاريخ'
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return 'قبل لحظات'
  if (s < 3600) return `قبل ${Math.round(s / 60)} دقيقة`
  if (s < 86400) return `قبل ${Math.round(s / 3600)} ساعة`
  const d = Math.round(s / 86400)
  if (d < 30) return `قبل ${d} يوم`
  return new Date(ts).toLocaleDateString('ar', { day: 'numeric', month: 'long' })
}

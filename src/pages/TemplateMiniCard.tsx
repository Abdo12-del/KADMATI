/** Compact template card: the real first slide, rendered live from the template spec. */
import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { SlidePreview } from '../components/SlidePreview'
import { instantiateDeck, CATEGORY_LABEL, type TemplateDef } from '../templates/engine'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { toast } from '../store/useUI'
import { cn } from '../lib/cn'

export function TemplateMiniCard({ template, onOpen, className }: { template: TemplateDef; onOpen?: () => void; className?: string }) {
  const doc = useMemo(() => instantiateDeck(template, { templateId: template.id, category: template.category }), [template])
  const library = useLibrary()

  const use = async () => {
    const record = await library.createProject(doc)
    requestOpenProject({ projectId: record.id })
    toast({ kind: 'success', title: `فُتح ${template.name}`, body: 'قالب كامل العناصر — عدّل أي شيء.' })
  }

  return (
    <article className={cn('group overflow-hidden rounded-xl border border-ink-800 bg-ink-900/60 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-ink-600', className)}>
      <button type="button" onClick={() => (onOpen ? onOpen() : void use())} className="block w-full text-start">
        <SlidePreview doc={doc} index={0} />
      </button>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[13px] font-semibold text-ink-50">{template.name}</h3>
          <p className="mt-0.5 truncate text-[11px] text-ink-500">
            {CATEGORY_LABEL[template.category]} · {template.slides.length} شرائح
          </p>
        </div>
        <button
          type="button"
          onClick={() => void use()}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-ink-700 px-2 py-1 text-[11.5px] text-ink-200 transition-colors hover:border-signal/60 hover:text-white"
        >
          استخدام <ArrowLeft size={12} />
        </button>
      </div>
    </article>
  )
}

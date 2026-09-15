/**
 * EditorRail — the tall icon rail beside the slides panel (per the reference):
 * الرئيسية · القوالب · العناصر · النص · الصور · الأشكال · الرسوم البيانية ·
 * الحركة والمؤثرات · الطبقات · التاريخ, with the AI assistant bubble at the
 * bottom. Every item switches a real panel or store action.
 */
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  History,
  House,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Shapes,
  Sparkles,
  Square,
  Type,
  Wand2,
} from 'lucide-react'
import { useUI } from '../store/useUI'
import { cn } from '../lib/cn'

export function EditorRail() {
  const navigate = useNavigate()
  const leftPanel = useUI((s) => s.leftPanel)
  const setLeftPanel = useUI((s) => s.setLeftPanel)
  const setRightPanel = useUI((s) => s.setRightPanel)
  const animDock = useUI((s) => s.animDock)
  const setAnimDock = useUI((s) => s.setAnimDock)

  const items = [
    { id: 'home', label: 'الرئيسية', icon: House, active: false, run: () => navigate('/app') },
    { id: 'templates', label: 'القوالب', icon: LayoutTemplate, active: leftPanel === 'templates', run: () => setLeftPanel('templates') },
    { id: 'icons', label: 'العناصر', icon: Shapes, active: leftPanel === 'icons', run: () => setLeftPanel('icons') },
    { id: 'text', label: 'النص', icon: Type, active: leftPanel === 'text', run: () => setLeftPanel('text') },
    { id: 'images', label: 'الصور', icon: ImageIcon, active: leftPanel === 'images', run: () => setLeftPanel('images') },
    { id: 'shapes', label: 'الأشكال', icon: Square, active: leftPanel === 'shapes', run: () => setLeftPanel('shapes') },
    { id: 'tables-charts', label: 'الرسوم البيانية', icon: BarChart3, active: leftPanel === 'tables-charts', run: () => setLeftPanel('tables-charts') },
    { id: 'anim', label: 'الحركة والمؤثرات', icon: Wand2, active: animDock, run: () => setAnimDock(!animDock) },
    { id: 'layers', label: 'الطبقات', icon: Layers, active: leftPanel === 'layers', run: () => setLeftPanel('layers') },
    { id: 'history', label: 'التاريخ', icon: History, active: leftPanel === 'history', run: () => setLeftPanel('history') },
  ]

  return (
    <aside className="glass flex h-full w-[64px] shrink-0 flex-col items-center border-e border-ink-800/70 py-2">
      <nav className="flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto no-scrollbar" aria-label="أدوات المحرر">
        {items.map(({ id, label, icon: Icon, active, run }) => (
          <button
            key={id}
            type="button"
            onClick={run}
            title={label}
            aria-pressed={active}
            className={cn(
              'flex w-[56px] flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors',
              active ? 'bg-signal/15 text-signal-soft shadow-[inset_0_0_0_1px_rgba(79,125,255,0.35)]' : 'text-ink-400 hover:bg-ink-850 hover:text-ink-100',
            )}
          >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
            <span className="w-full truncate text-center text-[8.5px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </nav>

      {/* AI assistant bubble */}
      <button
        type="button"
        onClick={() => setRightPanel('ai')}
        title="مساعد الذكاء الاصطناعي"
        className="mt-2 flex w-[56px] flex-col items-center gap-1.5 rounded-xl border border-ai/25 bg-ai-dim/60 px-1.5 py-2.5 text-center transition-colors hover:border-ai/45 hover:bg-ai/15"
      >
        <span className="aur-fill glow-violet grid size-6 place-items-center rounded-lg text-white">
          <Sparkles size={12} />
        </span>
        <span className="text-[8px] font-semibold leading-[1.5] text-[#d5c9ff]">
          مساعد الذكاء الاصطناعي
        </span>
      </button>
    </aside>
  )
}

/**
 * Library / dashboard — the home for a designer's work: sidebar, search, real thumbnails of decks,
 * folders, favorites and trash. No tables, no stat cards pretending to be analytics.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Boxes,
  FolderInput,
  FolderPlus,
  Heart,
  LayoutTemplate,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import { DeckCard } from '../components/DeckCard'
import { SlidePreview } from '../components/SlidePreview'
import { BrandPane } from './BrandPage'
import { ElementsPane } from './ElementsPage'
import { TemplateMiniCard } from './TemplateMiniCard'
import { TEMPLATE_MAP } from '../templates/catalog'
import { Button, Chip, Empty, Field, Modal, Popover, Select, TextField, MenuItem } from '../components/ui'
import { selectVisibleProjects, useLibrary, type SortMode } from '../store/useLibrary'
import { useUI } from '../store/useUI'
import { instantiateDeck } from '../templates/engine'
import { requestOpenProject } from '../services/openDeck'
import { toast } from '../store/useUI'
import { cn } from '../lib/cn'
import { newBlankPresentation } from './newDeck'

/** `key` mirrors useScope() so the active state never depends on reading the global `location`. */
const NAV: { to: string; key: string; label: string; icon: typeof LayoutTemplate }[] = [
  { to: '/app', key: 'home', label: 'الرئيسية', icon: LayoutTemplate },
  { to: '/app/decks', key: 'decks', label: 'عروضك', icon: Boxes },
  { to: '/templates', key: 'templates', label: 'القوالب', icon: Sparkles },
  { to: '/app/brand', key: 'brand', label: 'العلامة التجارية', icon: LayoutTemplate },
  { to: '/app/elements', key: 'elements', label: 'العناصر', icon: Boxes },
  { to: '/app/trash', key: 'trash', label: 'سلة المحذوفات', icon: Trash2 },
]

export function DashboardPage() {
  const scope = useScope()
  const { pathname } = useLocation()
  const library = useLibrary()
  const navigate = useNavigate()
  const search = useLibrary((s) => s.search)
  const setSearch = useLibrary((s) => s.setSearch)

  const sort = useLibrary((s) => s.sort)
  const setSort = useLibrary((s) => s.setSort)
  const ready = useLibrary((s) => s.ready)
  const seeding = useLibrary((s) => s.seeding)
  const projects = useLibrary((s) => s.projects)
  const [profileOpen, setProfileOpen] = useState(false)

  const init = useLibrary((s) => s.init)
  const setScope = useLibrary((s) => s.setScope)
  const setFolderFilter = useLibrary((s) => s.setFolderFilter)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    setScope(scope === 'trash' ? 'trash' : 'all')
    setFolderFilter(null)
  }, [scope, setScope, setFolderFilter])

  const visible = useLibrary(selectVisibleProjects)
  const recent = useMemo(() => visible.slice(0, 8), [visible])
  void search
  const demosMissing = ready && projects.length === 0

  const createProject = useLibrary((s) => s.createProject)
  const startNew = async () => {
    const doc = newBlankPresentation()
    const record = await createProject(doc)
    requestOpenProject({ projectId: record.id })
  }

  return (
    <div className="flex min-h-full bg-ink-950 text-ink-50">
      <aside className="glass sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-e border-ink-800/70 p-3 lg:flex">
        <Link to="/" className="mb-4 flex items-center gap-2.5 px-1">
          <span className="aur-fill glow-blue grid size-7 place-items-center rounded-lg text-[13px] font-black text-white">ك</span>
          <span className="font-display text-[15px] font-semibold tracking-tight">أوروفا</span>
        </Link>
        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.key === 'templates' ? pathname.startsWith('/templates') : item.key === scope
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors',
                  active ? 'bg-ink-800/70 text-white shadow-[0_0_16px_-6px_rgba(79,125,255,0.45)] ring-1 ring-signal/30' : 'text-ink-400 hover:bg-ink-850/70 hover:text-ink-100',
                )}
              >
                <item.icon size={14} className={active ? 'text-signal-soft' : 'text-ink-500'} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <Folders />
        <div className="mt-auto space-y-1 border-t border-ink-800 pt-2.5">
          {library.brandKits.slice(0, 3).map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => navigate('/app/brand')}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11.5px] text-ink-400 transition-colors hover:bg-ink-850 hover:text-ink-100"
            >
              <span className="flex gap-0.5">
                {[kit.colors.primary, kit.colors.secondary, kit.colors.accent, kit.colors.success].map((c: string) => (
                  <i key={c} className="size-2.5 rounded-full" style={{ background: c }} />
                ))}
              </span>
              <span className="truncate">{kit.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass aur-hairline-b sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-ink-800/70 px-4">
          <Link to="/" className="grid size-8 place-items-center rounded-lg border border-ink-800 lg:hidden">
            <span className="text-[12px] font-black text-signal">ك</span>
          </Link>
          <div className="relative max-w-sm flex-1">
            <Search size={14} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في عروضك…"
              className="h-9 w-full rounded-lg border border-ink-700/60 bg-ink-900/50 ps-8 pe-2.5 text-[12.5px] outline-none transition-all placeholder:text-ink-500 focus:border-signal/70 focus:shadow-[0_0_0_3px_rgba(79,125,255,0.12)]"
            />
          </div>
          <Popover
            align="end"
            trigger={(p) => (
              <Button size="sm" variant="subtle" active={p.open} onClick={p.toggle}>
                <ListFilter size={13} /> {SORT_LABEL[sort]}
              </Button>
            )}
          >
            {(close) => (
              <div className="w-44 p-1">
                {(Object.keys(SORT_LABEL) as SortMode[]).map((k) => (
                  <MenuItem key={k} active={sort === k} onClick={() => (setSort(k), close())}>
                    {SORT_LABEL[k]}
                  </MenuItem>
                ))}
              </div>
            )}
          </Popover>
          <Button size="sm" variant="subtle" onClick={() => useUI.getState().openDialog('new-presentation')}>
            <LayoutTemplate size={13} /> من قالب
          </Button>
          <Button size="sm" variant="primary" onClick={() => void startNew()}>
            <Plus size={14} /> جديد
          </Button>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="grid size-8 place-items-center rounded-full border border-ink-700 bg-ink-900 text-[11px] font-bold text-ink-200 transition-colors hover:border-ink-500"
            title="ملفك"
          >
            <ProfileMark />
          </button>
          <span className="hidden xl:block" />
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {seeding ? (
            <p className="mb-4 text-[12.5px] text-ink-400">تُجهَّز العروض التجريبية الحقيقية لأول مرة…</p>
          ) : null}
          {demosMissing && !seeding ? (
            <div className="glass mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="text-[13.5px] font-semibold">لا عروض بعد</p>
                <p className="mt-1 text-[12px] text-ink-400">أضف أربعة عروض تجريبية حقيقية (٣٤ شريحة بمحتوى عربي وإنجليزي قابل للتحرير) أو ابدأ من الصفر.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="surface"
                  onClick={async () => {
                    const n = await library.seedDemos(true)
                    toast({ kind: 'success', title: `أُضيفت ${n} عروض تجريبية` })
                  }}
                >
                  إضافة العروض التجريبية
                </Button>
                <Button size="sm" variant="primary" onClick={() => useUI.getState().openDialog('new-presentation')}>
                  عرض جديد
                </Button>
              </div>
            </div>
          ) : null}

          {scope === 'trash' ? <TrashPane /> : null}
          {scope === 'decks' ? <DecksPane recent={false} /> : null}
          {scope === 'brand' ? <BrandPane /> : null}
          {scope === 'elements' ? <ElementsPane /> : null}
          {scope === 'home' ? (
            <>
              <Greeting />
              {recent.length ? (
                <section className="mt-6">
                  <SectionHead title="آخر ما عملت عليه" action={<Link to="/app/decks" className="text-[12px] text-ink-400 hover:text-white">عرض الكل ←</Link>} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {recent.map((record) => (
                      <DeckCard key={record.id} record={record} />
                    ))}
                  </div>
                </section>
              ) : null}
              <QuickStart />
              <TemplatesStrip />
            </>
          ) : null}
        </main>
      </div>

      {profileOpen ? <ProfileModal onClose={() => setProfileOpen(false)} /> : null}
    </div>
  )
}

function useScope(): 'home' | 'decks' | 'brand' | 'elements' | 'trash' {
  const { scope } = useParams<{ scope?: string }>()
  const s = (scope ?? 'home') as 'home' | 'decks' | 'brand' | 'elements' | 'trash'
  return ['home', 'decks', 'brand', 'elements', 'trash'].includes(s) ? s : 'home'
}

const SORT_LABEL: Record<SortMode, string> = {
  recent: 'الأحدث',
  name: 'الاسم',
  slides: 'عدد الشرائح',
}

function ProfileMark() {
  const profile = useUI((s) => s.profile)
  if (profile?.name) return <>{profile.name.trim().slice(0, 1)}</>
  return <User size={13} />
}

function ProfileModal({ onClose }: { onClose: () => void }) {
  const profile = useUI((s) => s.profile)
  const setProfile = useUI((s) => s.setProfile)
  const [name, setName] = useState(profile?.name ?? '')
  const [role, setRole] = useState(profile?.role ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  return (
    <Modal
      open
      onClose={onClose}
      title="ملفك المحلي"
      width={460}
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={() => (setProfile(null), onClose())}>
            مسح
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setProfile({ name: name.trim() || 'مستخدم أوروفا', role: role.trim(), email: email.trim() })
              onClose()
              toast({ kind: 'success', title: 'حُفظ الملف', body: 'يظهر في بيانات PPTX وفي التحيّة.' })
            }}
          >
            حفظ
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-[12px] leading-relaxed text-ink-400">
        الحسابات والمزامنة السحابية لم تُبنَ بعد (المرحلة ٧)، لذلك لا يوجد تسجيل دخول — هذا الملف يبقى في متصفحك ويُستخدم للتحيّة وبيانات الملف.
      </p>
      <div className="space-y-2.5">
        <Field label="الاسم">
          <TextField value={name} onChange={setName} />
        </Field>
        <Field label="الدور">
          <TextField value={role} onChange={setRole} placeholder="مصمّم عروض · مدير منتج · محاضر" />
        </Field>
        <Field label="البريد">
          <TextField value={email} onChange={setEmail} />
        </Field>
      </div>
    </Modal>
  )
}

function Greeting() {
  const profile = useUI((s) => s.profile)
  const hour = new Date().getHours()
  const part = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'سهرة موفّقة'
  const projects = useLibrary((s) => s.projects.filter((p) => !p.trashedAt))
  const decks = projects.length
  const slides = projects.reduce((n, p) => n + p.doc.slides.length, 0)
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[clamp(1.3rem,2.6vw,1.9rem)] font-semibold tracking-tight text-white">
          {part}
          {profile?.name ? <span className="aur-text">، {profile.name.split(' ')[0]}</span> : ''}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-400">
          {decks} عرض {decks ? `· ${slides} شريحة` : '— ابدأ أول عرض الآن'} · كل شيء محفوظ في هذا الجهاز
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          className="w-40"
          value="local"
          onChange={() => toast({ kind: 'info', title: 'التخزين محلي', body: 'المزامنة السحابية في المرحلة ٧ — عملك محفوظ في IndexedDB الآن.' })}
          options={[{ value: 'local', label: 'هذا الجهاز' }]}
        />
      </div>
    </div>
  )
}

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[14px] font-semibold tracking-tight text-ink-100">{title}</h2>
      {action}
    </div>
  )
}

function DecksPane({ recent }: { recent: boolean }) {
  const library = useLibrary()
  void recent
  const visible = useLibrary(selectVisibleProjects)
  const list = recent ? visible.slice(0, 8) : visible
  const favorite = useLibrary((s) => s.scope === 'favorite')
  return (
    <section>
      <SectionHead
        title={favorite ? 'المفضلة' : 'كل العروض'}
        action={
          <div className="flex items-center gap-1.5">
            <Chip active={favorite} onClick={() => library.setScope(favorite ? 'all' : 'favorite')}>
              <Heart size={11} className="inline" /> المفضلة
            </Chip>
            {library.folders.length ? (
              <div className="flex items-center gap-1">
                <Chip active={!library.folderFilter} onClick={() => library.setFolderFilter(null)}>
                  الكل
                </Chip>
                {library.folders.map((f) => (
                  <Chip key={f.id} active={library.folderFilter === f.id} onClick={() => library.setFolderFilter(library.folderFilter === f.id ? null : f.id)}>
                    {f.name}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        }
      />
      {list.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((record) => (
            <DeckCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <Empty
          title="لا عروض في هذا العرض"
          body="غيّر البحث أو المجلد، أو أنشئ عرضًا جديدًا."
          action={
            <Button size="sm" variant="primary" onClick={() => useUI.getState().openDialog('new-presentation')}>
              عرض جديد
            </Button>
          }
        />
      )}
    </section>
  )
}

function TrashPane() {
  const library = useLibrary()
  const trashedProjects = useLibrary((s) => s.projects)
  void trashedProjects
  const trashed = useLibrary((s) => s.projects.filter((p) => p.trashedAt))
  return (
    <section>
      <SectionHead
        title={`سلة المحذوفات (${trashed.length})`}
        action={
          trashed.length ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                void library.emptyTrash()
                toast({ kind: 'success', title: 'أُفرغت السلة' })
              }}
            >
              إفراغ السلة
            </Button>
          ) : null
        }
      />
      {trashed.length ? (
        <div className="mt-3 space-y-2">
          {trashed.map((record) => (
            <div key={record.id} className="glass-soft flex items-center gap-3 rounded-xl border p-2.5">
              <div className="w-28 shrink-0 overflow-hidden rounded-lg border border-ink-800">
                <DeckThumbSmall doc={record.doc} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink-100">{record.doc.metadata.title}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-500">
                  {record.doc.slides.length} شريحة · حُذف {new Date(record.trashedAt ?? Date.now()).toLocaleDateString('ar', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="surface" onClick={() => void library.restoreProject(record.id)}>
                  <RotateCcw size={12} /> استعادة
                </Button>
                <Button size="sm" variant="danger" onClick={() => void library.destroyProject(record.id)}>
                  حذف نهائي
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="السلة فارغة" body="ما تحذفه من المكتبة يصل هنا أولًا حتى تحذفه نهائيًا." />
      )}
    </section>
  )
}

function DeckThumbSmall({ doc }: { doc: import('../document/types').Presentation }) {
  return <SlidePreview doc={doc} index={0} />
}

function QuickStart() {
  const library = useLibrary()
  const navigate = useNavigate()
  const items = [
    { label: 'عرض فارغ', hint: '١٢٨٠×٧٢٠ · كل الأدوات', run: () => useUI.getState().openDialog('new-presentation') },
    { label: 'من قالب', hint: '١٢ قالبًا عربيًا حقيقيًا', run: () => navigate('/templates') },
    {
      label: 'استيراد PPTX',
      hint: 'نص وصور وأشكال وجداول ومخططات',
      run: () => useUI.getState().openDialog('import'),
    },
    {
      label: 'تحليل PDF',
      hint: 'من المستند إلى عرض قابل للتعديل',
      run: () => navigate('/pdf'),
    },
    {
      label: 'توليد بالذكاء',
      hint: 'هيكل + محتوى قابل للتحرير',
      run: async () => {
        const { generateDeck } = await import('../services/ai/generate')
        const { spec } = await generateDeck('عرض عن كيف يغيّر الذكاء الاصطناعي طريقة عمل الفرق خلال سنة واحدة', { slides: 8, category: 'business' })
        const doc = instantiateDeck(spec)
        const record = await library.createProject(doc)
        requestOpenProject({ projectId: record.id })
      },
    },
  ]
  return (
    <section className="mt-9">
      <SectionHead title="تبدأ من هنا" />
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => void item.run()}
            className="group glass rounded-xl border p-3.5 text-start transition-all hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-aurora"
          >
            <span className="block text-[13.5px] font-semibold text-ink-50">{item.label}</span>
            <span className="mt-1 block text-[11.5px] text-ink-500">{item.hint}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function TemplatesStrip() {
  const navigate = useNavigate()
  const templates = useMemo(() => [...TEMPLATE_MAP.values()].slice(0, 6), [])
  void navigate
  return (
    <section className="mt-9">
      <SectionHead title="قوالب مقترحة" action={<Link to="/templates" className="text-[12px] text-ink-400 hover:text-white">كل القوالب ←</Link>} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <TemplateMiniCard key={t.id} template={t} onOpen={() => navigate(`/templates?focus=${t.id}`)} />
        ))}
      </div>
    </section>
  )
}

function FolderRow({ folder, count, active }: { folder: { id: string; name: string }; count: number; active: boolean }) {
  const library = useLibrary()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(folder.name)
  return (
    <div className={cn('group/flex group flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors', active ? 'bg-ink-850 text-ink-100' : 'text-ink-400 hover:bg-ink-850')}>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-start" onClick={() => library.setFolderFilter(active ? null : folder.id)} title="اضغط للفلترة">
        <FolderInput size={12} />
        <span className="truncate">{folder.name}</span>
        <span className="ms-auto text-[10.5px] text-ink-500">{count}</span>
      </button>
      <Popover
        align="end"
        trigger={(p) => (
          <button
            type="button"
            onClick={p.toggle}
            className="rounded p-0.5 text-ink-500 transition-colors hover:text-ink-100"
            title="خيارات المجلد"
            aria-label="خيارات المجلد"
          >
            <MoreVertical size={12} />
          </button>
        )}
      >
        {(close) => (
          <div className="w-40 p-1">
            <MenuItem icon={<Pencil size={12} />} onClick={() => { close(); setName(folder.name); setRenaming(true) }}>
              إعادة تسمية
            </MenuItem>
            <MenuItem
              danger
              icon={<Trash2 size={12} />}
              onClick={() => {
                close()
                void library.removeFolder(folder.id)
                if (active) library.setFolderFilter(null)
                toast({ kind: 'info', title: 'حُذف المجلد', body: 'العروض بداخله بقيت في «عروضك» بلا مجلد.' })
              }}
            >
              حذف المجلد
            </MenuItem>
          </div>
        )}
      </Popover>
      {renaming ? (
        <Modal open onClose={() => setRenaming(false)} title="إعادة تسمية المجلد" width={420}>
          <Field label="الاسم">
            <TextField value={name} onChange={setName} />
          </Field>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenaming(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (name.trim()) void library.renameFolder(folder.id, name.trim())
                setRenaming(false)
              }}
            >
              حفظ
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function Folders() {
  const library = useLibrary()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const selected = useLibrary((s) => s.folderFilter)
  const projects = useLibrary((s) => s.projects.filter((p) => !p.trashedAt))
  return (
    <div className="mt-4">
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">المجلدات</span>
        <button type="button" onClick={() => setOpen(true)} className="rounded p-0.5 text-ink-500 hover:bg-ink-850 hover:text-ink-100" title="مجلد جديد">
          <FolderPlus size={13} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => library.setFolderFilter(null)}
        className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors', !selected ? 'bg-ink-850 text-ink-100' : 'text-ink-400 hover:bg-ink-850')}
      >
        الكل <span className="ms-auto text-[10.5px] text-ink-500">{projects.length}</span>
      </button>
      {library.folders.map((folder) => (
        <FolderRow key={folder.id} folder={folder} count={projects.filter((p) => p.folderId === folder.id).length} active={selected === folder.id} />
      ))}
      {open ? (
        <Modal open onClose={() => setOpen(false)} title="مجلد جديد" width={420}>
          <Field label="الاسم">
            <TextField value={name} onChange={setName} placeholder="عملاء ٢٠٢٦" />
          </Field>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim()) return
                void library.addFolder(name.trim())
                setName('')
                setOpen(false)
                toast({ kind: 'success', title: 'أُنشئ المجلد' })
              }}
            >
              إنشاء
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

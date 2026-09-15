/**
 * Landing — Arabic-first marketing page for a creative studio, not a SaaS template.
 * Visual direction: deep-navy aurora — soft light fields, glass surfaces, one gradient
 * language (blue → violet → cyan) used with restraint. The hero preview is the *real*
 * renderer playing a real demo deck: nothing here is a screenshot.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Boxes, FileSpreadsheet, Gauge, Layers, Play, ShieldCheck, Sparkles, Type, Wand2 } from 'lucide-react'
import { SlidePreview } from '../components/SlidePreview'
import { DEMO_DECKS } from '../demo/decks'
import { instantiateDeck, CATEGORY_LABEL, type TemplateCategory } from '../templates/engine'
import { TEMPLATE_CATEGORIES, TEMPLATE_MAP } from '../templates/catalog'
import { useLibrary } from '../store/useLibrary'
import { requestOpenProject } from '../services/openDeck'
import { useUI } from '../store/useUI'
import { cn } from '../lib/cn'
import { Button } from '../components/ui'

export function LandingPage() {
  const navigate = useNavigate()
  const library = useLibrary()
  const [started, setStarted] = useState(false)

  const start = async () => {
    if (started) return
    setStarted(true)
    await library.init()
    const created = await library.createProject()
    requestOpenProject({ projectId: created.id })
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-ink-950 text-ink-50">
      <LandingNav onStart={() => void start()} />
      <Hero onStart={() => void start()} onTemplates={() => navigate('/templates')} />
      <LiveDeckSection />
      <Categories onPick={(cat) => navigate(`/templates?cat=${cat}`)} />
      <Capabilities />
      <Pipeline />
      <Closing onStart={() => void start()} />
      <footer className="aur-hairline-t border-t border-ink-800/60 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-[12px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-display font-semibold text-ink-200">KADMATI</span> — صمَّم، صدِّر، اعرض. كل شيء يعمل داخل متصفحك.
          </p>
          <p className="flex flex-wrap items-center gap-3">
            <span>مفتوح المصدر · MIT</span>
            <span className="text-ink-700">|</span>
            <Link to="/app" className="text-ink-300 underline-offset-4 hover:text-white hover:underline">
              المكتبة المحلية
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

/** Local aurora field for the hero — stronger than the ambient body layer. */
function AuroraField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -top-[35%] end-[-12%] size-[640px] rounded-full opacity-70"
        style={{ background: 'radial-gradient(closest-side, rgba(79,125,255,0.22), transparent 70%)', animation: 'aur-drift-a 40s ease-in-out infinite' }}
      />
      <div
        className="absolute top-[10%] start-[-14%] size-[560px] rounded-full opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgba(139,92,246,0.2), transparent 70%)', animation: 'aur-drift-b 52s ease-in-out infinite' }}
      />
      <div
        className="absolute -bottom-[30%] left-[28%] size-[600px] rounded-full opacity-50"
        style={{ background: 'radial-gradient(closest-side, rgba(47,212,246,0.14), transparent 70%)', animation: 'aur-drift-a 60s ease-in-out infinite reverse' }}
      />
      {/* aurora curtain — a wide, soft diagonal light band */}
      <div
        className="absolute -top-[18%] left-[8%] h-[70%] w-[86%] opacity-[0.16]"
        style={{
          background: 'linear-gradient(112deg, transparent 8%, rgba(79,125,255,0.5) 30%, rgba(139,92,246,0.5) 52%, rgba(47,212,246,0.42) 70%, transparent 92%)',
          filter: 'blur(70px)',
          transform: 'rotate(-9deg)',
          animation: 'aur-sheen 14s ease-in-out infinite',
        }}
      />
    </div>
  )
}

function LandingNav({ onStart }: { onStart: () => void }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={cn('sticky top-0 z-30 transition-colors duration-300', solid ? 'aur-hairline-b glass border-b' : 'border-b border-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="aur-fill glow-blue grid size-7 place-items-center rounded-lg text-[13px] font-black text-white">ك</span>
          <span className="font-display text-[16px] font-semibold tracking-tight">KADMATI</span>
        </Link>
        <nav className="hidden items-center gap-5 text-[13px] text-ink-300 md:flex">
          <a href="#live" className="transition-colors hover:text-white">
            معاينة حيّة
          </a>
          <Link to="/templates" className="transition-colors hover:text-white">
            القوالب
          </Link>
          <a href="#capabilities" className="transition-colors hover:text-white">
            القدرات
          </a>
          <a href="#pipeline" className="transition-colors hover:text-white">
            التصدير
          </a>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Link to="/app" className="hidden text-[13px] text-ink-300 transition-colors hover:text-white sm:inline">
            مكتبتك
          </Link>
          <Button size="sm" variant="primary" onClick={onStart}>
            ابدأ الآن
          </Button>
        </div>
      </div>
    </header>
  )
}

function Hero({ onStart, onTemplates }: { onStart: () => void; onTemplates: () => void }) {
  return (
    <section className="relative">
      <AuroraField />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pt-14 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-100/10 bg-ink-900/50 px-3 py-1 text-[11.5px] text-ink-300 backdrop-blur-md">
            <Sparkles size={12} className="text-aur-violet" />
            استوديو عروض بالعربية أولًا · يصدّر PPTX قابلًا للتحرير
          </p>
          <h1 className="font-display text-[clamp(2.1rem,5.2vw,3.5rem)] leading-[1.16] font-bold tracking-tight text-white">
            صمّم عروضًا تقديمية
            <br />
            <span className="aur-text">تستحق أن تُعرض.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.95] text-ink-300">
            محرر حقيقي بالطبقات والمحاذاة الذكية، قوالب مبنية من سمات وتخطيطات لا صور، ذكاء اصطناعي يكتب الهيكل داخل العناصر، وتحرّك وتايملاين كاستوديو — وتصدير إلى PowerPoint تحتفظ فيه بكل نص وجدول ومخطط قابلًا للتعديل.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button size="lg" variant="primary" onClick={onStart}>
              ابدأ تصميمًا جديدًا <ArrowLeft size={15} className="rotate-180 rtl:rotate-0" />
            </Button>
            <Button size="lg" variant="outline" onClick={onTemplates}>
              استكشف القوالب
            </Button>
          </div>
          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-100/8 pt-5 text-[12px]">
            {[
              ['٣٤ شريحة تجريبية', 'محتوى حقيقي لا Lorem Ipsum'],
              ['٦٠ عنصرًا بلا بطء', 'تحرّك ومحاذاة فورية'],
              ['٠ رفع للصور', 'التصدير يحدث في متصفحك'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-display text-[15px] font-semibold text-white">{k}</dt>
                <dd className="mt-1 leading-relaxed text-ink-500">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroPreview />
      </div>
    </section>
  )
}

/** The deck preview is the same component the editor paints — 3 real slides, auto-advancing. */
function HeroPreview() {
  const doc = useMemo(() => instantiateDeck(DEMO_DECKS[0]), [])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % Math.min(3, doc.slides.length)), 3400)
    return () => window.clearInterval(id)
  }, [paused, doc.slides.length])

  return (
    <div className="relative">
      {/* gradient ring: a 1px aurora border wrapping the glass frame */}
      <div className="rounded-[22px] p-px" style={{ background: 'linear-gradient(135deg, rgba(79,125,255,0.55), rgba(139,92,246,0.4) 45%, rgba(47,212,246,0.45) 80%, rgba(79,125,255,0.25))' }}>
        <div
          className="overflow-hidden rounded-[21px] bg-paper shadow-[0_50px_140px_-40px_rgba(20,40,120,0.55)] glow-aur"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50/85 px-3 py-2">
            <span className="size-2 rounded-full bg-aur-blue/80" />
            <span className="size-2 rounded-full bg-aur-violet/70" />
            <span className="size-2 rounded-full bg-aur-cyan/80" />
            <span className="ms-auto font-mono text-[10px] text-ink-400">{doc.metadata.title}</span>
          </div>
          <div className="relative">
            <SlidePreview doc={doc} index={index} />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2">
              <div className="flex gap-1">
                {Array.from({ length: Math.min(3, doc.slides.length) }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`شريحة ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={cn('h-1 rounded-full transition-all', i === index ? 'w-6' : 'w-3 bg-ink-300/70 hover:bg-ink-400')}
                    style={i === index ? { background: 'var(--grad-aurora)' } : undefined}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] text-ink-500">
                {index + 1} / {Math.min(3, doc.slides.length)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => requestOpenProject({ doc })}
        className="glass absolute -bottom-4 start-6 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] text-ink-100 shadow-float transition-colors hover:border-signal/60"
      >
        <Play size={11} className="text-signal-soft" /> جرّب هذا العرض في المحرر
      </button>
    </div>
  )
}

function LiveDeckSection() {
  const doc = useMemo(() => instantiateDeck(DEMO_DECKS[2] ?? DEMO_DECKS[0]), [])
  const [i, setI] = useState(0)
  const slides = doc.slides.slice(0, 6)
  return (
    <section id="live" className="border-y border-ink-800/50 bg-ink-900/30 py-14 backdrop-blur-[2px]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[clamp(1.4rem,2.6vw,2rem)] font-semibold tracking-tight">
              ابدأ بفكرة، <span className="aur-text">لا بشريحة فارغة</span>
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-[1.95] text-ink-400">
              اكتب موضوعًا، فيُبنى الهيكل ثم المحتوى ثم نظام التصميم ثم العناصر القابلة للتحرير. هذه عيّنة من عرض وُلّد بهذا المسار — اضغط أي شريحة لتنقل بينها.
            </p>
          </div>
          <Button variant="subtle" size="sm" onClick={() => setI((v) => (v + 1) % slides.length)}>
            الشريحة التالية
          </Button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-ink-100/10 bg-paper shadow-panel">
          <SlidePreview doc={doc} index={i} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setI(idx)}
              className={cn(
                'overflow-hidden rounded-lg border transition-all',
                idx === i ? 'border-signal/80 glow-blue' : 'border-ink-800/70 hover:border-ink-500',
              )}
            >
              <SlidePreview doc={doc} index={doc.slides.indexOf(s)} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Categories({ onPick }: { onPick: (cat: TemplateCategory) => void }) {
  const counts = useMemo(() => {
    const map = new Map<TemplateCategory, number>()
    for (const t of TEMPLATE_MAP.values()) map.set(t.category, (map.get(t.category) ?? 0) + 1)
    return map
  }, [])
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <h2 className="font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold tracking-tight">قوالب لكل نوع عرض تعمل عليه</h2>
      <p className="mt-2 text-[13.5px] leading-[1.9] text-ink-400">
        القالب عندنا ليس خلفية جميلة: سمة، خطوط، لوحة ألوان، تخطيطات ومكوّنات — كلها قابلة للتحرير بعد الاستخدام.
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onPick(cat)}
            className="group flex items-center gap-3 rounded-xl border border-ink-100/8 bg-ink-900/40 p-3.5 text-start backdrop-blur-md transition-all hover:border-signal/40 hover:bg-ink-900/70 hover:shadow-[0_0_28px_-10px_rgba(79,125,255,0.5)]"
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-[0_4px_16px_-4px_rgba(79,125,255,0.5)]"
              style={{ background: CATEGORY_GRADIENT[cat] ?? 'var(--grad-aurora)' }}
            >
              {CATEGORY_ICON[cat] ?? <Boxes size={15} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-ink-50">{CATEGORY_LABEL[cat]}</span>
              <span className="mt-0.5 block text-[11.5px] text-ink-500">{counts.get(cat) ?? 0} قوالب جاهزة</span>
            </span>
            <ArrowLeft size={14} className="text-ink-600 transition-transform group-hover:-translate-x-0.5 group-hover:text-signal-soft" />
          </button>
        ))}
      </div>
    </section>
  )
}

const CATEGORY_ICON: Partial<Record<TemplateCategory, React.ReactNode>> = {
  business: <FileSpreadsheet size={15} />,
  education: <Type size={15} />,
  pitch: <Wand2 size={15} />,
  marketing: <Layers size={15} />,
  report: <Gauge size={15} />,
}

/** Each category owns a slice of the aurora spectrum. */
const CATEGORY_GRADIENT: Partial<Record<TemplateCategory, string>> = {
  business: 'linear-gradient(135deg, #4f7dff, #2f6ae8)',
  education: 'linear-gradient(135deg, #2fd4f6, #38b6e8)',
  pitch: 'linear-gradient(135deg, #8b5cf6, #6d4ae0)',
  marketing: 'linear-gradient(135deg, #e879f9, #c45ce0)',
  report: 'linear-gradient(135deg, #4f7dff, #8b5cf6)',
}

function Capabilities() {
  const items: { icon: React.ReactNode; title: string; body: string }[] = [
    {
      icon: <Layers size={16} />,
      title: 'محرر بالعناصر والطبقات',
      body: 'تحديد متعدد، دليل محاذاة ذكية، توزيع متساوٍ، تجميع وأطر تقصّ المحتوى، ولوحة طبقات بقفل وإخفاء وإعادة ترتيب.',
    },
    {
      icon: <Type size={16} />,
      title: 'نص بالعربية كما يجب',
      body: 'RTL/LTR لكل عنصر، أرقام هندية أو لاتينية، تباعد أسطر وحروف، قوائم، روابط، تظليل، ومحاذاة رأسية — بلا كسر للتشكيل.',
    },
    {
      icon: <FileSpreadsheet size={16} />,
      title: 'PPTX قابل للتحرير فعلًا',
      body: 'نصوص في مربعات نص، أشكال أصلية، جداول ومخططات بمصدر بياناتها، وملاحظات المتحدث. نُصعّر عنصرًا إلى صورة فقط عند الضرورة ونخبرك به.',
    },
    {
      icon: <Sparkles size={16} />,
      title: 'حركة وتايملاين',
      body: 'Keyframes وEasing وMotion Paths على مستوى البيانات: Fade, Slide, Zoom, Typewriter… وقابلة للتصدير والحفظ.',
    },
    {
      icon: <ShieldCheck size={16} />,
      title: 'محلي وآمن',
      body: 'عروضك في IndexedDB على جهازك، والحفظ التلقائي يعمل بلا اتصال. لا خادم ولا حساب لتبدأ.',
    },
    {
      icon: <Gauge size={16} />,
      title: 'سريع مع ٥٠ شريحة',
      body: 'تصيير مُذكّر، شرائح مُتوهّجة في القائمة الجانبية، وتحرير لا يُعيد رسم العرض كله في كل ضغطة.',
    },
  ]
  return (
    <section id="capabilities" className="border-t border-ink-800/50 bg-ink-900/25 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold tracking-tight">
          أدوات استوديو، <span className="aur-text">لا نموذج إدخال بيانات</span>
        </h2>
        <div className="mt-6 grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="group rounded-xl border border-ink-100/8 bg-ink-900/40 p-4 backdrop-blur-md transition-all hover:border-signal/35 hover:shadow-[0_0_30px_-12px_rgba(79,125,255,0.55)]"
            >
              <span
                className="mb-3 grid size-8 place-items-center rounded-lg text-white transition-transform group-hover:scale-105"
                style={{ background: 'var(--grad-aurora)', opacity: 0.92, filter: i % 2 ? 'hue-rotate(38deg)' : undefined }}
              >
                {item.icon}
              </span>
              <h3 className="text-[14px] font-semibold text-ink-50">{item.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-[1.9] text-ink-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pipeline() {
  const steps = [
    { n: '١', title: 'الهيكل', body: 'الفكرة تتحول إلى خيط عرض: افتتاحية، مشكلة، دليل، خاتمة.' },
    { n: '٢', title: 'تخطيط كل شريحة', body: 'نختر التخطيط المناسب للمحتوى (إحصاءات، مقارنة، مسار، اقتباس…).' },
    { n: '٣', title: 'المحتوى', body: 'نصوص حقيقية داخل عناصر نص — لا صور مشطوفة.' },
    { n: '٤', title: 'نظام التصميم', body: 'سمة، خطوط، ألوان، استدارة وهوامش تُطبَّق على العرض كله.' },
    { n: '٥', title: 'أنت تُحرّر', body: 'كل عنصر قابل للتحريك والمحاذاة والتنسيق والتصدير.' },
  ]
  return (
    <section id="pipeline" className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-3 py-1 text-[11.5px] text-[#d5c9ff]">
            <Sparkles size={12} /> كيف يعمل التوليد
          </p>
          <h2 className="font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-snug font-semibold tracking-tight">
            لا نولّد شرائح مصوّرة.
            <br />
            <span className="aur-text">نولّد مستندًا.</span>
          </h2>
          <p className="mt-3 text-[13.5px] leading-[1.95] text-ink-400">
            المخرج شريحة بمحتواها داخل عناصر حقيقية: عنوان في عنصر نص، أرقام في عنصر إحصاء، جدول في عنصر جدول. يمكنك تغيير كل شيء بعد التوليد، والتصدير يبقى نظيفًا.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="subtle" size="sm" onClick={() => useUI.getState().openDialog('ai-settings')}>
              إعدادات الذكاء
            </Button>
            <Button variant="ghost" size="sm" onClick={() => useUI.getState().openDialog('new-presentation')}>
              جرّب التوليد الآن
            </Button>
          </div>
        </div>
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-3.5 rounded-xl border border-ink-100/8 bg-ink-900/40 p-3.5 backdrop-blur-md transition-colors hover:border-ink-100/15">
              <span className="aur-fill grid size-7 shrink-0 place-items-center rounded-lg font-display text-[12px] font-bold text-white">{s.n}</span>
              <span>
                <span className="block text-[13.5px] font-semibold text-ink-50">{s.title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-[1.85] text-ink-400">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Closing({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative overflow-hidden border-t border-ink-800/50 px-6 py-20">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: 'radial-gradient(52% 60% at 50% 100%, rgba(79,125,255,0.16), transparent 70%), radial-gradient(40% 50% at 78% 90%, rgba(139,92,246,0.12), transparent 70%)' }}
      />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
        <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.3rem)] leading-snug font-semibold tracking-tight">
          العرض القادم قد يكون <span className="aur-text">أفضل نسخة منك.</span>
        </h2>
        <p className="max-w-xl text-[13.5px] leading-[1.95] text-ink-400">
          افتح المحرر الآن، أو ابدأ من قالب، أو استورد عرضك القديم بـ PPTX وحرّره عندنا. لا حساب، لا بطاقة، ولا انتظار.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          <Button size="lg" variant="primary" onClick={onStart}>
            ابدأ تصميمًا جديدًا
          </Button>
          <Link to="/templates">
            <Button size="lg" variant="outline">
              تصفّح ١٢ قالبًا
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

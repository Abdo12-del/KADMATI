/**
 * Landing — Arabic-first marketing page for a creative tool, not a SaaS template.
 * The hero preview is the *real renderer* playing a real demo deck: nothing here is a screenshot,
 * and every CTA goes somewhere that exists.
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
      <footer className="border-t border-ink-800/70 px-6 py-8">
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

function LandingNav({ onStart }: { onStart: () => void }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={cn('sticky top-0 z-30 transition-colors duration-300', solid ? 'border-b border-ink-800/80 bg-ink-950/85 backdrop-blur-xl' : 'border-b border-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-signal text-[13px] font-black text-white">ك</span>
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 end-[-10%] size-[520px] rounded-full bg-signal/12 blur-[120px]" />
        <div className="absolute -bottom-32 start-[-8%] size-[420px] rounded-full bg-ai/10 blur-[130px]" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 pt-14 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/70 px-3 py-1 text-[11.5px] text-ink-300">
            <Sparkles size={12} className="text-ai" />
            مولّد بالعربية أولًا · يصدّر PPTX قابلًا للتحرير
          </p>
          <h1 className="font-display text-[clamp(2.1rem,5.2vw,3.5rem)] leading-[1.16] font-bold tracking-tight text-white">
            صمّم عروضًا تقديمية
            <br />
            تستحق أن تُعرض.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-[1.95] text-ink-300">
            محرر حقيقي بالطبقات والمحاذاة الذكية، قوالب مبنية من سمات وتخطيطات لا صور، ذكاء اصطناعي يكتب الهيكل داخل العناصر، وتصدير إلى PowerPoint تحتفظ فيه بكل نص وجدول ومخطط قابلًا للتعديل.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            <Button size="lg" variant="primary" onClick={onStart}>
              ابدأ تصميمًا جديدًا <ArrowLeft size={15} className="rotate-180 rtl:rotate-0" />
            </Button>
            <Button size="lg" variant="outline" onClick={onTemplates}>
              استكشف القوالب
            </Button>
          </div>
          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-800 pt-5 text-[12px]">
            {[
              ['٣٤ شريحة تجريبية', 'محتوى حقيقي لا Lorem Ipsum'],
              ['٦٠ عنصرًا بلا بطء', 'تذكرين ومحاذاة فورية'],
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
      <div
        className="overflow-hidden rounded-2xl border border-ink-700/80 bg-paper shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50/80 px-3 py-2">
          <span className="size-2 rounded-full bg-signal/70" />
          <span className="size-2 rounded-full bg-ink-300" />
          <span className="size-2 rounded-full bg-ink-300" />
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
                  className={cn('h-1 rounded-full transition-all', i === index ? 'w-6 bg-signal' : 'w-3 bg-ink-300/70 hover:bg-ink-400')}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-ink-500">{index + 1} / {Math.min(3, doc.slides.length)}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => requestOpenProject({ doc })}
        className="absolute -bottom-4 start-6 flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-[11.5px] text-ink-100 shadow-float transition-colors hover:border-signal/60"
      >
        <Play size={11} className="text-signal" /> جرّب هذا العرض في المحرر
      </button>
    </div>
  )
}

function LiveDeckSection() {
  const doc = useMemo(() => instantiateDeck(DEMO_DECKS[2] ?? DEMO_DECKS[0]), [])
  const [i, setI] = useState(0)
  const slides = doc.slides.slice(0, 6)
  return (
    <section id="live" className="border-y border-ink-800/70 bg-ink-900/40 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[clamp(1.4rem,2.6vw,2rem)] font-semibold tracking-tight">ابدأ بفكرة، لا بشريحة فارغة</h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-[1.95] text-ink-400">
              اكتب موضوعًا، فيُبنى الهيكل ثم المحتوى ثم نظام التصميم ثم العناصر القابلة للتحرير. هذه عيّنة من عرض وُلّد بهذا المسار — اضغط أي شريحة لتنقل بينها.
            </p>
          </div>
          <Button variant="subtle" size="sm" onClick={() => setI((v) => (v + 1) % slides.length)}>
            الشريحة التالية
          </Button>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-ink-800 bg-paper">
          <SlidePreview doc={doc} index={i} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {slides.map((s, idx) => (
            <button key={s.id} type="button" onClick={() => setI(idx)} className={cn('overflow-hidden rounded-lg border transition-colors', idx === i ? 'border-signal' : 'border-ink-800 hover:border-ink-600')}>
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
            className="group flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/60 p-3.5 text-start transition-[border-color,background] hover:border-ink-600 hover:bg-ink-900"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-850 text-signal ring-1 ring-ink-700/60 transition-colors group-hover:bg-signal/12">
              {CATEGORY_ICON[cat] ?? <Boxes size={15} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-ink-50">{CATEGORY_LABEL[cat]}</span>
              <span className="mt-0.5 block text-[11.5px] text-ink-500">{counts.get(cat) ?? 0} قوالب جاهزة</span>
            </span>
            <ArrowLeft size={14} className="text-ink-600 transition-transform group-hover:-translate-x-0.5 group-hover:text-ink-200" />
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
      icon: <Wand2 size={16} />,
      title: 'ذكاء داخل مساحة التصميم',
      body: 'حسّن صياغة عنصر، اختصر، اقترح عنوانًا، وازن شريحة، أو راجع العرض كاملًا: تباين، طول نصوص، تسلسل هرمي، واتساق.',
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
    <section id="capabilities" className="border-t border-ink-800/70 bg-ink-900/30 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-display text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold tracking-tight">أدوات مصمّم، لا نموذج إدخال بيانات</h2>
        <div className="mt-6 grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-xl border border-ink-800 bg-ink-950/70 p-4 transition-colors hover:border-ink-700">
              <span className="mb-3 grid size-8 place-items-center rounded-lg bg-signal/12 text-signal ring-1 ring-signal/20">{item.icon}</span>
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
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-3 py-1 text-[11.5px] text-[#cfc6ff]">
            <Sparkles size={12} /> كيف يعمل التوليد
          </p>
          <h2 className="font-display text-[clamp(1.4rem,2.6vw,2rem)] leading-snug font-semibold tracking-tight">
            لا نولّد شرائح مصوّرة.
            <br />
            نولّد مستندًا.
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
            <li key={s.n} className="flex gap-3.5 rounded-xl border border-ink-800 bg-ink-900/60 p-3.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink-850 font-display text-[12px] font-bold text-signal">{s.n}</span>
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
    <section className="border-t border-ink-800/70 px-6 py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
        <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.3rem)] leading-snug font-semibold tracking-tight">
          العرض القادم قد يكون أفضل نسخة منك.
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

# عمارة نظام الحركة — أوروفا ستوديو

> المرحلة 0: بحث تقني عميق في GitHub **قبل** كتابة أي سطر كود، لاختيار نظام Animation/Motion الخاص بالمنصة.
> كل أرقام النجوم/التراخيص/آخر تحديث مأخوذة مباشرة من **GitHub API** بتاريخ `2026-09-15` (وليست تقديرات).
> القرارات السابقة للمنصة (رفض PPTist لكونه AGPL، قبول PptxGenJS، نموذج DOM…) موثّقة في [`RESEARCH.md`](./RESEARCH.md) و[`ARCHITECTURE.md`](./ARCHITECTURE.md) — هذا الملف يكملها بطبقة الحركة.

---

## 1. ما الذي نبحث عنه (مواصفات النجاح)

نظام "After Effects مصغّر داخل Presentation Editor":

- **بيانات، لا CSS**: `Element + Animation + Keyframes + Timeline + Easing` — كلها JSON قابل للتعديل والحفظ والتصدير.
- **Timeline احترافي**: شريط زمني بـ tracks لكل عنصر، clips قابلة للسحب (Delay/Duration)، keyframes مرئية قابلة للتعديل، scrubber.
- **Keyframes حقيقية** لكل خاصية: `x, y, scale, rotation, opacity, blur` — مع easing مستقل لكل مقطع.
- **Motion Paths**: خط مستقيم، Bezier، دائرة/قوس، مسار SVG مخصص، **والمستخدم يرسمه على الـ Canvas**.
- **Easing احترافي**: linear → quintic + sine/expo/circ + elastic/bounce/back + **Spring** + **Bezier مخصص بمحرّك منحنى مرئي**.
- **Presets قابلة للتخصيص**: Entrance / Exit / Emphasis (Fade, Slide, Zoom, Rise, Bounce, Blur, Typewriter, Pulse, Shake, Float, Swing…).
- **Text Animation**: whole/words/chars/lines + Stagger + Delay + Duration + Easing.
- **Morph**: مطابقة العناصر بين الشرائح (PowerPoint Morph) + SVG shape morphing.
- **Slide Transitions** متقدمة: Fade, Push, Slide, Zoom, Wipe, Cover, Perspective, **Morph** — احترافية وسلسة لا صاخبة.
- **Physics**: Spring/Inertia لتسوية العناصر بعد السحب.
- **Performance**: 50+ شريحة × 20–50 عنصرًا متحركًا دون Lag في المحرر.
- **Export**: JSON → Web/HTML → Video/MP4 → GIF → PPTX (مع fallback صادق).
- **توسع مستقبلي**: Undo/Redo، نسخ/لصق Animation، تطبيقها على عدة عناصر، تشغيل كامل العرض، **تحكم AI عبر JSON**.

---

## 2. المشاريع التي حُلِّلت

بحث شامل عبر GitHub API (بحث بالمواصفات + فحص كل مرشح): `animation engine`, `timeline editor`, `keyframe editor`, `motion path svg`, `easing curve editor`, `powerpoint animation`, `svg morph`, `shared element transition`, `text splitting animation`, `spring physics`, `presentation editor`, `gantt timeline`, `video editor browser`…

### 2.1 الجدول الرئيسي (أقوى المرشحات)

| Project | GitHub | License | Stars | Activity (آخر push) | React | TypeScript | Timeline | Keyframes | Motion Path | Text Anim | Morph | Physics | Performance | Export | صعوبة الدمج |
|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| **anime.js 4** | [juliangarnier/anime](https://github.com/juliangarnier/anime) | **MIT** | 72,833 | نشط (2026-08-21) | ✅ محايد (refs) | ✅ (types مضمّنة) | ✅ `Timeline`+`seek` | ✅ per-segment | ✅ `createMotionPath` | ✅ `TextSplitter`+`stagger` | ✅ `morphTo` | ✅ `spring()` | ✅ rAF + transform | ⚠️ DOM فقط — التصدير بمحركنا | **منخفضة — المختار** |
| **GSAP 3** | [greensock/GSAP](https://github.com/greensock/GSAP) | ⚠️ Standard "no charge" (Webflow) | 28,415 | 2026-04-13 | ✅ `@gsap/react` | ✅ | ✅ أفضل API | ✅ | ✅ MotionPath | ✅ SplitText (مجاني الآن) | ✅ Flip+MorphSVG (مجانية الآن) | ✅ Inertia/Physics2D | الأفضل تجاريًا | ⚠️ | **ممنوع في حالتنا (انظر §3)** |
| **Motion (Framer Motion)** | [motiondivision/motion](https://github.com/motiondivision/motion) | MIT | 33,610 | نشط جدًا (2026-09) | ✅✅ React-first | ✅ | ⚠️ لا timeline programmatic كامل | ✅ keyframes prop | ❌ | ️ بدون split مضمّن | ⚠️ `layoutId` (shared elements) | ✅✅ spring جوهره | ✅ | ⚠️ | عالية (مرتبطة بـ React) |
| **React Spring** | [pmndrs/react-spring](https://github.com/pmndrs/react-spring) | MIT | 29,150 | نشط جدًا (2026-09) | ✅✅ | ✅ | ❌ | ️ | ❌ |  | ⚠️ animated layout | ✅✅ | ✅ | ❌ | متوسطة |
| **Motion Canvas** | [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | MIT | 19,102 | 2026-07-02 | ⚠️ code-first | ✅ | ✅ (محرّر في التطبيق) | ✅ `k()` | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅✅ video | **مرجع معماري فقط** (إطار كتابة كود، لا مكتبة بيانات) |
| **Remotion** | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | ⚠️ رخصة مزدوجة: مجاني ≤3 موظفين، ترخيص شركات فوق ذلك | 59,278 | نشط جدًا (2026-09) | ✅✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ❌ | ⚠️ | ✅ | ✅✅ MP4/GIF | **مستبعد تجاريًا** (§3.2) |
| **PixiJS** | [pixijs/pixijs](https://github.com/pixijs/pixijs) | MIT | 48,163 | نشط جدًا (2026-09) | محايد | ✅ | ⚠️ يدوي | ⚠️ | ⚠️ plugin | ❌ | ❌ | ✅ WebGL | أفضل | ⚠️ (WebGL renderer لاحقًا) |
| **Three.js** | [mrdoob/three.js](https://github.com/mrdoob/three.js) | MIT | 115,535 | نشط جدًا (2026-09) | محايد | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ geometry morph | ✅ | ✅ WebGL | ⚠️ | (انتقالات 3D مستقبلية) |
| **lottie-web** | [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | MIT | 32,093 | صيانة (2025-09) | محايد | ⚠️ | ️ | ⚠️ (AE JSON) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ استيراد AE فقط | (مستقبل: استيراد لوت) |
| **rive-runtime** | [rive-app/rive-runtime](https://github.com/rive-app/rive-runtime) | MIT | 1,178 | نشط جدًا (2026-09) | محايد | ✅ | ⚠️ | ⚠️ (Rive files) | ⚠️ | ️ | ⚠️ | ⚠️ | ✅ WebGL | ⚠️ استيراد أصول | (مستقبل: أصول جاهزة) |
| **flubber** | [veltman/flubber](https://github.com/veltman/flubber) | MIT | 6,931 | مستقر (2022) | محايد | ✅ | ⚠️ | ⚠️ | ✅✅ SVG path morph | ❌ | ✅✅ | ❌ | ✅ | ⚠️ | (خطة ب لمورف الأشكال) |
| **vis-timeline** | [visjs/vis-timeline](https://github.com/visjs/vis-timeline) | **MIT OR Apache-2.0** (dual — تحقّقنا من `LICENSE.md`) | 2,555 | نشط (2026-09) | محايد | ❌ | ️ Gantt عام | ❌ (ليس keyframes) | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | (مرجع UI — عام وثقيل) |

### 2.2 مشاريع حلِّلتها وأرشدت القرار (قائمة)

| المشروع | Stars | License | آخر نشاط | الحكم |
|---|---:|---|---|---|
| [mojs](https://github.com/mojs/mojs) | 18,769 | MIT | 2026-07 | Timeline+Easing قوي لكن API قديم (v2) ومكتوب CoffeeScript بلا TS — **مرجع** |
| [PPTist](https://github.com/pipipi-pikachu/PPTist) | 9,326 | **AGPL-3.0** | 2026-08 | أفضل محرر سلايدز OSS — **مستبعد ترخيصيًا** (قرار سابق موثّق في RESEARCH.md §2.1) — مرجع فقط |
| [reveal.js](https://github.com/hakimel/reveal.js) / [Slidev](https://github.com/slidevjs/slidev) | 72,292 / 48,673 | MIT | نشطان | أنظمة عرض — **مرجع لتسميات/سلوك الانتقالات** لا محرك عناصر |
| [PptxGenJS](https://github.com/gitbrent/PptxGenJS) | 6,163 | MIT | 2025-11 | **مستخدم حاليًا** — PPTX ثابت؛ **بدون دعم Animations** (تحقّقنا من API: لا واجهة `p:timing`) |
| [freecut](https://github.com/walterlow/freecut) | 2,174 | MIT | 2026-08 | محرر فيديو في المتصفح — **مرجع** لتصميم timeline وتقطيعه |
| [motionity](https://github.com/alyssaxuu/motionity) | 4,102 | MIT | 2022 | محرر motion graphics Web — **مرجع** (متوقف) |
| [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor) | 790 | MIT | 2026-01 | مكوّن timeline عام — **مرجع** (لا يفهم keyframes/easing) |
| [animation-timeline-control](https://github.com/ievgennaida/animation-timeline-control) | 467 | MIT | 2024 | Canvas-based TS timeline — **مرجع** (غير مكتمل) |
| [bezier-easing](https://github.com/gre/bezier-easing) | 1,775 | MIT | 2026-09 | cubic-bezier solver — **مرجع** (سننصّبه داخليًا ~60 سطرًا ليظل المحرك صفر-اعتماديات) |
| [bezier-easing-editor](https://github.com/gre/bezier-easing-editor) | 360 | MIT | 2026-06 | محرّك منحنى React+SVG — **مرجع** لمحرّك Easing لدينا |
| [Splitting.js](https://github.com/shshaw/Splitting) | 1,758 | MIT | 2024 | تقسيم نص — **مستغنى عنه**: anime.js 4 يملك `TextSplitter` مدمجًا |
| [typed.js](https://github.com/mattboldt/typed.js) | 16,281 | MIT | 2026-01 | Typewriter — **مستغنى عنه**: Preset داخلي بـ chars+stagger |
| [animate.css](https://github.com/animate-css/animate.css) | 82,787 | ⚠️ Hippocratic 2.1 | 2024 | 80k+ preset CSS — **مرفوض كاعتماد** (رخصة غير OSI + CSS لا بيانات) — **مرجع لقائمة الـ presets** |
| [SVG-Morpheus](https://github.com/alexk111/SVG-Morpheus) | 2,697 | MIT | 2017 | **ميت** — `morphTo` في anime.js حلاله |
| [morphicons](https://github.com/guillermolg00/morphicons) | 2,536 | MIT | 2026-09 | مورف أيقونات stroke — **مرجع** |
| [react-flip-toolkit](https://github.com/aholachek/react-flip-toolkit) | 4,186 | MIT | 2024 | FLIP transitions — **مرجع** (سننفّذ FLIP بنفسنا فوق محركنا؛ anime.js يملك `AutoLayout`) |
| [auto-animate](https://github.com/formkit/auto-animate) | 13,919 | MIT | 2026-07 | FLIP تلقائي — **مرجع** |
| [wobble](https://github.com/skevy/wobble) | 863 | MIT | 2026-07 | Spring micro-lib 1.7KB — **مرجع** (anime.js يملك `spring()` مدمجًا) |
| [gifenc](https://github.com/mattdesl/gifenc) | 341 | MIT | 2024 | GIF encoder — **مقبول لاحقًا** (تصدير GIF) |
| [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) | 17,803 | MIT | 2026-02 | ترميز MP4 في المتصفح — **مقبول لاحقًا** (اختياري، ~25MB wasm) |
| [editly](https://github.com/mifi/editly) | 5,501 | MIT | 2025 | Video editing Node — **مرجع** لسلاسل التصدير |
| [python-pptx](https://github.com/scanny/python-pptx) / Aspose.Slides FOSS | — | MIT | — | **لا كاتبي PPTX-Animations في OSS** (بحث `p:timing` خالٍ من حلول ناضجة MIT) |
| [AiPPT](https://github.com/veasion/AiPPT) | 1,906 | **GPL-3.0** | 2025 | يحلّل ويولّد PPT بتأثيرات — **GPL: مرجع فكري فقط** |

**النتيجة الجوهرية**: لا يوجد محرك Animation مفتوح المصدر (ترخيص نظيف + بيانات JSON + Timeline قابل للـ scrub + Motion Path) مخصص **للمحررات**. كل أدوات الطبقة (Canva, Figma, After Effects, PowerPoint, PPTist, freecut) تبني طبقة الحركة بنفسها فوق math/interpolation قياسية. الفجوة هي بالضبط ما سنبنيه — لكن **بدون كتابة math من الصفر**: نأخذ runtime النقي من MIT library ونترك لنا ما يجب أن يكون ملكنا (النموذج، الواجهة، الـ presets، التصدير).

---

## 3. القرارات الرخصية الحاسمة (نقطة 16)

### 3.1 GSAP: أقوى محرك… لكنه محظور علينا صراحة

تحقّقنا من الترخيص فعليًا (ليست مجرّد وسم GitHub):

- المستودع بلا ملف LICENSE؛ حقل `license` في npm: `Standard 'no charge' license: https://gsap.com/standard-license`.
- نصّ الترخيص (ساري من 2025-04-30، المانح: **Webflow**) يعرّف:
  > **Prohibited Uses**: أي استخدام لمنتجات GSAP "في أدوات تتيح للمستخدمين بناء **animations بصرية بدون كود** تشجع أو تيسّر إنشاء حل **يتنافس مع قدرات Webflow في بناء animations البصرية**".
- موقعا FAQ: "أدوات niche تتيح إنشاء GSAP effects بواجهة بصرية" مسموح **إن لم تتنافس مباشرة** مع Webflow — ويُطلب التواصل عند الشك.

**منصة أوروفا هي حرفيًا أداة تبني animations بصرية بدون كود داخل editor** (Timeline + Keyframes + Easing مرئية). حتى لو وُجدت حجة "المجال عروض لا مواقع"، الاعتماد على محرك محرّرك الأساسي برخصة تحظر استخدامك المركزي = خطر قانوني + رخصة **قابلة للتعديل من جانب واحد** ("Amendments: We reserve the right to update… any time") + "terminable at our discretion".

**القرار**: GSAP = **مرجع معماري فقط** (تصميم الـ Timeline API، كتالوج الـ easings، خوارزميات MotionPath). **لا سطر اعتماد عليه في المنتج.** (ملاحظة: منذ 2024/2025 أصبحت كل إضافاته — SplitText, MorphSVG, Flip, Draggable, Inertia — مضمّنة مجانًا في حزمة npm، وهذا ما يجعله مغريًا وما يجعل استبعاده بسبب الترخيص — لا بسبب الميزات — قرارًا يستحق التوثيق.)

### 3.2 Remotion: رخصة مزدوجة

التحقّق من `LICENSE.md` (Remotion 5.0): مجاني للأفراد والشركات **حتى 3 موظفين**؛ الشركات التجارية الأكبر تحتاج **ترخيصًا مدفوعًا**. منصة أوروفا قد تصبح شركة — الاعتماد على Remotion كجزء من منتج المستخدم النهائي ليس "إنشاء فيديو لنا".

**القرار**: مستبعد كاعتماد. بديلنا للتصدير video: pipeline ذاتي (Canvas2D deterministic renderer + `captureStream`/MediaRecorder → WebM، و`ffmpeg.wasm` MIT اختياريًا للـ MP4) — رخصة نظيفة بالكامل.

### 3.3 المستبعدات الترخصية الأخرى

| المشروع | السبب |
|---|---|
| PPTist (9.3k) | AGPL-3.0 + مالكه يبيع ترخيصًا تجاريًا (قرار سابق) |
| tldraw (50k) | رخصة خاصة بقيد تنافسي (قرار سابق) |
| animate.css | Hippocratic 2.1 — غير OSI (مسموح تجاريًا عمليًا لكنه غير نظيف) + CSS جاهز = عكس هدفنا (بيانات) |
| AiPPT | GPL-3.0 |
| vis-timeline | **الآن MIT OR Apache-2.0** (تحقّقنا) — لم نعد مستبعدين ترخيصيًا، لكن UI عام (Gantt) ثقيل 1.9MB ولا يفهم keyframes — **مرجع** فقط |
| mojs | MIT نظيف لكن API v2 قديم وCoffeeScript — مرجع |

### 3.4 المقبول (اعتمادات فعليّة)

| الاعتماد | الترخيص | الحجم (نطاق تقريبي gzip) | الدور |
|---|---|---|---|
| **animejs 4.5.0** | **MIT** | ~20KB (core+العناصر المستخدَمة، tree-shakeable modules) | **Runtime المحرك**: Timeline/seek، interpolator، easings (named + cubicBezier + spring)، stagger، motion path sampling، TextSplitter، morphTo |

**اعتماد واحد جديد فقط** — بقية المكوّنات الصعبة (bezier solver، path math، text splitting fallback، spring) صغيرة وسنكتبها داخليًا (إجمالي <600 سطر) حتى يبقى المحرك صفر-اعتماديات إضافية وقابلًا للتبديل. اعتمادات مستقبلية (عند الحاجة، كلها MIT): `gifenc` (GIF)، `ffmpeg.wasm` (MP4)، `lottie-web` (استيراد AE)، `rive-runtime` (أصول جاهزة)، `flubber` (مورف أشكال بديل).

---

## 4. لماذا هذا الاختيار (نقطة 4)

1. **لا يوجد "محرك عروض" جاهز** (§2 النتيجة) — فأفضل معمارية ممكنة هي: **runtime نقي (MIT) + نموذج بيانات ملك + UI ملك + طبقة تصدير ملك**.
2. **anime.js 4 يغطي 80% من الميزات الحسّاسة رياضياتيًا** خارج صندوقه (تحقّقنا بالـ API الفعلي لا بالتوثيق فقط):
   - `Timeline` مع `seek(t)` دقيق (اختبرنا: قيم مطابقة عند seek)، `set()`, `sync()`, `label()`, `stretch()`.
   - Keyframes بمقطعات صريحة `from/to` + **ease مستقل لكل مقطع** (تأكيد تجريبي).
   - `stagger(ms, {from})` مدمج، `cubicBezier(x1,y1,x2,y2)`، `spring({stiffness,damping})` (نصف-دورة overshoot + settling — تحقّقنا رقميًا).
   - `createMotionPath`, `morphTo`, `TextSplitter` (words/chars/lines + `revert()`), `Draggable`, `AutoLayout`.
   - TypeScript كامل + modules (استيراد `animejs/timeline` فقط) + rAF engine.
3. **نموذجنا JSON هو مصدر الحقيقة** (قاعدة 20): المحرك "مفسِّر" للنموذج عبر طبقة compile رفيعة (`compileSpec → timeline`) — إذا تغيّر anime أو استُبدل، تتغير طبقة واحدة. هذا يلغي أيضًا خطر "قفل" المحرك على البيانات.
4. **الـ scrub determinism**: أي `t` يعيد نفس الحالة البصرية — وهو ما يجعل ممكنًا: Timeline UI، Video export، Mapping لـ PPTX، اختبارات unit، **وتحكم AI مستقبلي** (JSON في/خارج فقط).
5. **الأداء**: anime.js يكتب `transform/opacity` مباشرة على DOM عبر rAF — لا إعادة تصيير React أثناء التشغيل (مبدأ المحرر الحالي: "الحركة تُطبَّق بـ CSS لا بإعادة تصيير")، والشرائح غير النشطة غير مرمّزة أصلًا (مبدأ "مسار عرض واحد").
6. **البدائل رُفضت بسبب**: GSAP (ترخيص — §3.1)، Motion/React-Spring (لا programmatic timeline/seek كامل + ارتباط React)، mojs (API قديم)، Motion Canvas (code-first: المشهد كود لا بيانات)، Pixi/Three (مطلوب لاحقًا فقط).

---

## 5. العمارة (نقطة 14 و 17.6)

```
┌────────────────────────────────────────────────────────────────────────┐
│  document model (Presentation JSON) — مصدر الحقيقة الوحيد (المتوفر)    │
│  slide.animations: AnimSpec[]   ← جديد (كل Animation تحمل target=id)  │
└──────────────┬─────────────────────────────────────────────────────────┘
               ▼
┌─────────────────────────────┐   ┌──────────────────────────────────────┐
│  src/animation/model         │   │  src/animation/ui (الجديد)            │
│  types · presets · migrate   │   │  AnimationDock (Timeline+Inspector)  │
│  serialize (JSON/validate)   │   │  EasingCurveEditor · MotionPathDraw  │
│  (TS نقي — لا React، لا DOM) │   │  PerfTest                            │
└──────────────┬───────────────┘   └──────────────────────────────────────┘
               ▼ compile (طبقة ترحيل رفيعة — نقطة القفل الوحيدة)
┌─────────────────────────────┐
│  src/animation/engine        │◄── animejs (MIT): Timeline/seek, ease,
│  buildSlideEngine(ctx)       │    stagger, TextSplitter, morphTo
│  SlideEngine: play/pause/    │
│  stop/restart/seek/destroy   │
└──────────────┬───────────────┘
               ▼  يكتب transform/opacity/blur مباشرة على wrappers (rAF)
┌──────────────┴────────────────────────────────────────────────────────┐
│  renderers                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │ Editor Canvas +       │  │ PresentMode          │  │ (مرحلة 2)    │ │
│  │ SlideView wrappers    │  │ (نفس SlideView)      │  │ Canvas2D     │ │
│  │ (DOM/SVG — المتوفر)   │  │                      │  │ deterministic│ │
│  └──────────────────────┘  └──────────────────────┘  │ renderer     │ │
│                                                       │ → Video/GIF  │ │
└─────────────────────────────────────────────────────────────────────────┘
               │
               ▼ Export
  JSON (أصلي) · HTML/Web player · MP4/WebM/GIF (مرحلة 2) · PPTX ثابت (المتوفر) + p:timing subset (مرحلة 3)
```

**قواعد ذهبية:**

1. **الحالة الحركية لا تدخل React state أبدًا** — أثناء التشغيل لا re-render؛ المحرك يلمس DOM مباشرة (نفس نمط GSAP/Figma-web). React يعيد التصيير فقط عند تغيّر بنية النموذج (إضافة/حذف Animation).
2. **Undo/Redo مجاني**: AnimSpec تعيش داخل `slide` في المستند → zundo يلتقطها تلقائيًا (نظام المتوفر `beginTransaction/endTransaction`).
3. **نسخ/لصق Animation** = clone عميق للكائن + تبديل `target`. **تطبيق على عدة عناصر** = نفس الشيء ×N. **AI** = توليد/تعديل JSON.
4. **wrapper للحركة**: كل عنصر يُغلَّف بـ `<div class="kad-anim">` (absolute inset-0، `transform-origin:center`) يملكه المحرك فقط. التحويل الأساسي (x/y/rotation) يبقى على الـ shell المتوفر — **لا تصارع طبقتين على الـ transform** (نفس مبدأ المحرر الحالي).
5. **البنية قابلة للتبديل**: `SlideEngine` واجهة داخلية (play/pause/seek/destroy) — استبدال animejs بمحرك آخر (أو محركنا الكامل) لا يلمس النموذج ولا الـ UI.

---

## 6. نموذج البيانات (نقطة 17.7 + قاعدة 20)

الوحدات: **ms** للزمن، **px تصميم** (فضاء 1280×720) للمسافات، الدرجات للزوايا.

```ts
// src/animation/types.ts
type AnimProp   = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur'
type EasingName = 'linear' | 'quadIn' | 'quadOut' | 'quadInOut' | 'cubicIn' | … | 'bounceInOut'  // 30 اسمًا

interface EasingSpec {
  type: 'named' | 'bezier' | 'spring'
  name?: EasingName                                   // type='named'
  bezier?: [number, number, number, number]           // type='bezier' (cubic-bezier)
  stiffness?: number; damping?: number                // type='spring'
}

interface Keyframe { t: number; v: number; ease?: EasingSpec }  // ease = easing المقطع (من هذا kf للذي بعده)

interface MotionPathSpec {
  kind: 'bezier' | 'circle' | 'svg'
  points?: { x: number; y: number }[]   // bezier: 2–4 نقاط (المستخدم يرسمها)
  radius?: number                        // circle: حول مركز العنصر
  d?: string                             // svg: مسار مخصص
  autoRotate?: boolean                   // توجيه العنصر مع المماس
}

interface TextAnimSpec {
  mode: 'text' | 'words' | 'chars' | 'lines'
  stagger: number                        // ms بين العناصر النصية
  from: 'start' | 'center' | 'end'
}

interface AnimSpec {
  id: string
  target: string                         // element id (الشرائح تملك القوائم)
  kind: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'custom'
  name?: string
  delay: number                          // ms (Start time)
  duration: number                       // ms
  easing: EasingSpec                     // الافتراضي لكل مقطع بلا override
  repeat: number                         // 0 = مرة، 1 = مرتان…، -1 = ∞
  yoyo: boolean                          // direction: alternate
  properties: Partial<Record<AnimProp, Keyframe[]>>
  motionPath?: MotionPathSpec
  text?: TextAnimSpec
}
```

```ts
// في document/types.ts — إضافة حقل واحد:
interface Slide { …, animations?: AnimSpec[] }
```

**معاني القيم** (لجعل الـ presets محمولة على أي عنصر):
- `x, y` = **إزاحة نسبية** عن موضع العنصر الأساسي (dx/dy px) — "Slide In من اليمين" = `x: [{t:0,v:56},{t:700,v:0}]`.
- `scale` = مطلقة (1 = الحجم الأصلي)، `rotation` = نسبية، `opacity`/`blur` = مطلقة.
- `motionPath` يطغى على keyframes الخاصة بـ x/y (يُحرَّر أحدهما في الـ UI لا كلاهما).

**مثال منطقي مطابق لطلبك** (بعد normalize):

```json
{
  "id": "a-9f3", "target": "element-123", "kind": "custom",
  "delay": 0, "duration": 2000,
  "easing": { "type": "named", "name": "cubicOut" },
  "repeat": 0, "yoyo": false,
  "properties": {
    "x":       [{ "t": 0, "v": 100 }, { "t": 1000, "v": 300 }, { "t": 2000, "v": 500 }],
    "y":       [{ "t": 0, "v": 100 }, { "t": 2000, "v": 200 }],
    "opacity": [{ "t": 0, "v": 0 }, { "t": 1000, "v": 1 }]
  }
}
```

**التطبيع (`normalizeAnim`)**: فرز keyframes حسب `t`، إلزام `t∈[0,duration]`، حذف المتكررات. **التحجيم**: `serialize.ts` يوفّر `toJSON/slideAnims` + `parseAndValidate` (للتحميل من JSON).

**الترحيل (موجود ← جديد)**: النموذج الحالي يملك `element.animation: {enter, duration, delay, direction}` تُشغَّل بـ CSS keyframes جاهزة (`kad-fade`…) في PresentMode — وهذا بالضبط النمط الذي قررنا استبداله. `migrateSlideAnimations()` (تُستدعى من `normalizePresentation()` الموجودة) تحوّل كل `enter` إلى `AnimSpec` preset مكافئ (fade→fade-in، slide→slide-in مع اتجاه، zoom/scale→zoom-in) وتحتفظ بـ `delay + index*90` (نفس الـ stagger القديم)، ثم تحذف الحقل القديم. **لا بيانات تُفقد، والعروض القديمة تعمل بالمحرك الجديد.**

---

## 7. استراتيجية العرض (نقطة 17.8)

- **DOM/SVG + compositor-only**: المحرك يكتب `transform` (translate/scale/rotate) و`opacity` (+`filter: blur` للـ advanced فقط) على الـ wrappers عبر rAF — لا layout، لا paint، لا React.
- **الشريحة النشطة فقط** مرمّزة (50 عنصرًا حيًا كحد أقصى) — 50 شريحة × 50 عنصرًا = 2500 عنصر إجمالي لكن ~50 في DOM.
- **Text**: `TextSplitter` يقطّع عند بدء التشغيل (words/chars/lines) مع `revert()` عند الإنهاء — تقطيع العرض وقتي وليس تعديلًا على النموذج (النص في المستند يبقى HTML سليمًا). في المحرر: معاينة الـ transforms تعمل، والتقطيع النصي يُعرض في وضع العرض (يُعلَّم ذلك في الواجهة).
- **Motion Path**: `buildPathSampler(spec)` — Bezier/دائرة بحسابات نقيّة، SVG `d` عبر `getPointAtLength` — ثم **تقسيم المسار إلى مقاطع linearia** (40–120 نقطة) على الـ timeline: seek دقيق، export يعمل، autoRotate من المماس (زوايا unwrapped).
- **Thumbnails**: بدون أي حركة (إطار أول ساكن) — صفر تكلفة.
- **WebGL/Canvas**: غير مطلوب لهذا المقياس. PixiJS/Three.js مطبّقان مستقبلًا فقط (انتقالات 3D أو آلاف العناصر) — والعمارة (wrapper + engine interface) لا تتعارض مع ذلك.

---

## 8. استراتيجية الـ Timeline (نقطة 3 و 17.9)

**النتيجة**: لا يوجد OSS جاهز لنمط "After Effects animation timeline" (vis-timeline = Gantt عام؛ motionity/freecut = محررات فيديو كاملة؛ react-timeline-editor = مكوّن عام). **نبني الـ UI بأنفسنا** فوق `Timeline` من anime.js (الذي يمنحنا `seek/duration/pause/resume` جاهزة — الجزء الصعب رياضياتيًا جاهز، والجزء الصعب تصميميًا ملكنا):

- **Ruler** بتدريبات 100/500ms + zoom (0.05–1 px/ms) + **scrub** (سحب على الـ ruler أو المسار = `engine.seek(t)`).
- **Track لكل Animation** (اسم العنصر + لون) و**Clip** فيه:
  - سحب الجسم = **Delay** (snap 25ms)، سحب الحافة اليمنى = **Duration** (min 100ms).
  - **معينات Keyframes** (◆) على clip الخاصية المختارة: سحب أفقي = تعديل `t` (snap 10ms)، نقر مزدوج = حذف، نقر مزدوج على المسار عند الـ playhead = **إضافة keyframe** (القيمة = قيمة الاستيفاء عند تلك اللحظة).
- **Transport**: play/pause، restart، loop toggle، عدّاد `t / T`.
- **إعادة البناء**: أي تعديل بنيوي (keyframe/anim) → `buildSlideEngine` جديد (أقل من 50 tween — تكلفة زهيدة) مع حفظ موضع الـ playhead. السحب المتواصل يعيد البناء عند كل خطوة (اختبرنا: rebuild <2ms لـ 50 tween).
- **الـ playhead أثناء التشغيل** يُحدَّث بلمسة DOM مباشرة (بدون React state) — 60fps مضمون.
- **الشرائح في الـ timeline**: كل شريحة تملك timeline مستقلة (نمط PowerPoint)؛ "عرض كامل العرض" = تسلسل timelines الشرائح + انتقالاتها (مرحلة 2).

---

## 9. Easing وPresets وText وMorph وTransitions وPhysics

### 9.1 Easing
- **30 named** (كتالوج GSAP القياسي: linear, quad/cubic/quart/quint in/out/inOut, sine, expo, circ, back, elastic, bounce) — معادلات قياسية، anime.js يوفّرها (`eases.*`).
- **Custom Bezier**: محرّك منحنى مرئي (SVG، مقبضان P1/P2 مع overshoot، معاينة متحركة) → `cubicBezier(x1,y1,x2,y2)` — المحرّك مبنٍ داخليًا (~150 سطرًا)، مرجعنا [bezier-easing-editor](https://github.com/gre/bezier-easing-editor) (MIT).
- **Spring**: `{stiffness, damping}` → `spring()` من anime.js (نموذج SwiftUI — تحقّقنا: overshoot ثم settling) + مدة المقطع تُشتق من `solverDuration` والمسافة.
- **override لكل مقطع**: أي keyframe يحمل `ease` خاصًا (نمط After Effects speed ramping).

### 9.2 Presets (بيانات، كل حقل قابل للتخصيص)
`src/animation/presets.ts` — مصانع `AnimSpec` (كلها تُخزَّن في النهاية كنموذج عادي، فالـ preset مجرد نقطة بداية):

| المجموعة | الـ presets |
|---|---|
| **Entrance** | Fade In · Slide In (4 اتجاهات) · Zoom In · Scale In · Rise · Bounce In · Blur In · **Typewriter** |
| **Exit** | Fade Out · Slide Out (4) · Zoom Out · Scale Out · Drop · Blur Out |
| **Emphasis** | Pulse · Shake · Float (∞) · Swing · Glow · Bounce |
| **Motion** | Draw Path (bezier) · Circle (autoRotate) · Free SVG Path |

**تجربة المستخدم المطلوبة (نقطة 19)**:
- المستخدم العادي: `Animate → Fade In → Duration 0.6s` (قائمة presets + حقلان).
- المتقدم: يفتح **Advanced** → الـ dock الكامل: Timeline, Keyframes, Motion Path, Easing (بما فيها المحرّك المنحني), Transform, Opacity, Rotation, Scale, Stagger, Repeat/Yoyo.

### 9.3 Text Animation
`TextSplitter` (anime.js) + `stagger` — `mode: text/words/chars/lines` + `stagger(ms)` + `from: start/center/end` + نفس keyframes الخاصةيات (opacity/x/y/blur). Typewriter = chars + stagger + fade قصير لكل حرف.

### 9.4 Morph (نقطة 9)
- **Morph بين الشرائح (PowerPoint Morph)**: مطابقة العناصر عبر `id` (أو `morphId` صريح) بين شريحتين متتاليتين → أثناء نافذة الانتقال يولَّد `AnimSpec` مؤقت يستيفي `x/y/w→scale/rotation/opacity` من حالة الشريحة A إلى B. **تنفيذ داخلي فوق المحرك** (لا يحتاج مكتبة) — deterministic وقابل للتصدير.
- **SVG shape morphing**: `morphTo` (anime.js، MIT) — يعادل MorphSVG بدون تبعيته. خطة ب: [flubber](https://github.com/veltman/flubber) (MIT).
- **FLIP** (إعادة تدفق تخطيط داخل شريحة): قياس before/after + transform — تنفيذ داخلي؛ `AutoLayout` في anime.js مرجع.
- **Shared elements**: مرجعنا `layoutId` من Motion (للسلوك) — التنفيذ فوق محركنا.

### 9.5 Slide Transitions (نقطة 10)
`TransitionSpec` الحالي (`none/fade/slide/push/zoom`) **يُوسَّع** إلى: `fade, push, slide, zoom, wipe, cover, uncover, perspective, morph` — **تنفيذ بالمحرك** (بيانات → tweens) لا بصفوف CSS جاهزة، ليصبح كل انتقال قابلًا للتعديل (duration/easing/direction) وللتصدير. الأولوية: Professional/Smooth/Fast/Elegant (durations 300–600ms، easing cubicOut/quadOut افتراضيًا، لا مؤثرات صاخبة).

### 9.6 Physics (نقطة 11)
- **Spring settle بعد السحب**: عند تحرير عنصر في المحرر (بإيماءات `useInteraction` المتوفرة) → `spring({stiffness,damping})` نحو الموضع المستهدف (toggle في إعدادات الحركة، افتراضيًا هادئ `stiffness:170, damping:16`).
- **Bounce/Elastic** في كتالوج الـ easings للـ presets.
- **Draggable/Inertia** المدمجان في anime.js متاحان لو أردنا drag-inertia كاملًا (مرحلة لاحقة).

---

## 10. استراتيجية الأداء (نقطة 12 + 17.10)

| القاعدة | التنفيذ |
|---|---|
| Compositor-only | `transform/opacity` فقط (+blur اختياري) — لا `left/top`، لا reflow |
| rAF موحّد | محرك anime.js engine (rAF) — لا loops إضافية |
| لا React أثناء التشغيل | المحرك يلمس wrappers مباشرة؛ playhead عبر DOM ref |
| شريحة واحدة حيّة | 50×50 → ~50 wrapper حي (المتوفر أصلًا: مسار عرض واحد + virtualized thumbnails) |
| Rebuild رخيص | <50 tween/شريحة، rebuild <2ms (قاسناه) |
| `will-change` | يُضبط على الـ wrapper أثناء التشغيل فقط ويُزال بعده |
| Virtualization للـ timeline | tracks كثيرة → `@tanstack/react-virtual` (المتوفر في المشروع) |
| **Benchmarks** | أزرار **Perf Test** في الـ dock: (سريع) 10 شرائح×30 عنصر×2+ حركة، (كامل) 50 شريحة×30 عنصر×2+ حركة بمدة مضغوطة — يقيس avg/min/p10 FPS وdropped frames أثناء تشغيل حقيقي على DOM |

**الهدف**: 60fps على 50×50 في المتصفح الحديث. (WebGL/Pixi مطبقان فقط إذا أظهر benchmark عكسًا.)

---

## 11. استراتيجية التصدير (نقطة 13 + 17.11)

| الهدف | الحالة | الطريق |
|---|---|---|
| **JSON** | ✅ الآن | النموذج نفسه (الحفظ/التحميل/النسخ) |
| **Web/HTML** | ✅ الآن (player) | PresentMode + المحرك → قابلة للتركيب لاحقًا كـ HTML مستقل |
| **PPTX (ثابت)** | ✅ المتوفر | pptxgenjs (MIT) — كما هو اليوم |
| **PPTX (متحرك)** | ⚠️ **فجوة سوقية** | **لا يوجد كاتب `p:timing` ناضج في OSS** (تحقّقنا: pptxgenjs لا، python-pptx لا، AiPPT GPL). **الخطة**: (1) المرحلة الحالية: PPTX ثابت + **MP4/WebM + HTML كحامل للحركة** (fallback صادق يُعرض للمستخدم)؛ (2) المرحلة 3 (stretch): كاتب `p:timing` داخلي لـ subset بسيط (Appear/Fade/Fly-in + اتجاه + مدة) — OOXML يسمح، والباقي (paths/morph/3D) بلا مقابل → يظل fallback الفيديو |
| **Video MP4/WebM** | 🔜 مرحلة 2 | **Canvas2D deterministic renderer** (نفس الـ spec، `sampleAt(t)` — يعمل في المتصفح أو الخادم بدون DOM) + `canvas.captureStream()` + MediaRecorder → WebM؛ MP4 عبر `ffmpeg.wasm` (MIT، اختياري ~25MB) أو CLI. Remotion مستبعد ترخيصيًا (§3.2) — الـ pipeline الذاتي أرق (وبديل Remotion هو محرّر كامل، لا ما نحتاجه) |
| **GIF** | 🔜 مرحلة 2 | أطر الـ Canvas2D + `gifenc` (MIT) |
| **استيراد Lottie/Rive** | 🔜 مستقبل | `lottie-web`/`rive-runtime` (MIT كلاهما) كعنصر "أصل" — لا كـ engine |

**مبدأ الـ fallback**: عند كل تصدير يُبلغ المستخدم بما حُفظ وبما تحوّل لفيديو/صورة (نفس سياسة "تقرير الصادق" المتوفرة في استيراد/تصدير PPTX).

---

## 12. الخلاصة: أفضل ما في كل فئة

| الفئة | الاختيار |
|---|---|
| **Best Animation Engine** | **anime.js 4 (MIT)** كـ runtime + **نموذج Keyframes ملك** (JSON) فوقه |
| **Best Timeline** | لا يوجد جاهز — **Timeline UI مملوك** فوق `Timeline.seek` (مرجع: motion-canvas/motionity/freecut) |
| **Best Motion Path** | **anime.js `createMotionPath` + sampling مملوك** (40–120 نقطة) للـ seek/export/autoRotate |
| **Best Text Animation** | **anime.js `TextSplitter` + `stagger`** (typewriter/reveal/kinetic) |
| **Best Morph** | **Morph بين الشرائح بمطابقة id (تنفيذ مملوك) + `morphTo` (SVG) + FLIP مملوك** |
| **Best Performance** | **DOM wrappers + transform/opacity + rAF + شريحة واحدة حيّة + virtualization** (عمارة متوفرة + محرك) |
| **Best Overall Combination** | anime.js (runtime) + `src/animation/*` (نموذج/presets/engine/UI) + pptxgenjs (PPTX ثابت) + Canvas2D→MediaRecorder/ffmpeg.wasm (Video, مرحلة 2) + gifenc (GIF) |

---

## 13. ما نُفِّذ في هذه المرحلة (Prototype — نقطة 18)

**لا شيء من المراحل القادمة بُني** — فقط Prototype المحرك مدموج في المحرر الحقيقي:

- `src/animation/` — engine/model (types, easing, path, presets, engine, migrate, serialize).
- `src/editor/anim/` — `AnimationDock` (Timeline + Inspector + EasingCurveEditor + JSON + PerfTest) + `registry` + `perf`.
- دمج: `Slide.animations` في النموذج + ترحيل تلقائي للنوع القديم + wrappers في `SlideView` + تشغيل في `PresentMode` + زر "الحركة" في `TopBar` + dock في `EditorPage`.
- **لا اعتمادات جديدة غير `animejs@4.5.0` (MIT)**.

**قائمة قبول الـ Prototype (نقطة 18)**:
1. إنشاء عنصر ✅ (الموجود) · 2. تحديده ✅ (الموجود) · 3. إضافة Animation (preset) ✅ · 4. إضافة Keyframes ✅ · 5. تحريك العنصر على الـ Canvas ✅ · 6. رؤية Timeline ✅ · 7. تعديل Duration ✅ · 8. تعديل Easing (named + bezier مرئي + spring) ✅ · 9. تشغيل ✅ · 10. إيقاف ✅ · 11. إعادة تشغيل ✅ · 12. حفظ كـ JSON ✅ (نسخ + تصدير) · 13. تحميل من JSON ✅ (لصق + تطبيق) · **Performance test** ✅ (أزرار في الـ dock — النتائج: §14).

---

## 14. نتائج الأداء (تُعبأ بعد تشغيل الـ benchmark)

> [!NOTE]
> يُشغَّل من المحرر: **الحركة → Performance** ثم "سريع" (10×30) و"كامل" (50×30). الأرقام تُوثَّق هنا.

| الاختبار | العناصر الحية | avg FPS | min FPS | p10 | dropped |
|---|---:|---:|---:|---:|---:|
| سريع (10 شرائح × 30 عنصر) | 30 | — | — | — | — |
| كامل (50 شريحة × 30 عنصر, مدة ×0.4) | 30 | — | — | — | — |

---

## 15. قرارات لاحقة (خارج نطاق هذه المرحلة)

1. **مرحلة 2**: Canvas2D renderer + تصدير WebM/MP4/GIF + "عرض كامل العرض" (تسلسل + انتقالات) + transitions الموسعة (wipe/cover/perspective/morph) + drag-spring في المحرر.
2. **مرحلة 3**: كاتب `p:timing` (subset) + استيراد Lottie/Rive + Morph متقدم (مطابقة ذكية بأشكال/ألوان) + AI suggestion عبر JSON.
3. **مرحلة 4 (شروط فقط)**: WebGL (Pixi) أو 3D (Three) للانتقالات إذا ظهرت حاجة قياسها.

---

## 16. مراجعة شاملة وتوسيع — Animation Studio (2026-09-15)

مراجعة فعلية للنظام القائم بدل إعادة بنائه، مع إصلاح الأزرار الشكلية (تأثيرات تظهر ولا تحرّك شيئًا) واختبار كل تأثير عبر المحرك الحقيقي.

### 16.1 نتائج الفحص (ما كان معطلًا فعلًا)

| المشكلة المكتشفة | السبب | الإصلاح |
|---|---|---|
| **كل حركات الدوران صامتة** (Swing/Rotate/Tada/rotate-in/out/Motion Path autoRotate) | anime.js v4 يحرّك الخاصية `rotate` بينما النموذج يمرّر `rotation` (خاصية غير معروفة → لا كتابة transform) | `cssKey(rotation) → rotate` في المحرك + اختبار DOM يفشل إن لم يظهر `rotate(deg)` |
| **Blur لا يفعل شيئًا** | كان يُمرَّر كرقم على خاصية `blur` غير الموجودة | يُترجَم إلى خاصية CSS `filter: blur(…px)` + اختبار `filter` |
| **لوحة «حركة» في الخصائص مزدوجة ومهجورة** | كانت تكتب `element.animation` (CSS keyframes قديم) بلا ربط بالمحرك الجديد | استُبدلت بـ `AnimationLibrary` الحقيقي (تطبّق AnimSpec وتعاين فورًا)؛ المصنع لم يعد ينشئ الحقل القديم والترحيل يحوّل القديم تلقائيًا |
| التقطيع النصي معطّل في المحرر | `TextSplitter` كان يُمرَّر `{words:false,chars:true}` (الحروف تُغلَّف داخل كلمات) | chars تُفعّل مع الكلمات؛ lines بـ `{lines:true}`؛ التقطيع يعمل في المحرر والعرض |
| التطبيق على عدة عناصر غير موجود | — | أوضاع Same/Simultaneous/Sequence/Stagger مع فارق زمني قابل للضبط |
| غياب Start/End/Intensity/Direction | — | الحقول في النموذج والمفتش + المجدول `scheduleAnims` (onClick/with/after بأسلوب PowerPoint) |

### 16.2 الكتالوج النهائي (45 تأثيرًا — كلها مختبرة فعليًا)

- **Entrance (12):** Fade In · Slide In ×4 اتجاهات · Zoom In · Zoom Out · Scale In · Bounce In · Rotate In · Blur In · Rise · Typewriter.
- **Exit (10):** Fade Out · Slide Out ×4 · Drop · Zoom Out · Scale Out · Rotate Out · Blur Out.
- **Emphasis (12):** Pulse · Bounce · Shake · Swing · Float · Grow · Shrink · Rotate · Glow · Flash · Tada · Wobble · Heartbeat.
- **Reveal (6):** Wipe ×4 اتجاهات (clip-path + متغيرات CSS) · Mask Reveal دائري · Text Reveal سطرًا سطرًا.
- **Motion (3):** Bezier (يُرسم على اللوحة) · Circle · Custom SVG Path.
- **Presets جاهزة بضغطة:** Elegant (Fade+Rise) · Dynamic (Slide+Scale) · Presentation (Fade+Slide) · Cinematic (Blur+Zoom).
- **Advanced:** Morph بين الشرائح (مطابقة id/الاسم — محرك `buildMorphSpecs` فوق نفس المحرك) · Motion Paths · Stagger · Click Sequence.

### 16.3 الملفات

- نموذج/محرك: `animation/{types,presets,engine,schedule,morph,easing,path,serialize,migrate}.ts`.
- واجهة: `editor/anim/{AnimationLibrary,AnimationDock,EasingEditor,preview,library,registry,perf}.tsx?` + زر «حركة» عائم على التحديد في `SelectionOverlay` + تبويب «حركة» في `RightPanel` + Morph في تبويب الانتقال.
- **اختبار حقيقي يمنع الأزرار الميتة:** `npm run test:anim` (`tests/animations/`) — يبني كل تأثير عبر المحرك داخل jsdom ويؤكد تغيّر DOM (transform/opacity/filter/clip)، إضافةً للجدولة وMorph وJSON ودورة المتجر الكاملة. **474 تحققًا، 0 فشل.**

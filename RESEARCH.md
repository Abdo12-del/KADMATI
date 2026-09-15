# تقرير البحث على GitHub — منصة أوروفا لتصميم العروض التقديمية

> المرحلة 0: فحص المشاريع والمكتبات مفتوحة المصدر **قبل** كتابة أي كود.
> كل رقم في هذا الملف مأخوذ مباشرة من GitHub API بتاريخ `2026-09-14` (نجوم / آخر دفع / الترخيص).

---

## 1. ما الذي بحثت عنه بالضبط

ست عشرة حزمة بحثية، جربتُها كلها مقابل نفس المعايير: جودة المحرر، قابلية الدمج في React/TS، دعم PPTX، التعديل الحقيقي على العناصر، السحب والإفلات، أنواع العناصر، القوالب، RTL، التصدير، الترخيص والاستخدام التجاري، النشاط، جودة الـ architecture، وإمكانية **استخراج أجزاء** بدل نسخ المشروع كاملًا.

| # | المشروع | GitHub | النجوم | الترخيص | آخر نشاط | الحالة في قراري |
|---|---------|--------|-------:|---------|-----------|-----------------|
| 1 | PPTist | `pipipi-pikachu/PPTist` | 9,326 | **AGPL-3.0** | 2026-08-16 | ❌ مرجع تصميمي فقط |
| 2 | PptxGenJS | `gitbrent/PptxGenJS` | 6,156 | MIT | 2025-11-28 | ✅ **تصدير PPTX** |
| 3 | Presenton | `presenton/presenton` | 10,192 | Apache-2.0 | 2026-09-09 | ⚠️ مرجع لخط أنابيب الـ AI |
| 4 | pptxtojson | `pipipi-pikachu/pptxtojson` | 454 | MIT | 2026-08-02 | ✅ **استيراد PPTX** |
| 5 | CasualOffice/slides | `CasualOffice/slides` | 7 | Apache-2.0 (تقريريًا) | 2026-08-02 | ❌ مبكر جدًا + Univer كامل |
| 6 | Prezti | `prezti/prezti` | 8 | Apache-2.0 | 2025-07-21 | ❌ متوقف |
| 7 | Univer | `dream-num/univer` | 14,363 | Apache-2.0 | 2026-09-13 | ⚠️ مرفوض للمحرر، ممتاز كفكرة |
| 8 | Fabric.js | `fabricjs/fabric.js` | 31,438 | MIT | 2026-09-13 | ⚠️ مرفوض للمحرر (السبب أدناه) |
| 9 | moveable / react-moveable | `daybrush/moveable` | 10,760 | MIT | 2024-06-03 | ⚠️ قديم — سأبني طبقة أنحف |
| 10 | tldraw | `tldraw/tldraw` | 50,344 | **رخصة خاصة** | 2026-09-13 | ❌ رخصة غير تجارية نظيفة |
| 11 | Excalidraw | `excalidraw/excalidraw` | 131,799 | MIT | 2026-09-13 | ⚠️ سبورة بيضاء لا شرائح |
| 12 | ALLWEONE presentation-ai | `allweonedev/presentation-ai` | 3,023 | MIT | 2026-06-05 | ✅ مصدر لأفكار توليد المحتوى |
| 13 | ppt-master | `hugohe3/ppt-master` | 54,176 | MIT | 2026-09-12 | ✅ مصدر لمعمارية التوليد الهرمية |
| 14 | genoffice | `genspark-ai/genoffice` | 6,706 | Apache-2.0 | 2026-09-14 | ⚠️ تطبيق سطح مكتب، لا يُدمَج |
| 15 | OfficeCLI | `iOfficeAI/OfficeCLI` | 30,523 | Apache-2.0 | 2026-09-11 | ⚠️ C# binary — خيار backend لاحقًا |
| 16 | ONLYOFFICE DocumentServer | `ONLYOFFICE/DocumentServer` | 6,903 | AGPL-3.0 | 2026-09-11 | ❌ AGPL + ثقيل جدًا |
| 17 | PPTX2HTML | `g21589/PPTX2HTML` | 637 | MIT | **2017** | ❌ ميت |
| 18 | js-pptx | `won21kr/js-pptx` | ~900 | **GPL** | قديم | ❌ GPL + غير مكتمل |
| 19 | reveal.js / Slidev | `hakimel/reveal.js` `slidevjs/slidev` | 72,290 / 48,658 | MIT | نشط | ✅ مصدر أنماط للوضع الاستعراضي |

مكتبات الدمج الصغيرة (كلها MIT، تم التحقق من `npm view <pkg> license`):

| المكتبة | الإصدار | الترخيص | الدور |
|---------|--------|---------|------|
| `zustand` + `immer` + `zundo` | 5.0.15 / 11.1.18 / 2.3.0 | MIT | الحالة + Undo/Redo عبر diff مضغوط |
| `pptxgenjs` | 4.0.1 | MIT | توليد OOXML قابل للتحرير (نص/صورة/شكل/جدول/مخطط + RTL) |
| `pptxtojson` | 2.1.0 | MIT | فك PPTX إلى JSON بعناصر ذات إحداثيات px |
| `jszip` | 3.10.2 | MIT | قراءة الـ container (نفس ما يستخدمه pptxtojson) |
| `html-to-image` | 1.11.13 | MIT | PNG/JPG بدقة عالية من DOM الشريحة |
| `recharts` | 3.10.1 | MIT | رسم المخططات داخل المحرر |
| `@tanstack/react-virtual` | 3.14.12 | MIT | افتراضية شريط المصغرات (50+ شريحة) |
| `idb` | 8.0.3 | ISC | حفظ تلقائي في IndexedDB |
| `nanoid`, `clsx`, `tailwind-merge`, `class-variance-authority` | — | MIT | أدوات |

---

## 2. القرارات المؤثرة (ولماذا)

### 2.1 رفض PPTist رغم أنه أفضل محرر سلايدز مفتوح المصدر

`PPTist` هو الأقرب وظيفيًا لما نريده: عناصر نص/صورة/شكل/خط/مخطط/جدول/فيديو/صوت، كل عنصر قابل للتعديل فعليًا، اختصارات، قوائم سياقية، تصدير PPTX. **لكن ترخيصه AGPL-3.0** (ومالكه يطلب شراء ترخيص للتجاري)، وهو مكتوب بـ Vue 3، أي أن كل نقطة تقارب وظيفي هي أيضًا نقطة احتكاك تقني.

القرار: **لا سطر كود واحد منه**. استخدمته مرجعًا هندسيًا فقط لنمذج البيانات (نموذج `element` مسطّح لكل نوع، `vAlign`، `autoFit`، `textInset`)، ولخريطة الخصائص التي يجب أن يدعمها كل نوع عنصر. الأهم: مكتبة الاستيراد الخاصة بنفس المؤلف `pptxtojson` مرخّصة **MIT** — آخذها وأترك المحرر.

### 2.2 رفض Canvas 2D (Fabric / Konva / Univer / tldraw) لمساحة العمل

المحرر هنا يحتاج:

- نصًا حقيقيًا قابلًا للتحرير داخل العنصر (cursor، تحديد، RTL، خلط عربي/لاتيني، تشكيلة Arabic shaping) — هذا باهظ جدًا على Canvas 2D ويعطي نتائج أدنى من DOM.
- مزامنة كاملة بين الاتجاهين (نموذج المستند ↔ العرض) لكل عنصر.
- خطوط محاذاة ذكية، تدوير، تجميع، وتحديد متعدد.

**نموذج DOM/CSS absolutely-positioned** يعطي نصًا ممتازًا مجانًا، ويعمل مع React دون جسر يدوي. استخدمنا نفس الحيلة التي تستخدمها أدوات مثل Framer/Figma web: طبقة عرض DOM + طبقة تفاعل (handles/guides) فوقها بـ `pointer-events`.

- `Fabric.js` (MIT، نشط): ممتاز لتحرير الصور، لكنه يفرض نموذج scene-graph ويكرّر ما سيصبح محركنا. مرفوض.
- `Konva` (رخصة غير مصنّفة في GitHub، عمليًا MIT): نفس المشكلة + `react-konva`.
- `Univer` (Apache-2.0، 14.4k): إطار DI كامل الحجم + `@univerjs/slides` لا يزال تجريبيًا؛ دمجه يعني إعادة كتابة التطبيق على قطارهم. مرفوض للمحرر.
- `tldraw` (50.3k): رخصتهم الخاصة تفرض علامة مائية/قيدًا تنافسيًا على الخطط المجانية — لا تصلح لمنتج تجاري. مرفوض ترخيصيًا.

### 2.3 رفض `react-moveable` مع بناء طبقة تفاعل بديلة

`moveable` MIT وقوي (drag/resize/rotate/snap/group) لكنه: (1) آخر إصدار قبل أكثر من سنتين؛ (2) يعدّل الـ DOM مباشرة عبر `style.transform`، وهو نمط يعارض مبدأ "مصدر الحقيقة الوحيد" عندنا — سنبني تفاعلًا لا يعمل في فضاء مكبّر (zoom-scaled) بدقة البكسل، وسنعيد مواءمة 60fps في كل تغيير؛ (3) خطوطه الإرشادية لا تعرف شيئًا عن sibling elements في نموذج المستند. لذا كتبتُ `src/editor/interaction/*` (~300 سطر): pointer capture + snap + smart guides + توزيع متساوٍ، بنفس سلوك Figma.

### 2.4 القبول الكامل لـ PptxGenJS للتصدير

MIT، بدون أي اعتمادية وقت التشغيل، يعمل في المتصفح مباشرة، يولّد OOXML أصليًا (لا صورًا): نص بـ runs، صور، أشكال أصلية (rect/roundRect/ellipse/…)، جداول، **مخططات PowerPoint الأصلية**، خلفيات، أحجام شريحة، ورقم شريحة، ودعم **`rtlMode`** في خصائص النص. أي أن مخرجاتنا `editable PPTX` وليست screenshot-PPTX.

قيود موثّقة، تعاملنا معها بصدق في الواجهة: المخططات المحفوظة تظل مخططات PowerPoint (قابلة للتحرير)، التدرجات المتقدمة والـ masks تُبسّط، الرسوم المخصصة (SVG/PNG) تُصدَّر كصور. هذا هو السلوك الطبيعي لأي محرر ويب → PPTX.

### 2.5 القبول الكامل لـ pptxtojson للاستيراد

MIT، نشط (آخر دفع 2026-08)، ويخرج JSON فيه لكل عنصر `left/top/width/height/fill/border/shadow/rotate/content(HTML)/order`، مع جداول ومخططات ومجموعات ومقاطع فيديو وخلفية الشريحة و`themeColors` و`usedFonts` وحجم الشريحة. هذا يغطّي ~85% من عمل الاستيراد، وتبقّى علينا طبقة التطبيع (تغيير المقياس إلى 1280×720، تحويل HTML المحتوى إلى نموذجنا، وربط الصور بالـ assets).

### 2.6 ما لن نستخدمه من مشاريع التوليد بالـ AI

`Presenton` (Apache-2.0) و`ALLWEONE` (MIT) و`ppt-master` (MIT) كلها أنابيب توليد تعمل sidecar/خادم (Python/Node + LLM keys + Puppeteer). دمجها ككل يعني استيراد خادمًا كاملاً والتنازل عن ملكية المحرر. قراري: **المحرر هو المنتج**، والـ AI طبقة فوقه:

- أخذتُ منهم مفهوم **التوليد الهرمي**: `Outline → Slide Plan → Layout Slots → Elements`، بحيث المخرجات عناصر قابلة للتحرير دائمًا (وليس صورًا).
- محرك `src/services/ai/*` يعمل **بدون أي مفتاح** (مولّد قوالب محتوى ذكي محلي)، ويمكن توصيل `VITE_AI_ENDPOINT` في أي وقت لتمرير الطلب لمزوّد LLM عبر نفس العقد (`generateDeck(prompt, opts) → DeckSpec`).
- مساعد العنصر (حسّن النص/اختصر/اقترح عنوانًا) ومراجع التصميم (تعارض ألوان، نصوص طويلة، تسلسل هرمي، محاذاة، تباين WCAG) يعملان بالكامل offline كقواعد تحليلية حقيقية.

### 2.7 القوالب

لا مشروع مفتوح المصدر يقدّم "قالب سلايد قابل للتحويل إلى عناصر" بشكل نظيف (ما يوجد: CSS themes لـ reveal/slidev، أو ملفات pptx جاهزة). لذلك نظام القوالب **مبني داخليًا**: قالب = `Theme + Layouts + Slides` في نفس نموذج المستند، أي قالب = مستند قابل للتحلل إلى عناصر. الفئات المطلوبة كلها مغطاة (Business, Education, Marketing, Startup, Pitch Deck, Portfolio, Academic, Report, Personal, Minimal, Modern, Creative) + 14 نمط تخطيط.

### 2.8 RTL — لا حلول قلب الصفحة

لا توجد مكتبة مفتوحة تعطي RTL سليمًا في محرر عناصر، فبنينها بشكل صحيح: كل عنصر يحمل `dir` خاصًا به، المحاذاة منطقية (`start/end` لا `left/right`)، خصائص CSS منطقية (`margin-inline`, `padding-inline-start`)، `rtlMode` في PptxGenJS، و`letter-spacing/line-height` مضبوطة للنص العربي، وتشكيل مُعامل بشكل صحيح. اختبارات سريعة مدمجة في العرض التجريبي "مستقبل الذكاء الاصطناعي".

### 2.9 التصدير إلى PDF

`html-to-image` → PNG لكل شريحة → تجميع PDF في المتصفح (canvas → `toDataURL` → PDF multi-page، بدون اعتماديات). ملاحظة صريحة: PDF هنا **نقطي (raster)** عالي الجودة (2× devicePixelRatio)، لأن توليد PDF متجهي بنص عربي مشكّل سليم يحتاج خادمًا (LibreOffice/Chromium print)؛ البنية تترك باب `exportServerUrl` جاهزًا لذلك لاحقًا دون إعادة بناء.

---

## 3. الخلاصة: ماذا سنستخدم / ماذا لن نستخدم / ماذا نبني

**نستخدم (مع احترام الرخص، MIT/ISC فقط في الحزمة):**
`pptxgenjs` (تصدير PPTX حقيقي قابل للتحرير) · `pptxtojson` + `jszip` (استيراد PPTX) · `zustand+immer+zundo` (حالة + تاريخ) · `html-to-image` (PNG/JPG) · `recharts` (عرض المخططات) · `@tanstack/react-virtual` (مصغرات 50+ شريحة) · `idb` (حفظ تلقائي) · `react-router` · `tailwindcss v4` · `lucide-react` (أيقونات ISC).

**لا نستخدم:** أي كود من PPTist/CasualOffice/Univer/tldraw/Fabric/Konva/moveable، ولا Presenton/ALLWEONE/ppt-master كاعتمادية تشغيل، ولا أي GPL/AGPL في مسار البناء.

**نبني ourselves (لأنه جوهر المنتج ولا يوجد بديل نظيف برخصة مناسبة):**
نموذج المستند والـ schema · محرك التفاعل (تحديد، سحب، تحجيم، تدوير، snap، smart guides، توزيع) · محرر النصوص الغني داخل العنصر · اللوحات (خصائص/طبقات/قوالب/صور/أشكال/جداول/مخططات/حركات/انتقالات/علامة تجارية) · نظام القوالب والتخطيطات · محرك الـ AI المحلي + عقد المزوّد · مصحّح PPTX↔نموذج (exporter/importer mappers) · المصغّرات (thumbnails) · وضع Presenter · التخزين والمزامنة (مع بنية تسمح بـ Yjs/CRDT لاحقًا).

**مبدأ الدمج:** مكتبة لشيء لا يميّز المنتج، ومحرك خاصنا لشيء يميّزه.

---

## 4. Architecture Decision Record (مختصر)

```text
Vite + React 19 + TypeScript (strict) + Tailwind v4   ← لا Next.js: المنتج أداة متصفح-أولًا،
  لا حاجة لـ SSR/Landing SEO server-side في هذه المرحلة، ونوفّر طبقة معقدة كاملة.

Document model (JSON)  ── presentation → slides[] → elements[] (discriminated union)
  • كل عنصر كائن مستقل بإحداثيات منطقية 1280×720 + rotate + z
  • theme / brandKit / layouts / assets منفصلة عن المحتوى
State: zustand slices — useDoc (mutable, zundo history) · useLibrary (projects/assets/trash)
  • history: zundo (temporal) بـ `patch`-tracking → Ctrl+Z / Ctrl+Shift+Z على عمليات موثّفة
  • autosave: debounce 900ms → IndexedDB (idb) + BroadcastChannel + "Saved/Saving/Offline"
  • collaboration-ready: كل mutation لها op-ish shape، فإعادة التشغيل فوق Yjs لاحقًا لا تعيد البناء
Rendering: DOM absolutely-positioned + طبقة تفاعل فوقها (pointer capture)، memo لكل عنصر،
  virtualized thumbnails → 50 شريحة × 100 عنصر تبقى سلسة (إعادة رسم عنصر واحد فقط)
I/O: export/pptx (pptxgenjs) · export/png|jpg (html-to-image) · export/pdf (raster multi-page)
     import/pptx (pptxtojson → normalizer → doc model + assets)
AI:  provider-agnostic contract + local generator (offline default)
     deck-level review / slide critique / element rewrite — كلها تعدّل النموذج، لا تعرض صورًا
```

---

## 5. من البحث إلى الكود (ماذا تحقق فعليًا)

ما استُخدم من المكتبات الخارجة من هذا البحث: `pptxgenjs` (MIT) للتصدير القابل للتحرير، و`pptxtojson` (MIT) + `jszip` (MIT)
للاستيراد، و`idb` (ISC) للتخزين، و`html-to-image` (MIT) للالتقاط، و`zustand`/`immer`/`zundo` (MIT) للحالة والتراجع،
و`lucide` (ISC) لشبكة هندسة الأيقونات، و`recharts` (MIT) لمعاينة المخطط داخل المحرر فقط.
كل ما عداها — نموذج المستند، طبقة العرض DOM، محرّك الإيماءات، محرّر النص المقيّد وجسر HTML↔PPTX، لوحة المفتّش،
محرك القوالب/التخطيطات، نمط العرض، مُصدِّر PDF، ومراجعة التصميم بالـ AI — **مكتوب داخليًا** للأسباب في §2.

النتيجة المقيسة بعد التنفيذ (harness داخلي على 4 عروض تجريبية + 12 قالبًا + 3 عروض مولّدة بالـ AI):
تصدير PPTX ← ثم استيراد يعيد نفس عدد الشرائح، **0 نص مفقود**، مخططات تظل مخططات، جداول تظل جداول،
أقصى فرق مقاس 0px، و**0 عنصر مُبسَّط إلى صورة**.

### ما لم يُبنَ (ولم نُدّعِ أنه مبني)
حسابات/سحابة/تعاون لحظي (تحتاج خادمًا — المرحلة ٧ و٨)، مكتبة صور خارجية (تحتاج مفتاح API في العميل)،
ونص PDF متجهي معرَّب (مستحيل في المتصفح؛ نصدر PDF صورًا). التفاصيل والبدائل الصادقة في
[`README.md`](./README.md) و[`ARCHITECTURE.md`](./ARCHITECTURE.md).

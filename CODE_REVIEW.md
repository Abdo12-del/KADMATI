# مراجعة الكود — أوروفا ستوديو (KADMATI)

> تاريخ المراجعة: 2026-09-16 · الفرع: `arena/01a0a962-kadmati` · عند `f7baf92`
> نطاق المراجعة: قراءة ثابتة للكود + تشغيل فعلي لـ `typecheck` / `build` / `test:anim` / `test:pdf` / `test:model` + خادم التطوير.

---

## 0. الحالة الصحية (بعد التشغيل الفعلي)

| الأمر | النتيجة |
|---|---|
| `npm install` | ✅ 201 حزمة، 10s |
| `npm run typecheck` | ✅ نظيف تمامًا (`strict` + `noUnusedLocals` + `noUnusedParameters`) |
| `npm run build` | ✅ ينجح في 2.1s — **مع 6 تحذيرات `INEFFECTIVE_DYNAMIC_IMPORT`** |
| `npm run test:anim` | ✅ 474 تأكيدًا، 0 فشل |
| `npm run test:pdf` | ❌ **يفشل من أول تشغيل** (يحتاج `test:pdf:fixtures` قبله) → ثم ✅ 54 تأكيدًا |
| `npm run test:model` | ✅ 581 مثالًا، 0 فشل، بوابة stub سليمة |
| `npm run dev` | ✅ يعمل على `0.0.0.0:5173`، `allowedHosts: true` |

حجم المشروع: 105 ملفًا في `src/` (45 مكوّن React)، ~28 ألف سطر TS/TSX، ولا سطر `TODO/FIXME` ولا `as any` ولا `@ts-ignore` في الكود كله.

---

## 1. ما كُتب بشكل جيد فعلًا (لا تُغيّره)

1. **مسار عرض واحد** — `render/SlideView → ElementView → {TextContent,ChartView}` هو ما تراه الشاشة وما يُصدَّر وما يُصغَّر. لا يوجد مسار رسم ثانٍ ينحرف عن النموذج. هذا أصعب قرار معماري في هذا النوع من المشاريع، وهو متخذ بشكل صحيح.
2. **النموذج مستند JSON واحد** (`document/types.ts`) بلا مراجع دائرية ولا حالات مشتقة — وهذا وحده ما يجعل Undo/Redo والحفظ التلقائي والتعاون المستقبلي ممكنة بلا إعادة كتابة.
3. **تاريخ التراجع مُهذّب**: `zundo` يتتبع `{ doc }` فقط، و`beginTransaction/endTransaction` تضغط الإيماءة المتصلة (سحب/تكبير/كتابة) إلى خطوة واحدة. تفصيل نادر التنفيذ بهذا النظافة.
4. **الصدق في التوثيق** — جدول «ما لم نبنِه ولماذا»، وتقرير `rasterized[]` عند التصدير، و`report.approximated` عند الاستيراد. لا أزرار لا تعمل.
5. **أمان المفاتيح**: مفاتيح AI في المتصفح فقط، وخادم Aurova يحمل مفتاح الـ upstream من جهته (العميل لا يراه) مع تحديد معدّل وحجم جسم.
6. **RTL حقيقي**: خصائص منطقية (`margin-inline`، `inset-inline-start`)، `dir` لكل فقرة، `text-align: start/end` — لا نسخة معكوسة من التخطيط.
7. **تحميل كسول صحيح** لـ `tesseract.js` و`pdfjs-dist` وخدمات AI (`generate/refine/review/feedback`) — كلها `import()` ديناميكي حقيقي.

---

## 2. P0 — أمان: المُطهِّران (sanitizers) قابلان للالتفاف

المشتركان: ملف PPTX مستورد، أو SVG ملصوق، أو ردّ من نموذج AI. التطبيق يعمل محليًا وبيانات المستخدم في متصفحه — لكن «محلي» لا يعني «آمن»: الملف يصل من بريد أو من زميل، والـ HTML الناتج يُخزَّن في IndexedDB ويُحقن لاحقًا عبر `innerHTML`.

### 2.1 `sanitizeHtml` — `src/document/text.ts:31`

المشكلة: عند مواجهة وسم غير مسموح، الكود **يفكّه** (ينقل أبناءه إلى الأب) ثم `continue` — لكن الحلقة تعمل على لقطة `Array.from(node.children)`، فالأبناء المنقولون **لا يُزارون أبدًا**. أي وسم مغلَّف داخل غير مسموح يمرّ بلا فحص.

أدلة مقاسة (jsdom، السلوك الحقيقي):

```
"<div><span onclick=\"alert(1)\">x</span></div>"
   => "<span onclick=\"alert(1)\">x</span>"                    ← نجا
"<section><a href=\"javascript:alert(1)\">y</a></section>"
   => "<a href=\"javascript:alert(1)\">y</a>"                  ← نجا
"<div><b>bold</b><img src=x onerror=\"alert(1)\"></div>"
   => "<b>bold</b><img src=\"x\" onerror=\"alert(1)\">"        ← img لم يُحذف أصلًا
"<p onclick=\"alert(1)\">direct</p>"
   => "<p>direct</p>"                                          ← هذا فقط صحيح
```

مسارات الدخول: `services/importPptx.ts:584` (`tidyTextHtml` → يُخزَّن في النموذج) · `services/ai/refine.ts:48` · لصق HTML داخل `contentEditable`.

الإصلاح: بدل فكّ الوسم داخل الحلقة، ابنِ شجرة جديدة (أو استخدم `TreeWalker` يعيد التجميع بعد التعديل)، وزُر الأبناء صريحًا بعد النقل؛ وأضف `IMG/IFRAME/OBJECT/EMBED/SVG/MATH` إلى قائمة الحذف الصريح.

### 2.2 `sanitizeSvg` — `src/render/ElementView.tsx:259`

يزيل فقط `<script>…</script>` والسمات `on*` **بعلامتي تنصيص مزدوجتين**. مقاسة:

| المدخل | النتيجة |
|---|---|
| `<rect onload='alert(1)'/>` | نجا (تنصيص مفرد) |
| `<a href="javascript:alert(1)">` | نجا |
| `<foreignObject><img src=x onerror=alert(1)>` | نجا كاملًا |
| `<animate attributeName="href" values="javascript:…">` | نجا |
| `<script>alert(1)</script>` | ✅ أُزيل |

الإصلاح: إزالة كل سمة تبدأ بـ `on` بصرف النظر عن التنصيص، حظر `foreignObject/script/iframe/use/animate/set/handler`، وتطهير كل `href`/`xlink:href` لا يبدأ بـ `#` أو `data:image/`.

### 2.3 مسارات `innerHTML` غير مُطهَّرة أصلًا

- `src/editor/RightPanel.tsx:283` — بعد `document.execCommand` يُكتب `node.innerHTML` **خامًا** في النموذج.
- `src/render/TextContent.tsx:39,47` — مسار النموذج → DOM يعيّن `innerHTML = html` بلا تطهير (المطهِّر يُستدعى فقط في `onInput`). أي محتوى دخل النموذج من استيراد/AI يُعرض كما هو.

الإصلاح: التطهير عند **الدخول إلى النموذج** (نقطة واحدة) لا عند العرض — أي في `updateElementText` داخل `store/useDoc.ts:559`.

---

## 3. P1 — `npm run test:pdf` معطوب كما هو مكتوب

```json
"test:pdf": "node tests/pdf/build.mjs && node .tmp-verify/pdf-test.mjs"
```

الاختبار يقرأ `/tmp/pdf-fixtures/*.pdf` غير الموجودة → `ENOENT` عند أول تشغيل على أي جهاز جديد (وعلى CI). موجّه التوليد موجود لكنه في سكربت منفصل (`test:pdf:fixtures`) لا يستدعيه أحد.

الإصلاح: `"test:pdf": "node tests/pdf/fixtures.mjs && node tests/pdf/build.mjs && node .tmp-verify/pdf-test.mjs"`.

**وما هو أخطر:** لا توجد أي وظيفة CI تُشغّل الاختبارات على `main`. `deploy-pages.yml` يُشغّل `tsc` و`vite build` فقط، و`model.yml` يُشغّل `test:model` فقط. أي انحدار في `test:anim` (474 تأكيدًا) أو `test:pdf` (54) لن يُكتشف إلا يدويًا.

---

## 4. P2 — الأداء: حزمة `lucide` كاملة داخل حزمة الدخول

`src/lib/iconLibrary.ts:6`:

```ts
import * as lucide from 'lucide'
```

ثم الوصول الديناميكي `lucide[key]` — لا يمكن لأي مُهزِّز (tree-shaker) معرفة أيقونة مطلوبة، فتُضمَّن المجموعة كاملة.

قياس فعلي: **جميع أيقونات lucide الـ 1861 موجودة في `dist/assets/index-BMd_NmKK.js`** (حجمها 1.356 MB / 396 KB gzip). وحزمة `import * as lucide` وحدها = **453 KB خام / 100 KB gzip** → أي ≈ 25٪ من حجم النقل الأولي تذهب لأيقونات لا تُرسم.

الإصلاح: استيراد الأيقونات المستخدمة فقط (`lucide/icons/<name>` أو خريطة ثابتة صريحة) بدل استيراد المساحة الاسمية. هذا أكبر مكسب أداء متاح في المشروع، بتغيير ملف واحد.

**تحذيرات البناء الست `INEFFECTIVE_DYNAMIC_IMPORT`** — `exportPptx` يستورد `shapes`/`colors` ديناميكيًا بينما يستوردهما غيره statically، و`Dialogs` يستورد `html-to-image` ديناميكيًا بينما يستورده `exportImages`/`exportPptx`/`autosave` statically. نيّة التحميل الكسول موجودة لكنها لا تُنفَّذ: لا تتحرك الوحدات إلى حزم منفصلة.

---

## 5. P3 — فجوات تغطية الاختبارات

الموجود: `tests/animations/` (474) و`tests/pdf/` (54). غير الموجود — وهو **جوهر المنتج**:

- نموذج النص: `htmlToBlocks` ⇄ PPTX runs، `sanitizeHtml` (القسم 2 أعلاه كان ليُكتشف باختبار واحد)، `countWords`/ RTL.
- `document/geometry.ts`: الالتقاط (snap)، المحاذاة/التوزيع، الدوران.
- دورة PPTX تصديرًا ← استيرادًا. `ARCHITECTURE.md §6` يدّعي «14 عرضًا… أقصى فرق 0px»؛ هذا الـ harness **غير موجود في المستودع**، فالادعاء غير قابل للتحقق. إما إضافته أو تعديل الصياغة.
- `templates/engine.ts` (12 قالبًا، 16 تخطيطًا) والمخطِّط المحلي في `ai/generate.ts`.
- `jsdom` مضافة أصلًا في `devDependencies` وغير مستخدمة — جاهزة لاختبار `document/*` دون متصفح.

---

## 6. P3 — ملاحظات متفرقة

| # | الملف | الملاحظة |
|---|---|---|
| 1 | `.gitignore` | `.tmp-verify/` مكرّر مرتين |
| 2 | `server/aurova-gateway.mjs:26` | خريطة `hits` (تحديد المعدل) تنمو بلا حدّ — كل IP جديد يبقى في الذاكرة للأبد. تحتاج كنسًا دوريًا للسجلات القديمة |
| 3 | `src/document/text.ts:32` | `sanitizeHtml` ترجع النص كما هو إذا لم يكن `window` موجودًا — مسار غير آمن صامت عند أي استخدام في worker/SSR مستقبلًا |
| 4 | الوصولية | 6 ملفات فقط فيها `aria-label` من 45 مكوّنًا. المحرر لا يعمل بلوحة المفاتيح وحدها (لا مسار لإضافة/تحريك عنصر)، و`contentEditable` يأخذ `role="textbox"` أثناء التحرير فقط |
| 5 | `package.json` | الاعتمادان `lucide` و`lucide-react` معًا؛ الأول يُستخدم في ملف واحد فقط (وهو سبب مشكلة القسم 4) |
| 6 | التوثيق | `README.md`/`ARCHITECTURE.md` ممتازان ودقيقان فيما يخصّ الكود الموجود، لكن ادّعاءات القياس (§6، §9، «0 عناصر مبسّطة») بلا harness مُودَع |

---

## 7. ترتيب مقترح للعمل

| الأولوية | العمل | الأثر |
|---|---|---|
| 1 | إصلاح `sanitizeHtml` + `sanitizeSvg` + التطهير في `updateElementText` | يسدّ ثغرات XSS قابلة للاستغلال بملف مستورد |
| 2 | إصلاح سكربت `test:pdf` + تشغيل `test:anim`/`test:pdf` في CI | يوقف الانحدار الصامت |
| 3 | استبدال `import * as lucide` باستيراد صريح | −100 KB gzip من الحمل الأولي |
| 4 | اختبارات وحدة لـ `document/text.ts` و`geometry.ts` (بـ jsdom) | يمنع تكرار ثغرات القسم 2 |
| 5 | إيداع harness دورة PPTX أو تعديل صياغة الادعاء | يجعل التوثيق قابلًا للتحقق |
| 6 | كنس خريطة تحديد المعدل + إزالة التكرار في `.gitignore` | نظافة |

---

## 8. كلمة أخيرة

المشروع أعلى من المتوسط بوضوح: طبقات نظيفة، قرارات موثّقة، بلا ديون تقنية مخفية، والبناء يمرّ نظيفًا. المشكلات المدرجة أعلاه ليست عيوب تصميم — هي **ثغرات في حالتين من المُطهِّرات، وسكربت اختبار ناقص، واستيراد واحد يجرّ 453 KB**. كلها قابلة للإصلاح في جلسة واحدة دون المساس بالمعمارية.

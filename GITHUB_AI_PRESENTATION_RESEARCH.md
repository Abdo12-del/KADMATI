# GITHUB AI PRESENTATION RESEARCH — بحث تقني قبل تنفيذ AI Presentation Generator

> التاريخ: 2026-09-15 · الهدف: اختيار ما نُعيد استخدامه وما نبنيه بأنفسنا قبل كتابة كود الميزة.
> القاعدة الحاكمة من المالك: **Existing Editor + AI Generation Engine** — لا محرر ثانٍ، ولا نسخ لمشاريع كاملة.

---

## 1. المشاريع المفحوصة

| # | المشروع | الرخصة | اللغة/المنصة | النجوم ≈ | ما هو |
|---|---|---|---|---|---|
| 1 | **Presenton** — [presenton/presenton](https://github.com/presenton/presenton) | Apache-2.0 | TypeScript (Next.js) + Python (FastAPI) | 10.2k | مولّد عروض AI مفتوح المصدر + Presentation API، PPTX/PDF/PNG قابلة للتعديل |
| 2 | **Microsoft Presentations** — [microsoft/presentations](https://github.com/microsoft/presentations) | MIT | Python | — | توليد PPTX من ملف `.spec.md` (Specification → Presentation)، مع Animations وAI visuals وملاحظات متحدث |
| 3 | **PptxGenJS** — [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) | MIT | TypeScript، بلا تبعيات runtime | 6.1k | مكتبة بناء OOXML من JavaScript — **مستخدمة أصلًا في كدماتي كطبقة التصدير** |
| 4 | **PPTAgent** — [icip-cas/PPTAgent](https://github.com/icip-cas/PPTAgent) | MIT | Python | بحثي (EMNLP 2025) | إطار Agentic لتوليد عروض بالتحرير: تحليل عرض مرجعي → outline → تعديل تدريجي |
| 5 | **Ollama** — [ollama/ollama](https://github.com/ollama/ollama) | MIT | Go | — | تشغيل نماذج محليًا مع **Structured Outputs عبر JSON Schema** (`format:`) وواجهة OpenAI-compatible على `/v1` |
| 6 | **llama.cpp** — [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | MIT | C/C++ | — | استنتاج محلي GGUF مع GBNF grammar constraints — الخيار الأدنى مستوى |
| 7 | **vLLM** — [vllm-project/vllm](https://github.com/vllm-project/vllm) | Apache-2.0 | Python | — | خدمة نماذج للخوادم (throughput عالٍ)، guided decoding، OpenAI-compatible |
| 8 | **LocalAI** — [mudler/LocalAI](https://github.com/mudler/LocalAI) | MIT | Go | — | بديل OpenAI ذاتي الاستضافة (نص/صورة/صوت) — واجهة موحّدة |
| 9 | **Slidev / Marp / reveal.js** | MIT | JS | — | عروض من Markdown — للفحص المعماري فقط (تُصدّر HTML/PDF/PPTX نصيًا محدودًا) |

---

## 2. تحليل معماري لكل مشروع

### 2.1 Presenton (Apache-2.0) — الأهم في الفحص

**المعمارية:** Next.js (واجهة تحرير Drag-edit خاصة به) + FastAPI (توليد وتصدير) + `pptxgenjs` للتصدير. القوالب **HTML + Tailwind** تُحوَّل إلى عناصر PPTX. يفصل: `prompt → outline (JSON) → slide-by-slide generation (JSON لكل شريحة) → template rendering → pptx export`.

| المحور | ما وجدناه | القرار |
|---|---|---|
| AI workflow | Outline أولًا ثم توليد شريحة-شريحة بعقد JSON صارم لكل شريحة | ✅ **نتبنّى النمط** (مطابق لما تبنيه المنصة: Plan → SlidePlan) |
| AI provider abstraction | Ollama / LM Studio / OpenAI / Gemini / Anthropic / أي OpenAI-compatible (BYOK) | ✅ **نتبنّى النمط** — طبقة `AIProvider` بمزودات قابلة للتبديل |
| Local AI | Ollama مدعوم رسميًا، "Runs locally — all processing on your device" | ✅ يؤكد صحة اختيار Ollama كـ Local Runtime |
| Template system | HTML/Tailwind قوالب — **يتطلب محرك عرض HTML** | ❌ لا نستورده — قوالبنا عناصر JSON حقيقية (أولوية المنصة: Editable Elements لا HTML) |
| Editor | محرر خاص به داخل المستودع | ❌ **ممنوع** — محرر كدماتي هو تجربة المستخدم الوحيدة (قاعدة 0.5) |
| PPTX generation | `pptxgenjs` في مسار التصدير | ✅ نطابق القرار: Layer = Presentation JSON → Renderer → PptxGenJS |
| Images | DALL-E 3 / Gemini Flash / Pexels / Pixabay كمصادر اختيارية | 💡 نتبنّى الفكرة كـ "مصادر صور اختيارية لاحقًا"؛ اليوم فنّ SVG محلي ثيمي (بلا إنترنت وبلا مفاتيح) |
| وثائق API | REST API لتوليد العروض | 💡 فكرة مستقبلية لطبقة `storage.ts` الخلفية، لا مكانها الواجهة |

**Integration difficulty:** عالية كحزم كاملة (خادم Python + Next.js + Docker) — **مستحسنة كأنماط معمارية فقط**. لا تعارض تراخيص (Apache-2.0 آمنة مع نسب الملكية إن نُسخ كود فعلي؛ نحن نستلهم البنية فقط).

### 2.2 Microsoft Presentations (MIT)

**المعمارية:** `.spec.md` (Markdown + YAML front matter) → Parser → Presentation model → PPTX عبر python-pptx، مع Animations وAI speaker notes وAI visuals. الفكرة الجوهرية: **العرض "كود" قابل للنسخ والفرق (diffable) والتكرار (reproducible)**.

- ✅ نستلهم: **فصل Content (spec) عن Design (layout/theme) عن Output (pptx)** — وهو أصلًا فصل كدماتي (`DeckSpec → instantiateDeck → exportPptx`)؛ يشدّدنا على إبقاء الـ AI يكتب `DeckSpec` لا عناصر يدوية.
- ✅ نستلهم: speaker notes تُولَّد لكل شريحة (عندنا حقل `notes` جاهز لكل Slide).
- ❌ لا نستورد: python-pptx / CLI — بيئتنا متصفح 100%، ولدينا `exportPptx.ts` أعمق (نص↔runs، مخططات أصلية قابلة للتحرير، جداول، أشكال).
- تعارضات: لا شيء (MIT).

### 2.3 PptxGenJS (MIT) — مدمج أصلًا

- نعمعه اليوم في `services/exportPptx.ts` بجودة أعلى من الاستخدام النمطي (0 عناصر مبسطة للصور في العروض المرجعية).
- ✅ القرار: **يبقى طبقة التصدير الوحيدة**، ولا يلمس الـ AI أبدًا XML/OOXML مباشرة.
- 🔧 تعديل مطلوب منّا: جعل تخطيط الصفحة (Layout) مقيّسًا حسب `doc.size` (دعم 4:3 = 10×7.5 بوصة) بدل التثبيت على 13.333×7.5.

### 2.4 PPTAgent (MIT) — بحثي

- ✅ نستلهم فكرتين: (1) **تصنيف الشرائح وظيفيًا** (cover/agenda/content/stats/…) قبل التوليد — نفس `SlideType` عندنا؛ (2) **التوليد كتعديل وليس كتابة من الصفر** — يدعمنا في Regenerate شريحة واحدة دون هدم البقية.
- ❌ لا نستورد: تعتمد python-pptx وHTML rendering وLLM agent loops ثقيلة.

### 2.5 Local AI — Ollama مقابل البدائل

| المعيار | Ollama | llama.cpp | vLLM | LocalAI |
|---|---|---|---|---|
| تركيب على جهاز المستخدم | ✅ سهل جدًا (تطبيق واحد) | ⚠️ يدوي | ❌ خادم GPU | ⚠️ Docker غالبًا |
| Structured JSON | ✅ `format: <json-schema>` مدمج | ⚠️ GBNF يدوي | ✅ guided decoding | ✅ عبر خلفياته |
| OpenAI-compatible | ✅ `/v1` | ⚠️ خادم منفصل | ✅ | ✅ |
| إدارة النماذج/Quantization | ✅ GGUF تلقائي (Q4/Q8) | ✅ يدوي | ⚠️ | ✅ |
| القرار | **الافتراضي** | خيار متقدم لاحقًا عبر نفس Provider Interface | خيار الخوادم لاحقًا | بديل متوافق |

جميعها تدخل من **باب واحد**: `AIProvider` — والتطبيق لا يعرف الفرق.

### 2.6 اختيار النموذج المحلي (مقارنة، ليس شهرة)

المطلوب: Planning + Structured JSON + تلخيص + **عربية/فرنسية/إنجليزية** + اتباع تعليمات + زمن استجابة.

| النموذج | الرخصة | JSON المنظم | العربية | الفرنسية | الحجم (Q4) | القرار |
|---|---|---|---|---|---|---|
| **Qwen3 (8B/14B/30B-A3B)** | Apache-2.0 | ✅ الأفضل في فئته (مدرَّب على structured output، يعمل مع `format` في Ollama) | ✅ قوي جدًا | ✅ قوي (100+ لغة) | 4.6–18GB | ✅ **الافتراضي** |
| Qwen2.5 14B | Apache-2.0 | ✅ ممتاز | ✅ | ✅ | ~9GB | بديل مثبّت |
| Gemma 3/4 (4B–27B) | Gemma Terms | ✅ جيد | ⚠️ متوسط | ✅ | 3–16GB | بديل على أجهزة Apple |
| Llama 3.1 8B | Llama Community | ⚠️ متوسط على schemas متشعبة | ⚠️ | ✅ | ~4.9GB | بديل |
| Mistral / Nemo 12B | Apache-2.0 | ✅ جيد | ⚠️ | ✅ ممتاز | ~7GB | بديل للفرنسية |
| DeepSeek R1 distills | MIT | ✅ لكن reasoning بطيء | ⚠️ | ⚠️ | كبيرة | ❌ بطيء لهذه المهمة |
| gpt-oss:20b | Apache-2.0 | ✅ | ⚠️ | ✅ | ~12GB | بديل 16GB |

**التوصية:** `Qwen3` عائلة افتراضية مع **سلم حسب العتاد** (Hardware-aware):

| العتاد (تقدير) | النموذج المقترح | الذاكرة |
|---|---|---|
| GPU ≥ 16GB VRAM أو RAM ≥ 32GB | `qwen3:14b` | ~9GB |
| GPU ~8GB أو RAM 16GB | `qwen3:8b` | ~5GB |
| CPU فقط / RAM ≤ 8GB | `qwen3:4b` | ~2.6GB |

- Quantization: **Q4_K_M** افتراضيًا (توازن جودة/حجم)، وQ8 للـ 4B على الأجهزة القوية.
- إذا لم يتوفر أي نموذج مناسب → Cloud Provider (OpenAI-compatible) اختياري من الإعدادات. **Fallback دائمًا للمحرك القواعدي المحلي المدمج** حتى لا تتعطل المنصة أبدًا.

---

## 3. جدول قرار الدمج النهائي (0.8)

| المكوّن | المصدر | القرار | السبب |
|---|---|---|---|
| طبقة التصدير PPTX | PptxGenJS | ✅ استخدام (موجود) | MIT، مثبتة، مدمجة بمسار Presentation JSON → Renderer |
| نمط "Outline ثم شريحة-شريحة بعقد JSON" | Presenton | ✅ استلهام النمط | يفصل الفهم عن التوليد ويسمح بـ Preview تدريجي وإعادة توليد جزئي |
| تجريد مزودي AI (BYOK + Ollama + أي OpenAI-compatible) | Presenton (نمط) | ✅ بناؤه لدينا `AIProvider` | لا ارتباط صلب بمزود؛ Ollama محلي أولًا |
| Structured Outputs عبر JSON Schema | Ollama | ✅ استخدام عبر `format:` | يرفع موثوقية JSON جذريًا مقارنة بالـ prompting وحده |
| فصل Content/Design/Output + notes مولّدة | Microsoft Presentations (نمط) | ✅ مطابق لأصولنا | نكتبه في `DeckSpec`/`Slide.notes` الحاليين |
| تصنيف الشرائح وظيفيًا + توليد كتعديل | PPTAgent (نمط) | ✅ استلهام | أساس Slide Types وRegenerate-shriحة-واحدة |
| محرك قوالب HTML/Tailwind | Presenton | ❌ عدم الاستخدام | عناصرنا JSON أصلية أعمق قابلية للتحرير والتصدير النصي |
| محرر Presenton | Presenton | ❌ ممنوع | قاعدة المنتج: محرر واحد فقط |
| python-pptx / CLI | Microsoft | ❌ | بيئة متصفح |
| **نبنيه بأنفسنا** | — | ✅ Planner + Slide Types + Design System + Layout Engine + Quality Rules + Editor integration | هذا هو جوهر المنتج ("Intelligent Presentation Design Engine") ولا يوجد بديل جاهز يحترم نموذج عناصرنا |

**المعمارية الموحدة الناتجة (0.1 / 0.9):**

```
USER PROMPT (+ خيارات: لغة/نوع/جمهور/عدد/نمط/نسبة/Brand Kit)
   ↓ Understanding            (services/ai/generate.ts — brief)
   ↓ AIProvider               (local قواعدي | Ollama | OpenAI-compatible)   ← services/ai/provider.ts
   ↓ Presentation Planner     ← services/ai/planner.ts + schema.ts (JSON Schema + Validate + Repair + Retry)
   ↓ Slide Types              (cover/agenda/divider/content/statistics/comparison/process/timeline/chart/table/quote/image-text/closing)
   ↓ Design System            ← services/ai/design.ts (Theme + Brand Kit + guardPalette)
   ↓ Layout Engine الحالي     ← templates/layouts.ts (LayoutDef.build — لا إحداثيات يدوية من AI)
   ↓ Content Quality Rules    ← services/ai/composer.ts
   ↓ DeckSpec → instantiateDeck() → Presentation (عناصر حقيقية: نص/شكل/مخطط/جدول/صورة)
   ↓ Animation Suggestions    ← services/ai/animate.ts (من محرك الحركة الحالي)
   ↓ EXISTING EDITOR          (تحرير/Regenerate/Design Actions من اللوحة اليمنى)
   ↓ exportPptx (PptxGenJS) / PDF / WEB
```

المشاريع المفتوحة دخلت **كأنماط وقرارات معمارية وطبقة تشغيل محلي (Ollama)** فقط — لا كود منسوخ، لا محرر جديد، لا خادم جديد.

---

## 4. مخاطر وتخفيف

| خطر | التخفيف المنفَّذ |
|---|---|
| JSON غير صالح من المزود | JSON Schema صارم (Ollama `format`) + `validatePlan` + `repairPlan` + Retry مرة واحدة + سقوط للمخطّط المحلي — لا يُكسر التوليد أبدًا |
| نموذج محلي بطيء/غير متاح | كشف فشل الاتصال → fallback (Cloud إن ضُبط، وإلا المحرك القواعدي) + إظهار المصدر للمستخدم |
| جودة عربية/فرنسية أقل محليًا | قواعد جودة لغوية في `composer.ts` (طول النقاط، تكرار العناوين، الكثافة) تُصلح ناتج أي مزود قبل البناء |
| استقلالية الواجهة عن Ollama | الواجهة لا تتصل بـ Ollama مباشرة إلا عبر `provider.ts` في طبقة الخدمات (نفس مبدأ Presenton: الطلبات من الطبقة اللاحقة لا من UI) |
| 4:3 يكسر التخطيطات | إعادة تدوير هندسية `reflowToSize` + تصدير PPTX مقيّس حسب `doc.size` |

## 5. الخصوصية والتكلفة

- المحرك القواعدي المحلي: صفر شبكة، صفر كلفة — يعمل دائمًا.
- Ollama: البيانات لا تغادر الجهاز ("Private AI") — Qwen3 Apache-2.0، Q4_K_M.
- Cloud: اختياري صريح من الإعدادات فقط، ويُستخدم للصياغة الأعمق عند طلبه.
- مهام مرشحة للبقاء محلية دائمًا (حتى مع وجود Cloud): تصنيف الشرائح، اقتراح التخطيط، مراجعة التصميم، اقتراح الحركة — كلها قواعدية على النموذج نفسه، لا تُرسل لأي مكان.

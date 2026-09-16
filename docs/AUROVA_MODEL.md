# Aurova Model — مواصفة النموذج الخاص

هذا المستند يصف العقد بين واجهة Aurova Studio ونموذجنا الخاص `aurova-deck-1`، وما يلزم لبنائه.

## 1. لماذا نموذج خاص؟
- المنصة تطلب من النموذج **الهيكل والنصوص فقط** (JSON)، ثم تبني التخطيط والعناصر محليًا.
  هذا يجعل المهمة ضيّقة جدًا → نموذج صغير مضبوط (fine-tuned) يكفي، ويتفوّق على النماذج العامة في:
  - العربية الفصحى المهنية و RTL دون أخطاء تشكيل/اتجاه.
  - الالتزام الصارم بمخطط `DeckSpec` (kind/title/takeaways/stat/quote/steps).
  - نبرة العروض: عنوان = فكرة لا تسمية قسم، ٢–٤ نقاط، لا حشو.
- لا مفتاح من المستخدم ولا إرسال بيانات لطرف ثالث.

## 2. واجهة الاتصال (Wire)
متوافقة مع OpenAI Chat Completions حتى تعمل بنفس عميل `services/ai/providers.ts`:

```
POST {AUROVA_GATEWAY_URL}/v1/chat/completions
{
  "model": "aurova-deck-1" | "aurova-deck-1-mini",
  "temperature": 0.5,
  "response_format": {"type": "json_object"},
  "messages": [{"role":"system","content":"..."},{"role":"user","content":"..."}]
}
→ { "choices": [ { "message": { "role":"assistant", "content": "<json string>" } } ] }
```

- المتصفح يستدعي `/api/aurova/v1/chat/completions` (مسار نسبي). في التطوير يمرّره Vite إلى
  `AUROVA_GATEWAY_URL`؛ في الإنتاج يمرّره الـ reverse proxy. يمكن تجاوز ذلك بـ `VITE_AUROVA_API_URL`.
- البوابة (gateway) مسؤولة عن: المصادقة بجلسة المستخدم، الحدّ من المعدّل، والتسجيل — **لا** مفاتيح في المتصفح.

## 3. المهام التي يخدمها النموذج
| المهمة | الملف | المدخل | المخرج |
|---|---|---|---|
| توليد هيكل عرض + تصميم | `generate.ts → providerOutline` | موضوع، فئة، جمهور، نبرة، عدد | `{"slides":[{kind,title,takeaways,stat?,quote?,steps?,compare?,timeline?, layout?,image?,bg?,notes?,takeaway?}]}` — حقول التصميم من مجموعات مغلقة ويتحقق منها المحرر |
| إعادة صياغة نص | `refine.ts → providerRewrite` | نص + عملية (improve/shorten/formal/title) | نص فقط |
| مراجعة عرض (لاحقًا) | `review.ts` | Issues محلية | Issues مُثراة |

## 4. بيانات التدريب

> **منفَّذ**: خط الإنتاج الكامل في `model/` (dataset → distill → train → eval → serve). انظر `model/README.md`.

### الخطة الأصلية
1. **Instruction pairs** من قوالبنا: كل `DeckSpec` في `templates/catalog.ts` و`demo/decks.ts` يُعكس إلى
   (موضوع + فئة) → JSON. هذا يعطي أمثلة "ذهبية" ملتزمة بالمخطط.
2. **توسيع اصطناعي**: توليد مواضيع متنوعة (أعمال/تعليم/تسويق/أكاديمي/تقرير) بنموذج كبير ثم تصفية
   المخرجات بمدقّق المخطط `normalizeProviderSlide` قبل قبولها.
3. **إعادة الصياغة**: أزواج (قبل/بعد) للعمليات الأربع، مع قيود الطول التي يفرضها `acceptable()`.
4. تنويع لغوي: 60% عربي، 30% إنجليزي، 10% فرنسي؛ أرقام عربية/هندية؛ مصطلحات لاتينية داخل نص عربي.

## 5. النموذج الأساسي وخطة الضبط
- أساس مقترح: نموذج مفتوح 7–9B متعدّد اللغات قوي بالعربية (مثل Qwen2.5-7B-Instruct أو Gemma 2 9B)،
  ونسخة Mini 1.5–3B لإعادة الصياغة.
- ضبط LoRA/QLoRA على مهمة JSON مقيّدة + **decoding مقيّد بالمخطط** (grammar/JSON schema) في البوابة.
- خدمة عبر vLLM أو llama.cpp server (كلاهما يقدّم واجهة OpenAI-compatible جاهزة)، خلف البوابة.

## 6. التقييم
- نسبة JSON صالح 100% (بعد التقييد).
- اجتياز `normalizeProviderSlide` بدون إسقاط شرائح ≥ 98%.
- تقييم بشري للعربية على 200 عرض: العنوان فكرة؟ النقاط قصيرة؟ لا اختلاق أرقام؟
- مقارنة A/B داخل الاستوديو عبر مبدّل المصدر في الإعدادات.

## 7. البوابة `server/aurova-gateway.mjs`
خادم Node بلا تبعيات يقدّم `POST /v1/chat/completions` و`GET /health` و`GET /v1/models`:
- **وضع stub** (افتراضي): يردّ بهياكل حتمية — يكفي لتجربة الواجهة كاملة دون GPU.
- **وضع upstream**: يمرّر إلى أي خادم متوافق مع OpenAI (vLLM / llama.cpp / TGI) ويحتفظ بالمفتاح على الخادم،
  مع تحديد معدّل لكل IP وسقف لحجم الطلب وربط أسماء النماذج (`aurova-deck-1` → اسم checkpoint الفعلي).

```bash
npm run gateway                     # stub على :8787
npm run dev                         # Vite يمرّر /api/aurova → :8787
# مع نموذج حقيقي:
vllm serve Qwen/Qwen2.5-7B-Instruct --served-model-name aurova-deck-1 --port 8000
AUROVA_UPSTREAM_URL=http://127.0.0.1:8000/v1/chat/completions npm run gateway
```
ثم في الاستوديو: الإعدادات → الذكاء الاصطناعي → المصدر: **Aurova Model** → «اختبار الاتصال».

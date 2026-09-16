# Aurova Model — بناء النموذج الخاص

هذا المجلد هو خط الإنتاج الكامل لنموذج `aurova-deck-1`: بيانات → تقطير → ضبط → تقييم → تشغيل.
كل مرحلة تستخدم **نفس القواعد التي يطبّقها المحرر** على مخرجات أي نموذج (`model/validate.mjs`)،
فما ينجح هنا ينجح في المنتج دون تعديل.

```
model/
├─ build-dataset.ts   يعكس القوالب/العروض والمخطِّط المحلي إلى JSONL (chat format)
├─ topics.ts          بنك مواضيع عربي/إنجليزي (180) — وسّعه بحرية
├─ validate.mjs       بوابة المخطط المشتركة (outline / rewrite / review)
├─ distill.mjs        يرفع جودة الأهداف بنموذج معلّم عبر أي endpoint متوافق مع OpenAI
├─ train.py           QLoRA على Qwen2.5-Instruct، خسارة على ردّ المساعد فقط، وزن للأمثلة الذهبية
├─ train_dpo.py       مرحلة التفضيل (DPO) من تعديلات المستخدمين فوق محوّل SFT
├─ smoke.mjs          فحص CI: البيانات تُبنى وتجتاز البوابة، والـ gateway يجيب على المهام الثلاث
├─ eval.mjs           تقييم أي endpoint بمقاييس المنتج (schema/frame/count/lang/latency)
├─ serve.sh           vLLM أو llama.cpp + البوابة
├─ docker-compose.yml vLLM (GPU) + gateway
└─ data/ checkpoints/ reports/   (خارج Git)
```

## 1) البيانات
```bash
npm run model:dataset
```
يولّد `model/data/{train,valid}.jsonl` و`stats.json`. المصادر:

| المصدر | كيف | الوزن في التدريب |
|---|---|---|
| **gold** | 16 عرضًا مؤلَّفًا يدويًا (قوالب + demos) مقلوبة إلى `{"slides":[…]}` بعدة صياغات للطلب | ×3 |
| **planner** | المخطِّط المحلي على 180 موضوعًا × أعداد شرائح × لغتين | ×1 |
| **rewrite** | أزواج (نص، عملية) من نصوص القوالب مع بوابة `acceptable()` | ×1 |
| **review** | عروض ذهبية بعيوب محقونة معروفة (عنوان تسمية، رقم بلا مصدر، تكرار، خاتمة بلا طلب) + نسخ نظيفة → قائمة فارغة | ×2 |
| **feedback** | تصدير المستخدم الاختياري من الاستوديو (`model/data/feedback.jsonl`): العرض **بعد تعديله** = هدف ذهبي، و(المولَّد، المعدَّل) = زوج تفضيل في `dpo.jsonl` | ×3 |

الحجم الحالي ≈ 580 مثالًا (73% عربي). هذا كافٍ لتعليم **الشكل**؛ المحتوى الحقيقي يأتي من التقطير.

## 2) التقطير (يرفع الجودة من "شكل صحيح" إلى "محتوى جيد")
```bash
TEACHER_URL=https://api.openai.com/v1/chat/completions TEACHER_KEY=sk-… TEACHER_MODEL=gpt-4.1 \
npm run model:distill -- --concurrency 4
```
- يستبدل أهداف planner/synthetic فقط؛ الذهبية تبقى.
- كل ردّ يمرّ على `validate.mjs`؛ المرفوض يحتفظ بالهدف الأصلي — الملف لا ينكمش.
- قابل للاستئناف. الناتج `train.distilled.jsonl` ويلتقطه `train.py` تلقائيًا.
- لتنويع أكبر: أضف مواضيع في `topics.ts` وأعد الخطوتين. الهدف العملي 3–5 آلاف مثال.

## 3) الضبط
```bash
pip install -r model/requirements.txt
python model/train.py --base Qwen/Qwen2.5-7B-Instruct   --out model/checkpoints/aurova-deck-1 --merge
python model/train.py --base Qwen/Qwen2.5-1.5B-Instruct --out model/checkpoints/aurova-deck-1-mini --epochs 4 --merge
```
- QLoRA 4-bit افتراضيًا (7B على GPU 24GB). `--no-4bit` للبطاقات الأكبر.
- الخسارة على توكنات المساعد فقط؛ `--merge` يكتب نموذجًا كاملًا جاهزًا لـ vLLM/llama.cpp.
- لماذا Qwen2.5: عربية قوية، رخصة Apache-2.0، قالب محادثة أصلي، سلوك JSON جيد. البديل: Gemma 2 9B.

## 3b) التفضيل (DPO) — بعد جمع ≥ 50 زوجًا من المستخدمين
في الاستوديو: الإعدادات → الذكاء الاصطناعي → «المساهمة في تحسين نموذج Aurova» → تصدير JSONL → ضعه في `model/data/feedback.jsonl`.
```bash
npm run model:dataset          # يولّد dpo.jsonl
python model/train_dpo.py --base Qwen/Qwen2.5-7B-Instruct --sft model/checkpoints/aurova-deck-1
```

## 4) التقييم — بمقاييس المنتج لا perplexity
```bash
npm run model:eval:stub                                         # البوابة في وضع stub (خط أساس)
npm run model:eval -- --url http://127.0.0.1:8000/v1/chat/completions --model aurova-deck-1
npm run model:eval -- --url https://api.openai.com/v1/chat/completions --model gpt-4.1-mini --key sk-…
```
| مقياس | المعنى | الهدف |
|---|---|---|
| `schema_ok` | يمرّ من بوابة المحرر دون تعديل | ≥ 98% |
| `frame_ok` | title أولًا و closing أخيرًا | 100% |
| `count_ok` | عدد الشرائح ± 2 | ≥ 95% |
| `lang_ok` | لغة الردّ = المطلوبة | 100% |
| `latency_p95` | على العتاد المستهدف | ≤ 6s للـ 7B |

التقارير تُحفظ في `model/reports/` للمقارنة بين الإصدارات والنماذج العامة (A/B).

## 5) التشغيل
```bash
./model/serve.sh            # vLLM + gateway على :8787
ENGINE=llama ./model/serve.sh   # llama.cpp (CPU/Metal) مع GGUF
docker compose -f model/docker-compose.yml up   # إنتاج
```
ثم في الاستوديو: الإعدادات → الذكاء الاصطناعي → **Aurova Model** → اختبار الاتصال.

## خارطة الطريق
1. **v0 (الآن)**: stub يجتاز 86% من بوابة المخطط — الخط الأساس.
2. **v1**: تقطير 3k مثال + QLoRA 7B → استهداف schema ≥ 98%، تقييم بشري عربي على 200 عرض.
3. **v2**: بيانات من الاستخدام الحقيقي (بموافقة) — ✅ الالتقاط والتصدير و`train_dpo.py` جاهزة؛ ينقص فقط حجم البيانات.
4. **v3**: ✅ عقد التصميم مفعّل — النموذج يقترح لكل شريحة `layout` / `image` / `bg` / `notes` / `takeaway` من مجموعات مغلقة؛
   المحرر يتحقّق من التوافق مع نوع الشريحة (`layoutCompatible`) ويسقط أي قيمة خارج المجموعة. الأمثلة الذهبية تحمل هذه
   الحقول من القوالب المؤلَّفة يدويًا، والمقياس `design_hints` في التقييم يقيس نسبة التغطية. الخطوة التالية: تقطير هذه الحقول
   لأمثلة planner (المعلّم يراها في الـ prompt).

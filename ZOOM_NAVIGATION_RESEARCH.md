# Zoom Navigation — بحث GitHub والمكتبات مفتوحة المصدر

> تاريخ البحث: 2026-09-17. الهدف: تقييم مشاريع/مكتبات مفتوحة المصدر مرتبطة بـ PowerPoint Zoom
> والتنقل التفاعلي بين الشرائح، وتحديد ما يمكن إعادة استخدامه داخل معمارية Aurova الحالية
> (React + TypeScript + anime.js + PptxGenJS) دون إنشاء Editor أو Animation Engine جديد.

## ملخص القرار

**لا نعتمد مكتبة جديدة.** كل الحلول مفتوحة المصدر إما (أ) إطار عرض كامل يستبدل الـ runtime
الخاص بنا، أو (ب) Zoom بصري فقط دون نموذج Navigation. الخطة: مشغّل انتقالات صغير
(~150 سطرًا) بتقنية FLIP عبر Web Animations API يعيش داخل `PresentMode` الحالي،
مع إعادة استخدام نظام الـ easing والـ store والـ renderer الموجودة، وتصدير الروابط
كـ hyperlinks داخلية عبر PptxGenJS.

## جدول التقييم

| Project | License | Purpose | Useful Components | Integration Difficulty | What We Can Reuse | What We Should Avoid | Recommendation |
|---|---|---|---|---|---|---|---|
| [reveal.js](https://github.com/hakimel/reveal.js) | MIT | إطار عروض HTML كامل (transitions + overview + fragments + zoom.js plugin) | فكرة `transition: 'zoom'` لكل شريحة؛ `zoom.js` (Alt+click للتكبير نحو عنصر)؛ نموذج linear/history للتنقل | عالية — إطار متكامل بفرضيات DOM/URL خاصة به، يستبدل PresentMode بالكامل | الفكرة فقط: zoom كـ transition لكل (مصدر→هدف)، وفرضية أن الزوم يبدأ من نقطة العنصر | نسخ الإطار أو plugin يعتمد على بنية reveal (sections/`.slides`) — يتعارض مع SlideView | ❌ لا ندمج؛ نستلهم تصميم الـ transition |
| [impress.js](https://github.com/impress/impress.js) | MIT (+GPL مزدوجة تاريخيًا) | عروض بأسلوب Prezi: خطوات في فضاء 3D والكاميرا تتحرك بينها عبر CSS3 transforms | إثبات أن CSS transforms تكفي لزوم سلس؛ فكرة "الكاميرا" كتحويل واحد على الحاوية | عالية جدًا — نموذج "فضاء حر" يتعارض مع نموذجنا (شرائح 1280×720 + ترتيب خطي + PPTX round-trip) | لا شيء مباشر — فلسفة مختلفة (storytelling فضائي ≠ navigation بين شرائح) | تبني نموذج الخطوات الحرة — يكسر التصدير والترتيب الخطي | ❌ لا نستخدم |
| [Zumly](https://github.com/zumerlab/zumly) (zumerlab) | MIT (مكتبة framework-agnostic) | Zoom كـ navigation بين views: عنصر قابل للزوم → view جديد، مع إدارة حالة العمق | أقرب فلسفة لمطلوبنا: "علاقة تنقل" لا مجرد animation؛ إدارة stack للرجوع | متوسطة — API إلزامي خاص (views تُحقن ديناميكيًا) لا يتوافق مع SlideView/React الحالي | نمط التصميم: `zoomable element → target view + back-stack` — نطبقه بأسلوبنا (slideId + return stack) | الاعتماد المباشر: يحقن DOM خارج React ويصطدم مع SlideView/animRegistry | ⚠️ نستلهم النمط فقط |
| [Zoomooz.js](https://github.com/jaukia/zoomooz) | MIT (مكتبة jQuery قديمة) | `zoomTo(element)` لأي صفحة ويب: targetsize/scalemode/duration/easing | صيغة الإعدادات (duration/easing/targetsize) — قريبة من ZoomLink المقترح | منخفضة تقنيًا لكنها مهجورة (2013) ومعتمدة على jQuery | شكل الـ settings كمرجع لتصميم واجهة الإعدادات | المكتبة نفسها — مهجورة، jQuery، لا React/TS | ❌ مرجع تصميمي فقط |
| anime.js (معتمد حاليًا `^4.5.0`) | MIT | محرك الحركة الحالي للمنصة (buildSlideEngine) | Easing catalog + compileEase؛ TextSplitter؛ timeline | منخفضة — موجود أصلًا | `compileEase` ونظام الـ easing + فلسفة keyframes المطلقة | توسيع المحرك ليقود طبقات الشرائح الكاملة — مصمم لأغلفة العناصر | ✅ نعيد استخدام الـ easing فقط؛ مشغّل الزوم WAAPI منفصل وصغير |
| PptxGenJS (معتمد حاليًا `4.0.1`) | MIT | تصدير PPTX الحالي | `HyperlinkProps.slide: number` — رابط داخلي لرقم شريحة، مدعوم على text/shape/image ([التوثيق](https://gitbrent.github.io/PptxGenJS/docs/types.html)) | منخفضة — نفس طبقة التصدير | تصدير كل Zoom صالح كـ hyperlink داخلي (أقرب سلوك ممكن) | ادعاء دعم "PowerPoint Zoom objects" الأصلية — PptxGenJS لا يولّد كائنات Zoom (SectionZoom/SlideZoom) إطلاقًا | ✅ نستخدم hyperlinks + نوثّق الـ limitation |
| framer-motion / motion (لم تُعتمد) | MIT | Layout animations بتقنية FLIP + spring physics | تقنية FLIP (قياس أول/آخر وعكس الفرق) — نفس الرياضيات التي نحتاجها | متوسطة — مكتبة ثقيلة جديدة (~100KB) من أجل transition واحد | الخوارزمية (موثقة ومفهومة) — نطبقها يدويًا في ~40 سطرًا | إضافة dependency ضخمة لميزة واحدة | ❌ نطبق FLIP يدويًا |
| react-zoom-pan-pinch (لم تُعتمد) | MIT | Pan/zoom حر للمحتوى (خرائط/صور) | لا شيء — زوم حر مستمر ≠ انتقال تنقل محدد المدة | — | — | النموذج كله (zoom مستمر بعجلة الفأرة) | ❌ غير مناسب |

## ملاحظات تقنية من البحث

1. **PowerPoint Zoom الأصلي ≠ hyperlink**: كائنات Zoom في OOXML (SlideZoom/SectionZoom)
   عناصر خاصة بلوحات مصغرة حية. لا توجد مكتبة JS مفتوحة المصدر تولّدها (بما فيها
   PptxGenJS). لذلك: التصدير يحفظ **السلوك** (القفز للشريحة) لا **التأثير**.
2. **الكل يتفق على transform/opacity**: كل الحلول (reveal، impress، Zumly) تستخدم
   CSS transforms للزوم — نفس قرار الأداء لدينا (GPU-friendly، لا layout thrashing).
3. **نقطة الأصل (origin) هي جوهر الإحساس**: zoom.js وZoomooz يبدآن الزوم من موضع
   العنصر لا من المركز — اعتمدناها كـ default (`element` origin).
4. **لا أحد يقدم "علاقة تنقل" جاهزة لـ React**: Zumly الأقرب لكنه خارج React.
   النموذج (`trigger element → target slideId`) يُبنى فوق مخزننا مباشرة.

## التوصية النهائية

- **نموذج البيانات**: `ElementBase.zoom?: ZoomLink` (بجانب `link` الموجود) — يرث
  مجانًا: undo/redo، النسخ/اللصق، التكرار، وبقاء الروابط عند إعادة الترتيب (slideId).
- **التشغيل**: `src/animation/zoomPlayer.ts` — WAAPI keyframes محسوبة بدالة صرفة
  قابلة للاختبار، تعمل داخل `PresentMode` و`PreviewPage` الحاليين.
- **التصدير**: hyperlinks داخلية (`{ slide: n }`) + حقل `result.zoomLinks` + توثيق
  أن الحركة لا تُصدَّر.
- **لا dependencies جديدة**: صفر إضافات على `package.json`.

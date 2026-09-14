import type { DeckSpec } from '../templates/engine'

/**
 * Seeded demo content — real decks with real copy, so the editor can be tested the second
 * the app opens. No lorem ipsum anywhere.
 */
export const DEMO_DECKS: DeckSpec[] = [
  {
    id: 'demo-ai-future',
    title: 'مستقبل الذكاء الاصطناعي',
    subject: 'كيف يتغيّر العمل والقرارات بين ٢٠٢٦ و٢٠٣٠',
    author: 'كدماتي ستوديو',
    themeId: 'midnight-signal',
    tags: ['ذكاء اصطناعي', 'مستقبل', 'عربي'],
    slides: [
      {
        layout: 'title',
        content: {
          kicker: 'محاضرة افتتاحية',
          title: 'مستقبل الذكاء الاصطناعي',
          subtitle: 'ليس سؤال «هل» بل سؤال «من يقرّر». ثلاث سنوات كافية لتغيير شكل العمل المعرفي.',
          footer: '١٤ سبتمبر ٢٠٢٦ · الرياض',
        },
        notes: 'ابدأ بالحكاية الشخصية: مهمة استغرقت يومين وأصبحت في أربعين دقيقة. ثم اطرح السؤال.',
        transition: { type: 'fade', duration: 500 },
      },
      {
        layout: 'image-text',
        image: 'lab',
        content: {
          title: 'ما الذي تغيّر فعلًا',
          body: ['النماذج لم تعد أداة إتمام، بل شريك تنفيذ', 'الحدّ بين البرمجة والاستخدام اختفى', 'كلفة الخطأ صارت في التقييم لا في الإنتاج'],
        },
        notes: 'ركّز على الجملة الثالثة؛ هي الأكثر إثارة للجدل في الجمهور العام.',
      },
      {
        layout: 'statistics',
        content: {
          title: 'الثلاث سنوات القادمة',
          stat: ['٦٨٪', '×٤', '١١'],
          body: ['من المهام المعرفية يمكن أتمتة جزء منها', 'نموّ حِمل الاستدلال مقابل التدريب', 'أسبوعًا: متوسط الوقت الذي يحتاجه فريق ليغيّر طريقته'],
        },
        notes: 'اذكر مصدر الرقم الأول في الحاشية إن سُئلت؛ الأرقام بلا مصدر تُفقدك المصداقية.',
      },
      {
        layout: 'timeline',
        content: {
          title: 'خطّ زمني مختصر',
          kicker: ['٢٠٢٤', '٢٠٢٦', '٢٠٢٨', '٢٠٣٠'],
          body: ['أدوات فردية', 'عمل ضمن_flow_', 'وكلاء مستقلون', 'تنظيم وإعادة هندسة'],
        },
      },
      {
        layout: 'quote',
        bg: 'primary',
        content: { quote: 'الأتمتة لا تسرق الوظائف، إنها تسرق الأعذار.', footer: 'ملاحظة من مناقشة داخلية' },
        notes: 'توقف هنا ثلاث ثوانٍ. الاقتباس يحتاج صمتًا ليعمل.',
      },
      {
        layout: 'two-columns',
        content: {
          title: 'ما الذي يبقى بشريًا',
          body: ['تحديد المشكلة الأصلية\nتحمّل مسؤولية القرار\nالذوق: ما الجيد بما يكفي؟\nالثقة داخل الفريق', 'توليد البدائل\nالتنفيذ المتكرر\nالتلخيص والتصنيف\nالفحص الأوّلي'],
        },
      },
      {
        layout: 'comparison',
        content: {
          title: 'فريقان في السنة نفسها',
          kicker: ['قبل', 'بعد'],
          body: ['٨ أشخاص، تقرير أسبوعي يدوي\nتأخّر ٦ أيام في المتابعة', '٥ أشخاص ومراجعة آلية\nتأخّر ٦ ساعات'],
        },
        notes: 'الأرقام تقديرية من حالتين حقيقيتين بعد إخفاء الأسماء.',
      },
      {
        layout: 'chart',
        content: {
          title: 'أين يذهب الوقت الآن',
          body: 'ننقص وقت الإنتاج ونبقي وقت الحكم. هذه هي المعادلة الوحيدة التي تهمّ المدير هذا العام.',
        },
      },
      {
        layout: 'title-content',
        content: {
          title: 'ثلاث توصيات عملية',
          kicker: 'ابدأ غدًا',
          list: ['اختر مهمة واحدة متكررة وقيّس زمنها قبل وبعد', 'اكتب معايير الجودة قبل أن تطلب من النموذج تنفيذها', 'اجعل المراجعة البشرية طبقة إلزامية، لا خيارًا'],
        },
      },
      {
        layout: 'closing',
        content: { title: 'القرار بيدك', body: 'التقنية تتطوّر أسرع من مؤسساتنا. مهمتنا ليست اللحاق بها، بل اختيار ما نستحقه منها.', footer: 'hi@kadmati.studio' },
        notes: 'اختم بسؤال مفتوح: ما المهمة التي ستقيسها هذا الأسبوع؟',
      },
    ],
  },
  {
    id: 'demo-marketing',
    title: 'Digital Marketing Strategy',
    subject: 'A 12-month plan with measurable bets',
    author: 'KADMATI Studio',
    themeId: 'corporate-ink',
    lang: 'en',
    dir: 'ltr',
    tags: ['marketing', 'strategy'],
    slides: [
      { layout: 'title', content: { kicker: 'FY27 PLAN', title: 'Digital Marketing Strategy', subtitle: 'Organic depth first. Paid amplification second. One metric we are accountable for.', footer: 'Growth team · September 2026' } },
      { layout: 'statistics', content: { title: 'Where we stand', stat: ['48K', '2.1%', '-30%'], body: ['qualified monthly visits', 'landing conversion', 'cost per acquisition after fixes'] } },
      { layout: 'two-columns', content: { title: 'Audience and message', body: ['Owner-operators, 30-45: “better days, not more tools”\nMarketing leads: “reports you can act on”', 'Channels: search · short video · weekly email\nCadence: 3 deep pieces per month'] } },
      { layout: 'chart', content: { title: 'Budget allocation', body: '55% content and research, 25% paid media, 15% automation, 5% deliberate experiments.' } },
      { layout: 'process', content: { title: 'The four-quarter rhythm' } },
      { layout: 'table', content: { title: 'KPIs and owners' } },
      { layout: 'quote', content: { quote: 'We do not buy attention anymore. We earn it, then amplify what already worked.', footer: 'Planning principle' } },
      { layout: 'closing', content: { title: 'The one number', body: 'New recurring revenue from organic and partner channels. Everything else is diagnostic.', footer: 'growth@kadmati.studio' } },
    ],
  },
  {
    id: 'demo-pitch',
    title: 'Startup Pitch Deck',
    subject: 'Nawras — operating system for small retailers',
    author: 'Nawras Labs',
    themeId: 'startup-violet',
    tags: ['pitch', 'Series A'],
    slides: [
      { layout: 'title', content: { kicker: 'SERIES A', title: 'نظام تشغيل المتاجر الصغيرة', subtitle: 'من الدفاتر والجداول إلى نظام واحد يرى كل شيء: المخزون، الفواتير، والعميل.', footer: '٢٠٢٦' } },
      { layout: 'image-text', image: 'product', content: { title: 'المشكلة', body: ['١١ ساعة أسبوعيًا أعمالًا يدوية', '٤ أنظمة لا تتحدّث مع بعضها', 'قرار الشراء يُتخذ بالحدس'] } },
      { layout: 'statistics', content: { title: 'الفرصة', stat: ['٢٤B', '٦٨٪', '٢٫٤M'], body: ['سوق قابل للخدمة', 'متاجر بلا نظام سحابي', 'متجر مؤهل في المنطقة'] } },
      { layout: 'chart', content: { title: 'الإيراد المتكرر الشهري', body: 'نموّ ٢٢٪ شهريًا مع انخفاض تكلفة الاكتساب. القنوات العضوية تدفع الجزء الأكبر.' } },
      { layout: 'two-columns', content: { title: 'لماذا نحن', body: ['نظام واحد لا إضافات\nتسعير يفهمه صاحب المتجر\nدعم بالعربية خلال ٥ دقائق', 'البدل: أدوات محاسبية أو POS عالمي\nالفجوة: تشغيل يومي بلغة المستخدم'] } },
      { layout: 'process', content: { title: 'خطة الـ ١٨ شهرًا' } },
      { layout: 'comparison', content: { title: 'الاقتصاد الوحدي' , body: ['هامش ٧١٪ بعد التكلفة المتغيرة', 'استرداد خلال ٥ أشهر · Churn ١٫٢٪ شهريًا'] } },
      { layout: 'timeline', content: { title: 'المعالم' } },
      { layout: 'quote', content: { quote: 'لم نبع برنامجًا، بل أسبوعًا من الوقت لكل متجر. هذا ما بقي في الأرقام.', footer: 'من مقابلة عميل' } },
      { layout: 'closing', content: { title: 'نطلب ٤٫٥ مليون دولار', body: 'لفريق المنتج، وسوقين جديدين، وذكاء تشغيلي داخل التطبيق.', footer: 'invest@nawras.dev' } },
    ],
  },
  {
    id: 'demo-education',
    title: 'Education Presentation',
    subject: 'Teaching data literacy to non-technical teams',
    author: 'KADMATI Academy',
    themeId: 'edu-teal',
    lang: 'en',
    dir: 'ltr',
    tags: ['education', 'workshop'],
    slides: [
      { layout: 'title', content: { kicker: 'WORKSHOP 04', title: 'Reading a chart without being fooled', subtitle: 'Four habits that survive any tool change.', footer: 'KADMATI Academy' } },
      { layout: 'title-content', content: { title: 'The question before the number', list: ['What would change my mind?', 'Who chose this scale?', 'What is missing from the axis?', 'Is the baseline honest?'] } },
      { layout: 'comparison', content: { title: 'Two charts, one dataset' } },
      { layout: 'table', content: { title: 'Choosing the right encoding' } },
      { layout: 'chart', content: { title: 'A stacked bar, deliberately', body: 'Stacking hides magnitude comparison between categories. Use it for composition, not for trend.' } },
      { layout: 'two-columns', content: { title: 'Exercise', body: ['Rebuild the chart on slide 3\nWrite the one-sentence takeaway', 'Swap with a partner\nCheck: could the opposite conclusion fit?'] } },
      { layout: 'quote', content: { quote: 'A chart is an argument. Judge the argument, not the ink.', footer: 'Closing note' } },
      { layout: 'closing', content: { title: 'Next week', body: 'We bring one real dashboard and cut it in half. Bring your worst chart.' } },
    ],
  },
]

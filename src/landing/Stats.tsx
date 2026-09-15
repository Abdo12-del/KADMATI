/**
 * Stats — one premium glass strip with thin dividers, white bold values
 * (+500 · +50K · 99% · 3x) and muted labels, as in the reference.
 */
const STATS = [
  { value: '+500', label: 'قالب احترافي' },
  { value: '+50K', label: 'مستخدم سعيد' },
  { value: '99%', label: 'دقة في التحليل' },
  { value: '3x', label: 'أسرع في التصميم' },
]

export function Stats() {
  return (
    <div className="slf-glass relative mt-10 overflow-hidden rounded-2xl">
      <div className="relative grid grid-cols-2 sm:grid-cols-4">
        {STATS.map(({ value, label }, i) => (
          <div
            key={label}
            className={[
              'flex flex-col items-center gap-1.5 border-white/10 px-3 py-6 text-center',
              i % 2 === 1 ? 'max-sm:border-s' : '',
              i >= 2 ? 'max-sm:border-t' : '',
              i > 0 ? 'sm:border-s' : '',
            ].join(' ')}
          >
            <span className="slf-display-en text-[26px] font-extrabold leading-none tracking-tight text-white md:text-[30px]">
              {value}
            </span>
            <span className="text-[11.5px] text-[#93a2cb]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

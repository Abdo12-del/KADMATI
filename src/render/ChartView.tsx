import { memo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { ChartElement } from '../document/types'

/**
 * Chart preview. The editor draws with Recharts (MIT) while export writes a *native*
 * PowerPoint chart through PptxGenJS — both consume the exact same `ChartElement` data, so a
 * chart stays an editable chart in PowerPoint instead of becoming a picture.
 */

export interface ChartViewProps {
  el: ChartElement
  compact?: boolean
}

function ChartViewImpl({ el, compact }: ChartViewProps) {
  const data = chartData(el)
  const colors = el.colors.length ? el.colors : ['#3E7CB1', '#E8734A', '#16324F', '#3ECF8E']
  const axisProps = {
    tick: { fontSize: compact ? 9 : 13, fill: '#5A6672' },
    axisLine: { stroke: 'rgba(127,127,127,0.35)' },
    tickLine: { stroke: 'rgba(127,127,127,0.35)' },
  }
  const single = el.series.length === 1

  const common = { width: '100%' as const, height: '100%' as const }
  const padding = { top: 8, right: 8, bottom: 4, left: 8 }

  if (el.chart === 'pie' || el.chart === 'donut') {
    return (
      <div style={common} dir="ltr">
        <ResponsiveContainer>
          <PieChart margin={padding}>
            <Pie
              data={data.map((d) => ({ ...d, value: d.v0 ?? 0 }))}
              dataKey="value"
              nameKey="name"
              innerRadius={el.chart === 'donut' ? (compact ? '45%' : '52%') : 0}
              outerRadius={compact ? '72%' : '84%'}
              paddingAngle={1.5}
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={1}
              label={!compact && el.values}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            {!compact && el.legend ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (el.chart === 'radar') {
    return (
      <div style={common} dir="ltr">
        <ResponsiveContainer>
          <RadarChart data={data} margin={padding} outerRadius={compact ? '68%' : '78%'}>
            <PolarGrid stroke="rgba(127,127,127,0.28)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: compact ? 9 : 12 }} />
            {!compact && <PolarRadiusAxis tick={{ fontSize: 10 }} />}
            {el.series.map((s, i) => (
              <Radar key={s.name} name={s.name} dataKey={`v${i}`} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.32} />
            ))}
            {!compact && el.legend && !single ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (el.chart === 'scatter') {
    return (
      <div style={common} dir="ltr">
        <ResponsiveContainer>
          <ScatterChart margin={padding}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
            <XAxis type="number" dataKey="x" name="x" {...axisProps} />
            <YAxis type="number" dataKey="y" name="y" {...axisProps} width={compact ? 26 : 44} />
            <ZAxis range={[36, 36]} />
            {el.series.map((s, i) => (
              <Scatter key={s.name} name={s.name} data={data.map((d, j) => ({ x: j, y: d.v0 ?? 0 }))} fill={colors[i % colors.length]} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const horizontal = el.chart === 'barH'
  const ChartTag = el.chart === 'line' ? LineChart : el.chart === 'area' ? AreaChart : BarChart

  return (
    <div style={common} dir="ltr">
      <ResponsiveContainer>
        <ChartTag data={data} margin={padding} barCategoryGap={el.chart === 'bar' || el.chart === 'barH' ? '22%' : undefined}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.18)" />
          {horizontal ? (
            <YAxis type="category" dataKey="name" {...axisProps} width={compact ? 46 : 96} />
          ) : (
            <XAxis type="category" dataKey="name" interval={0} {...axisProps} height={compact ? 18 : 30} />
          )}
          {horizontal ? <XAxis type="number" {...axisProps} height={compact ? 18 : 26} /> : <YAxis type="number" {...axisProps} width={compact ? 28 : 46} />}
          {!compact ? <Tooltip cursor={{ fill: 'rgba(127,127,127,0.08)' }} contentStyle={{ borderRadius: 10, border: '1px solid rgba(127,127,127,0.25)', background: '#fff', fontSize: 12 }} /> : null}
          {el.series.map((s, i) => {
            const color = s.color ?? colors[i % colors.length]
            const dataKey = `v${i}`
            const name = s.name
            if (el.chart === 'line') {
              return <Line key={name} dataKey={dataKey} name={name} stroke={color} strokeWidth={2.5} dot={{ r: compact ? 1.5 : 3, strokeWidth: 0, fill: color }} activeDot={{ r: 5 }} />
            }
            if (el.chart === 'area') {
              return <Area key={name} dataKey={dataKey} name={name} stroke={color} fill={color} fillOpacity={0.28} strokeWidth={2} />
            }
            return <Bar key={name} dataKey={dataKey} name={name} fill={color} radius={[3, 3, 0, 0]} maxBarSize={64} />
          })}
          {!compact && el.legend && !single ? <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} /> : null}
        </ChartTag>
      </ResponsiveContainer>
    </div>
  )
}

export const ChartView = memo(ChartViewImpl)

export function chartData(el: ChartElement): { name: string; [k: string]: number | string }[] {
  return el.categories.map((name, i) => {
    const row: { name: string; [k: string]: number | string } = { name }
    el.series.forEach((s, si) => {
      row[`v${si}`] = s.values[i] ?? 0
    })
    return row
  })
}

export function chartSeriesLabels(el: ChartElement): string[] {
  return el.series.map((s) => s.name)
}

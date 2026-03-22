import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { getPlatformColor } from '@/utils/helpers'

const TOOLTIP_STYLE = {
  contentStyle: { background: '#13131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#f1f5f9' },
}

// ─── Activity Line Chart ───────────────────────────────────────────────────────
const PLACEHOLDER_ACTIVITY = Array.from({ length: 12 }, (_, i) => ({
  month: `M${i + 1}`,
  score: [42, 48, 45, 55, 60, 58, 65, 62, 70, 68, 74, 72][i],
}))

export function ActivityChart({ data = [] }) {
  const chartData = data.length ? data : PLACEHOLDER_ACTIVITY

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
        {data.length === 0 && <Line type="monotone" dataKey="avg_hireability" stroke="#a855f7" strokeWidth={2} dot={false} name="Hireability" />}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Skill Pie Chart ──────────────────────────────────────────────────────────
export function SkillPieChart({ skills = [] }) {
  const COLORS = ['#6366f1', '#a855f7', '#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#3b82f6']
  const data = skills.slice(0, 8).map((s, i) => ({
    name: typeof s === 'string' ? s : s.name,
    value: typeof s === 'object' ? s.value : 1,
  }))

  if (!data.length) return <div className="h-48 flex items-center justify-center text-text-muted text-sm">No skill data</div>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─── Growth Bar Chart ─────────────────────────────────────────────────────────
const PLACEHOLDER_GROWTH = [
  { month: 'Jan', hireability: 52, problem_solving: 48 },
  { month: 'Feb', hireability: 55, problem_solving: 50 },
  { month: 'Mar', hireability: 58, problem_solving: 54 },
  { month: 'Apr', hireability: 61, problem_solving: 57 },
  { month: 'May', hireability: 65, problem_solving: 62 },
  { month: 'Jun', hireability: 68, problem_solving: 65 },
]

export function GrowthChart({ data = [] }) {
  const chartData = data.length ? data : PLACEHOLDER_GROWTH

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="hireability" fill="#6366f1" radius={[3, 3, 0, 0]} name="Hireability" />
        <Bar dataKey="problem_solving" fill="#a855f7" radius={[3, 3, 0, 0]} name="Problem Solving" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Platform Radar Chart ─────────────────────────────────────────────────────
export function PlatformRadarChart({ breakdown = {} }) {
  const data = Object.entries(breakdown).map(([platform, scores]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    activity: scores.activity || 0,
    consistency: scores.consistency || 0,
    engagement: scores.engagement || 0,
  }))

  if (!data.length) return <div className="h-48 flex items-center justify-center text-text-muted text-sm">No platform data</div>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey="platform" tick={{ fill: '#475569', fontSize: 10 }} />
        <Radar name="Activity" dataKey="activity" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
        <Radar name="Consistency" dataKey="consistency" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.1} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ─── Comparison Bar Chart ─────────────────────────────────────────────────────
export function ComparisonChart({ comparison = {} }) {
  // Fix: average and top10 are absolute benchmark values, not derived from your_score
  const AVERAGE_BENCHMARKS = { hireability_score: 45, problem_solving_score: 40, development_score: 42, consistency_score: 38, visibility_score: 30 }
  const TOP10_BENCHMARKS   = { hireability_score: 80, problem_solving_score: 78, development_score: 82, consistency_score: 75, visibility_score: 70 }

  const data = Object.entries(comparison).map(([key, val]) => ({
    name: key.replace(/_score$/, '').replace(/_/g, ' '),
    you: val.your_score || 0,
    average: AVERAGE_BENCHMARKS[key] || 45,
    top10: TOP10_BENCHMARKS[key] || 75,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="you"     fill="#6366f1" radius={[0, 3, 3, 0]} name="You" />
        <Bar dataKey="average" fill="#475569" radius={[0, 3, 3, 0]} name="Avg Dev" />
        <Bar dataKey="top10"   fill="#a855f7" radius={[0, 3, 3, 0]} name="Top 10%" />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
      </BarChart>
    </ResponsiveContainer>
  )
}

import { useEffect, useState } from 'react'
import { reportsAPI } from '@/services/endpoints'
import { ComparisonChart } from '@/components/charts/index'
import { Card, Button, Spinner, EmptyState, SectionHeader, Badge } from '@/components/ui/index'
import { extractError, getScoreColor } from '@/utils/helpers'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Compare() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    reportsAPI.compare()
      .then(({ data }) => setData(data.data))
      .catch((e) => { if (e?.response?.status !== 404) toast.error(extractError(e)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!data) return (
    <EmptyState
      icon="⚖️"
      title="No comparison data"
      description="Run an analysis first to compare with other developers"
      action={<Button onClick={() => navigate('/analysis')}>Run Analysis</Button>}
    />
  )

  const { scores, comparison } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Developer Comparison</h1>
        <p className="text-text-secondary text-sm mt-1">How you stack up against the developer community</p>
      </div>

      {/* Percentile cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(comparison).map(([key, val]) => {
          const color = getScoreColor(val.your_score)
          return (
            <Card key={key} className="text-center">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-2">
                {key.replace(/_score$/, '').replace(/_/g, ' ')}
              </p>
              <p className="text-2xl font-bold" style={{ color }}>{val.your_score}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">vs avg</span>
                  <span className={val.vs_average >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                    {val.vs_average >= 0 ? '+' : ''}{val.vs_average}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">vs top 10%</span>
                  <span className={val.vs_top10 >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                    {val.vs_top10 >= 0 ? '+' : ''}{val.vs_top10}
                  </span>
                </div>
              </div>
              <Badge color={val.percentile >= 75 ? 'green' : val.percentile >= 50 ? 'brand' : 'muted'} className="mt-2">
                {val.percentile}th %ile
              </Badge>
            </Card>
          )
        })}
      </div>

      {/* Comparison chart */}
      <Card>
        <SectionHeader
          title="Score Comparison"
          subtitle="You vs Average Developer vs Top 10%"
        />
        <ComparisonChart comparison={comparison} />
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Your Hireability',
            value: `${scores.hireability_score}/100`,
            color: getScoreColor(scores.hireability_score),
            desc: 'Overall employability score',
          },
          {
            label: 'Behavior Type',
            value: scores.behavior_type,
            color: '#6366f1',
            desc: 'Your dominant developer profile',
          },
          {
            label: 'Top Percentile',
            value: `${Math.max(...Object.values(comparison).map((v) => v.percentile))}th`,
            color: '#10b981',
            desc: 'Your best performing metric',
          },
        ].map((item) => (
          <Card key={item.label} className="text-center">
            <p className="text-text-muted text-xs mb-2">{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-text-muted text-xs mt-1">{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

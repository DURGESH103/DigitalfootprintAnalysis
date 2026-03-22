import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useLatestReport } from '@/hooks/useReport'
import { analysisAPI } from '@/services/endpoints'
import { useAnalysisStore } from '@/store/reportStore'
import ScoreCard from '@/components/ScoreCard'
import { ActivityChart, SkillPieChart, GrowthChart, PlatformRadarChart } from '@/components/charts/index'
import { Button, Card, SkeletonCard, EmptyState, SectionHeader, Badge } from '@/components/ui/index'
import { SCORE_CARDS } from '@/utils/constants'
import { extractError } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuthStore()
  const { report, loading } = useLatestReport(user?.id)
  const { setJobId } = useAnalysisStore()
  const [analyzing, setAnalyzing] = useState(false)
  const navigate = useNavigate()

  const scores = report?.scores || {}
  const insights = report?.insights?.ai || {}
  const analysis = report?.insights?.analysis || {}

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const { data } = await analysisAPI.trigger()
      setJobId(data.data.jobId)
      navigate('/analysis')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Good {new Date().getHours() < 12 ? 'morning' : 'evening'},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {report ? `Last analyzed ${new Date(report.created_at).toLocaleDateString()}` : 'No analysis yet — run your first scan'}
          </p>
        </div>
        <Button onClick={runAnalysis} loading={analyzing}>
          ⚡ Run Analysis
        </Button>
      </div>

      {/* Score Cards */}
      <div>
        <SectionHeader title="Your Scores" subtitle="AI-computed across all connected platforms" />
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(7).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !report ? (
          <EmptyState
            icon="📊"
            title="No analysis data yet"
            description="Connect your accounts and run an analysis to see your scores"
            action={<Button onClick={runAnalysis} loading={analyzing}>Run First Analysis</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SCORE_CARDS.map((card, i) => (
              <ScoreCard
                key={card.key}
                label={card.label}
                icon={card.icon}
                score={scores[card.key] || 0}
                color={card.color}
                delay={i * 0.05}
              />
            ))}
          </div>
        )}
      </div>

      {/* Charts Row */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <SectionHeader title="Activity Trend" subtitle="Score over time" />
            <ActivityChart data={report?.insights?.analysis?.weekly_trends} />
          </Card>
          <Card>
            <SectionHeader title="Skill Distribution" subtitle="Top skills detected" />
            <SkillPieChart
              skills={(scores.all_skills || []).slice(0, 8).map((s, i) => ({ name: s, value: 10 - i }))}
            />
          </Card>
          <Card>
            <SectionHeader title="Growth Trend" subtitle="Monthly progress" />
            <GrowthChart data={report?.insights?.analysis?.monthly_trends} />
          </Card>
          <Card>
            <SectionHeader title="Platform Breakdown" subtitle="Activity per platform" />
            <PlatformRadarChart breakdown={scores.platform_breakdown || {}} />
          </Card>
        </div>
      )}

      {/* AI Insights */}
      {report && insights.persona && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Persona */}
          <Card className="lg:col-span-3 bg-gradient-card border-border-brand">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-2xl shrink-0">🤖</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-text-primary font-semibold">Your Digital Persona</p>
                  <Badge color="brand">{scores.behavior_type}</Badge>
                  <Badge color="muted">{insights.generated_by}</Badge>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{insights.persona}</p>
                {insights.career_path && (
                  <p className="text-brand text-sm mt-2 font-medium">🎯 {insights.career_path}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Strengths */}
          <Card>
            <SectionHeader title="💪 Strengths" />
            <ul className="space-y-2">
              {(insights.strengths || []).map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="text-accent-green mt-0.5 shrink-0">✓</span>
                  {s}
                </motion.li>
              ))}
            </ul>
          </Card>

          {/* Weaknesses */}
          <Card>
            <SectionHeader title="⚠️ Weaknesses" />
            <ul className="space-y-2">
              {(insights.weaknesses || []).map((w, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="text-accent-orange mt-0.5 shrink-0">!</span>
                  {w}
                </motion.li>
              ))}
            </ul>
          </Card>

          {/* Suggestions */}
          <Card>
            <SectionHeader title="💡 Suggestions" />
            <ul className="space-y-2">
              {(insights.suggestions || []).map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="text-brand mt-0.5 shrink-0">→</span>
                  {s}
                </motion.li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Skill Gaps */}
      {insights.skill_gaps?.length > 0 && (
        <Card>
          <SectionHeader title="🎯 Skill Gaps" subtitle="In-demand skills not detected in your profile" />
          <div className="flex flex-wrap gap-2">
            {insights.skill_gaps.map((skill) => (
              <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium bg-accent-red/10 text-accent-red border border-accent-red/20">
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

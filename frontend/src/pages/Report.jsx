import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { reportsAPI } from '@/services/endpoints'
import { useReportStore } from '@/store/reportStore'
import ScoreCard from '@/components/ScoreCard'
import { ActivityChart, GrowthChart, PlatformRadarChart } from '@/components/charts/index'
import { Button, Card, SkeletonCard, EmptyState, SectionHeader, Badge, Spinner } from '@/components/ui/index'
import { SCORE_CARDS } from '@/utils/constants'
import { extractError } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function Report() {
  const { reportId } = useParams()
  const { user } = useAuthStore()
  const { currentReport, setReport, reports, setReports } = useReportStore()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const reportRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadReport()
    loadList()
  }, [reportId, user?.id])

  const loadReport = async () => {
    setLoading(true)
    try {
      if (reportId) {
        const { data } = await reportsAPI.getById(reportId)
        setReport(data.data)
      } else if (user?.id) {
        const { data } = await reportsAPI.getLatest(user.id)
        setReport(data.data)
      }
    } catch (e) {
      if (e?.response?.status !== 404) toast.error(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  const loadList = async () => {
    try {
      const { data } = await reportsAPI.list(page)
      setReports(data.data, data.pagination?.total || 0)
      setTotal(data.pagination?.total || 0)
    } catch {}
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0a0a0f', scale: 1.5 })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`footprint-report-${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('Report exported!')
    } catch (e) {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const report = currentReport
  const scores = report?.scores || {}
  const insights = report?.insights?.ai || {}

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Analysis Report</h1>
          {report && <p className="text-text-secondary text-sm mt-1">{new Date(report.created_at).toLocaleString()}</p>}
        </div>
        <div className="flex gap-2">
          {report && (
            <Button variant="ghost" onClick={exportPDF} loading={exporting}>
              📥 Export PDF
            </Button>
          )}
          <Button onClick={() => navigate('/analysis')}>⚡ New Analysis</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(7).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !report ? (
        <EmptyState
          icon="📊"
          title="No reports yet"
          description="Run your first analysis to generate a report"
          action={<Button onClick={() => navigate('/analysis')}>Run Analysis</Button>}
        />
      ) : (
        <div ref={reportRef} className="space-y-8">
          {/* Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SCORE_CARDS.map((card, i) => (
              <ScoreCard key={card.key} label={card.label} icon={card.icon} score={scores[card.key] || 0} color={card.color} delay={i * 0.04} />
            ))}
          </div>

          {/* Persona */}
          {insights.persona && (
            <Card className="bg-gradient-card border-border-brand">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-2xl shrink-0">🤖</div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-text-primary font-semibold">Digital Persona</p>
                    <Badge color="brand">{scores.behavior_type}</Badge>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">{insights.persona}</p>
                  {insights.career_path && <p className="text-brand text-sm mt-2 font-medium">🎯 {insights.career_path}</p>}
                </div>
              </div>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><SectionHeader title="Growth Trend" /><GrowthChart /></Card>
            <Card><SectionHeader title="Platform Breakdown" /><PlatformRadarChart breakdown={scores.platform_breakdown || {}} /></Card>
          </div>

          {/* Insights grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <SectionHeader title="💪 Strengths" />
              <ul className="space-y-2">
                {(insights.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-green shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <SectionHeader title="⚠️ Weaknesses" />
              <ul className="space-y-2">
                {(insights.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-accent-orange shrink-0">!</span>{w}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <SectionHeader title="💡 Suggestions" />
              <ul className="space-y-2">
                {(insights.suggestions || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-brand shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Skills */}
          {scores.all_skills?.length > 0 && (
            <Card>
              <SectionHeader title="🛠️ Detected Skills" />
              <div className="flex flex-wrap gap-2">
                {scores.all_skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-glow text-brand border border-border-brand">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Report history */}
      {reports.length > 0 && (
        <Card>
          <SectionHeader title="Report History" subtitle={`${total} total reports`} />
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/report/${r.id}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors text-left"
              >
                <span className="text-sm text-text-secondary">Report #{r.id}</span>
                <span className="text-xs text-text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
          {total > 10 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
              <Button variant="ghost" size="sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

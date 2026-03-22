import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { accountsAPI, reportsAPI } from '@/services/endpoints'
import { Card, Badge, Spinner, SectionHeader, EmptyState, Button } from '@/components/ui/index'
import { getPlatformColor, extractError } from '@/utils/helpers'
import { PLATFORMS } from '@/utils/constants'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuthStore()
  const [accounts, setAccounts] = useState([])
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({ total: 0, avgHireability: 0 })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      accountsAPI.list(),
      reportsAPI.list(1, 5),
    ]).then(([accRes, repRes]) => {
      setAccounts(accRes.data.data.accounts)
      const reps = repRes.data.data || []
      setReports(reps)
      setStats({
        total: repRes.data.pagination?.total || 0,
        avgHireability: 0,
      })
    }).catch((e) => toast.error(extractError(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-8 max-w-3xl">
      {/* User card */}
      <Card className="bg-gradient-card border-border-brand">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{user?.name}</h2>
            <p className="text-text-secondary text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <Badge color="brand">{accounts.length} platforms</Badge>
              <Badge color="muted">{stats.total} reports</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Connected Platforms', value: accounts.length, icon: '🔗', color: '#6366f1' },
          { label: 'Total Reports', value: stats.total, icon: '📊', color: '#10b981' },
          { label: 'Member Since', value: new Date(user?.created_at || Date.now()).toLocaleDateString('en', { month: 'short', year: 'numeric' }), icon: '📅', color: '#f59e0b' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-text-muted text-xs mt-1">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Connected accounts */}
      <Card>
        <SectionHeader
          title="Connected Accounts"
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/accounts')}>Manage →</Button>}
        />
        {accounts.length === 0 ? (
          <EmptyState
            icon="🔗"
            title="No accounts connected"
            action={<Button size="sm" onClick={() => navigate('/accounts')}>Connect Accounts</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {accounts.map((acc) => {
              const platform = PLATFORMS.find((p) => p.id === acc.platform)
              const color = getPlatformColor(acc.platform)
              return (
                <div
                  key={acc.platform}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-hover border border-border"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${color}15`, color }}
                  >
                    {acc.platform[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary text-xs font-medium">{platform?.label || acc.platform}</p>
                    <p className="text-text-muted text-xs truncate font-mono">{acc.username}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0 ml-auto" />
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Recent reports */}
      <Card>
        <SectionHeader
          title="Recent Reports"
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/report')}>View All →</Button>}
        />
        {reports.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No reports yet"
            action={<Button size="sm" onClick={() => navigate('/analysis')}>Run Analysis</Button>}
          />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/report/${r.id}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-xs font-mono">#{r.id}</span>
                  <span className="text-text-secondary text-sm">Analysis Report</span>
                </div>
                <span className="text-text-muted text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

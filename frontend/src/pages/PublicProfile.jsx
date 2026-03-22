import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { publicAPI } from '@/services/endpoints'
import ScoreCard from '@/components/ScoreCard'
import { Card, Badge, Spinner } from '@/components/ui/index'
import { SCORE_CARDS } from '@/utils/constants'
import { getPlatformColor, extractError } from '@/utils/helpers'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    publicAPI.getProfile(username)
      .then(({ data }) => setProfile(data.data))
      .catch((e) => setError(extractError(e)))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
      <div className="text-5xl">🔍</div>
      <h1 className="text-text-primary text-xl font-bold">Profile not found</h1>
      <p className="text-text-secondary text-sm">{error}</p>
      <Link to="/login" className="btn-primary">Sign In</Link>
    </div>
  )

  const scores = profile.scores || {}

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header bar */}
      <div className="border-b border-border bg-bg-secondary/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-xs">D</div>
          <span className="text-text-primary font-semibold text-sm">Digital Footprint</span>
        </div>
        <Link to="/login" className="btn-primary text-xs px-3 py-1.5">Sign In</Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-card border-border-brand">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">{profile.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.behavior_type && <Badge color="brand">{profile.behavior_type}</Badge>}
                  <Badge color="muted">Member since {new Date(profile.member_since).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</Badge>
                  {profile.last_analyzed && (
                    <Badge color="muted">Analyzed {new Date(profile.last_analyzed).toLocaleDateString()}</Badge>
                  )}
                </div>
                {profile.persona && (
                  <p className="text-text-secondary text-sm mt-3 leading-relaxed max-w-lg">{profile.persona}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Scores */}
        {profile.scores && (
          <div>
            <h2 className="text-text-primary font-semibold mb-4">Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {SCORE_CARDS.map((card, i) => (
                <ScoreCard key={card.key} label={card.label} icon={card.icon} score={scores[card.key] || 0} color={card.color} delay={i * 0.05} />
              ))}
            </div>
          </div>
        )}

        {/* Platforms */}
        {profile.platforms?.length > 0 && (
          <Card>
            <h2 className="text-text-primary font-semibold mb-4">Connected Platforms</h2>
            <div className="flex flex-wrap gap-2">
              {profile.platforms.map((p) => {
                const color = getPlatformColor(p.platform)
                return (
                  <div key={p.platform} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: `${color}30`, background: `${color}10` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-medium" style={{ color }}>{p.platform}</span>
                    <span className="text-text-muted text-xs font-mono">{p.username}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <Card>
            <h2 className="text-text-primary font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-glow text-brand border border-border-brand">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        <p className="text-center text-text-muted text-xs">
          Powered by <span className="text-brand">Digital Footprint Analyzer</span> ·{' '}
          <Link to="/signup" className="text-brand hover:text-brand-light transition-colors">Create your profile →</Link>
        </p>
      </div>
    </div>
  )
}

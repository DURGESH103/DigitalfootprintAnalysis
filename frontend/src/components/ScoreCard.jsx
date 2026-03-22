import { motion } from 'framer-motion'
import { getScoreColor, getScoreLabel, formatScore } from '@/utils/helpers'
import { ProgressBar } from './ui/index'

export default function ScoreCard({ label, icon, score, color, delay = 0 }) {
  const scoreColor = color || getScoreColor(score)
  const label2 = getScoreLabel(score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, borderColor: `${scoreColor}40` }}
      className="card group cursor-default transition-all duration-300"
      style={{ '--score-color': scoreColor }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-text-primary">{formatScore(score)}</span>
            <span className="text-text-muted text-sm">/100</span>
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}
        >
          {icon}
        </div>
      </div>

      <ProgressBar value={score} color={scoreColor} className="mb-2" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: scoreColor }}>{label2}</span>
        <span className="text-xs text-text-muted">{score >= 50 ? '↑' : '↓'} vs avg</span>
      </div>
    </motion.div>
  )
}

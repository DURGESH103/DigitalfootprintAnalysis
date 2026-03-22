import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalysisStore } from '@/store/reportStore'
import { analysisAPI } from '@/services/endpoints'
import { useAnalysis } from '@/hooks/useAnalysis'
import { PLATFORMS } from '@/utils/constants'
import { Button, Card, ProgressBar, Badge } from '@/components/ui/index'
import { extractError, getPlatformColor } from '@/utils/helpers'
import toast from 'react-hot-toast'

const STEP_ICONS = {
  pending: '○',
  running: '◌',
  done: '✓',
  error: '✕',
}

const STEP_COLORS = {
  pending: 'text-text-muted',
  running: 'text-brand',
  done: 'text-accent-green',
  error: 'text-accent-red',
}

export default function Analysis() {
  const { jobId, status, steps, progress, setJobId, reset } = useAnalysisStore()
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [starting, setStarting] = useState(false)
  const navigate = useNavigate()

  useAnalysis((reportId) => {
    toast.success('Analysis complete! 🎉')
    setTimeout(() => navigate(`/report/${reportId}`), 1500)
  })

  const togglePlatform = (id) =>
    setSelectedPlatforms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])

  const startAnalysis = async () => {
    setStarting(true)
    reset()
    try {
      const { data } = await analysisAPI.trigger(selectedPlatforms.length ? selectedPlatforms : undefined)
      setJobId(data.data.jobId)
      toast.success('Analysis queued!')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setStarting(false)
    }
  }

  const isRunning = ['queued', 'running'].includes(status)
  const isDone = status === 'completed'
  const isFailed = status === 'failed'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Run Analysis</h1>
        <p className="text-text-secondary text-sm mt-1">Select platforms or analyze all connected accounts</p>
      </div>

      {/* Platform selector */}
      {!isRunning && !isDone && (
        <Card>
          <p className="text-text-secondary text-sm mb-4">
            Select specific platforms (leave empty to analyze all connected accounts)
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const selected = selectedPlatforms.includes(p.id)
              const color = getPlatformColor(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200"
                  style={selected
                    ? { background: `${color}15`, borderColor: `${color}40`, color }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' }
                  }
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          <Button onClick={startAnalysis} loading={starting} className="mt-4 w-full">
            ⚡ Start Analysis
          </Button>
        </Card>
      )}

      {/* Progress */}
      <AnimatePresence>
        {(isRunning || isDone || isFailed) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Progress bar */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-primary font-semibold text-sm">
                  {isDone ? 'Analysis Complete! 🎉' : isFailed ? 'Analysis Failed' : 'Analyzing...'}
                </p>
                <Badge color={isDone ? 'green' : isFailed ? 'red' : 'brand'}>
                  {progress}%
                </Badge>
              </div>
              <ProgressBar
                value={progress}
                color={isDone ? '#10b981' : isFailed ? '#ef4444' : '#6366f1'}
              />
            </Card>

            {/* Steps */}
            <Card>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`text-lg font-mono mt-0.5 shrink-0 ${STEP_COLORS[step.status]}`}>
                      {step.status === 'running' ? (
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          {STEP_ICONS[step.status]}
                        </motion.span>
                      ) : STEP_ICONS[step.status]}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${step.status === 'done' ? 'text-text-primary' : step.status === 'running' ? 'text-brand' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                      {step.detail && (
                        <p className="text-xs text-text-muted mt-0.5">{step.detail}</p>
                      )}
                    </div>
                    {step.status === 'running' && (
                      <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin shrink-0 mt-0.5" />
                    )}
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              {isDone && (
                <Button onClick={() => navigate('/report')} className="flex-1">
                  View Report →
                </Button>
              )}
              {isFailed && (
                <Button variant="ghost" onClick={() => { reset(); setSelectedPlatforms([]) }} className="flex-1">
                  Try Again
                </Button>
              )}
              {isRunning && (
                <p className="text-text-muted text-xs text-center w-full py-2">
                  Analysis running in background. You can navigate away safely.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

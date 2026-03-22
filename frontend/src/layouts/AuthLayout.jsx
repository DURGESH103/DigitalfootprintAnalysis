import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-accent-purple/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">D</div>
            <span className="text-text-primary font-semibold">Digital Footprint</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-text-primary leading-tight">
            Understand your<br />
            <span className="gradient-text">developer identity</span>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            AI-powered analysis across GitHub, LeetCode, Codeforces and more. Get your hireability score, skill gaps, and career insights.
          </p>
          <div className="flex flex-wrap gap-2">
            {['GitHub', 'LeetCode', 'Codeforces', 'LinkedIn', 'CodeChef'].map((p) => (
              <span key={p} className="px-3 py-1 rounded-full text-xs font-medium bg-bg-card border border-border text-text-secondary">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Platforms', value: '7+' },
            { label: 'Metrics', value: '50+' },
            { label: 'AI Insights', value: '∞' },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}

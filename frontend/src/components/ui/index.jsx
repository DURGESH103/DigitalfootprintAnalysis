import { motion } from 'framer-motion'
import { cn } from '@/utils/helpers'

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark shadow-glow-sm hover:shadow-glow',
    ghost: 'border border-border text-text-secondary hover:border-border-hover hover:text-text-primary hover:bg-bg-hover',
    danger: 'bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20',
    success: 'bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, prefix, suffix, className, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-text-secondary">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-text-muted text-sm">{prefix}</span>}
        <input
          className={cn(
            'input-field',
            prefix && 'pl-9',
            suffix && 'pr-9',
            error && 'border-accent-red focus:border-accent-red focus:ring-accent-red',
            className
          )}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-text-muted text-sm">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover = false, glow = false, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, borderColor: 'rgba(99,102,241,0.3)' } : undefined}
      className={cn(
        'card',
        glow && 'shadow-glow',
        hover && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }) {
  return <div className={cn('shimmer-bg rounded-lg', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', color = 'brand' }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-8 h-8' }
  const colors = { brand: 'border-brand', white: 'border-white', muted: 'border-text-muted' }
  return (
    <div className={cn('rounded-full border-2 border-t-transparent animate-spin', sizes[size], colors[color])} />
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand/10 text-brand border-brand/20',
    green: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    red: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    orange: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
    cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
    muted: 'bg-bg-hover text-text-secondary border-border',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', colors[color])}>
      {children}
    </span>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="text-5xl">{icon}</div>
      <div>
        <h3 className="text-text-primary font-semibold">{title}</h3>
        {description && <p className="text-text-secondary text-sm mt-1 max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-lg card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">✕</button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#6366f1', className }) {
  return (
    <div className={cn('h-1.5 bg-bg-hover rounded-full overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-text-primary font-semibold">{title}</h2>
        {subtitle && <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

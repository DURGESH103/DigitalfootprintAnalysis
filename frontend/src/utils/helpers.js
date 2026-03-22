import { clsx } from 'clsx'

export const cn = (...args) => clsx(...args)

export const getScoreColor = (score) => {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#6366f1'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Needs Work'
}

export const formatScore = (score) =>
  typeof score === 'number' ? score.toFixed(1) : '—'

export const getPlatformIcon = (platform) => {
  const icons = {
    github: '⚡',
    gitlab: '🦊',
    leetcode: '🧩',
    codeforces: '🏆',
    codechef: '👨‍🍳',
    hackerrank: '💻',
    geeksforgeeks: '🌿',
    linkedin: '💼',
    twitter: '🐦',
  }
  return icons[platform] || '🔗'
}

export const getPlatformColor = (platform) => {
  const colors = {
    github: '#6366f1',
    gitlab: '#f59e0b',
    leetcode: '#f97316',
    codeforces: '#3b82f6',
    codechef: '#10b981',
    hackerrank: '#22d3ee',
    linkedin: '#0ea5e9',
    twitter: '#60a5fa',
  }
  return colors[platform] || '#94a3b8'
}

export const extractError = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong'

export const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

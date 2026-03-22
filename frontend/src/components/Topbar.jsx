import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/accounts': 'Connected Accounts',
  '/analysis': 'Run Analysis',
  '/report': 'Reports',
  '/compare': 'Compare',
  '/resume': 'Resume Analyzer',
  '/profile': 'Profile',
}

export default function Topbar() {
  const { toggleSidebar, toggleChat } = useUIStore()
  const { user } = useAuthStore()
  const { pathname } = useLocation()

  const title = PAGE_TITLES[pathname] || 'Digital Footprint'

  return (
    <header className="h-14 border-b border-border bg-bg-secondary/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          ☰
        </button>
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-glow text-brand border border-border-brand hover:bg-brand/20 transition-colors"
        >
          <span>🤖</span>
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

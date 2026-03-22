import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useLocation } from 'react-router-dom'
import { notificationsAPI } from '@/services/endpoints'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const title = PAGE_TITLES[pathname] || 'Digital Footprint'

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await notificationsAPI.list()
      setNotifications(data.data.notifications || [])
      setUnread(data.data.unread || 0)
    } catch { /* silent — non-critical UI feature */ }
  }

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead()
      setUnread(0)
      setNotifications((n) => n.map((x) => ({ ...x, read_at: new Date().toISOString() })))
    } catch { /* silent */ }
  }

  return (
    <header className="h-14 border-b border-border bg-bg-secondary/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* AI Assistant */}
        <button
          onClick={toggleChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-glow text-brand border border-border-brand hover:bg-brand/20 transition-colors"
        >
          <span>🤖</span>
          <span className="hidden sm:inline">AI Assistant</span>
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); if (!notifOpen && unread > 0) markAllRead() }}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            aria-label="Notifications"
          >
            🔔
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-80 bg-bg-card border border-border rounded-xl shadow-card z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-text-primary text-sm font-semibold">Notifications</p>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-brand hover:text-brand-light transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-text-muted text-sm">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-border last:border-0 transition-colors ${!n.read_at ? 'bg-brand-glow' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">
                            {n.type === 'analysis_complete' ? '✅' : n.type === 'analysis_failed' ? '❌' : '💡'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-text-primary text-xs font-medium">{n.title}</p>
                            <p className="text-text-muted text-xs mt-0.5 truncate">{n.message}</p>
                            <p className="text-text-muted text-[10px] mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!n.read_at && <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0 mt-1.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

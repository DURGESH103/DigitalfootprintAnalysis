import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/services/endpoints'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/accounts', icon: '🔗', label: 'Accounts' },
  { to: '/analysis', icon: '⚡', label: 'Analysis' },
  { to: '/report', icon: '📊', label: 'Reports' },
  { to: '/compare', icon: '⚖️', label: 'Compare' },
  { to: '/resume', icon: '📄', label: 'Resume' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authAPI.logout(refreshToken) } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-20"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="relative z-30 flex flex-col bg-bg-secondary border-r border-border h-full shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shrink-0">D</div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="text-text-primary font-semibold text-sm whitespace-nowrap"
              >
                Footprint AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <span className="text-base shrink-0">{icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-border p-3 space-y-1">
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-accent-red hover:text-accent-red hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <span className="shrink-0">🚪</span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  )
}

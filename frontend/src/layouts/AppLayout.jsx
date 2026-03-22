import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import ChatAssistant from '@/components/ChatAssistant'
import { motion, AnimatePresence } from 'framer-motion'

export default function AppLayout() {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 max-w-7xl mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ChatAssistant />
    </div>
  )
}

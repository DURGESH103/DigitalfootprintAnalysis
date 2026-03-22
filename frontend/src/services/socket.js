import { io } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

let socket = null

export const connectSocket = () => {
  const token = useAuthStore.getState().token
  if (socket?.connected) return socket

  // Disconnect stale socket before creating a new one
  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  })

  socket.on('connect', () => console.log('[socket] connected:', socket.id))
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason))
  socket.on('connect_error', (e) => console.warn('[socket] error:', e.message))

  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}

export const getSocket = () => socket

export const SOCKET_EVENTS = {
  STARTED: 'analysis:started',
  FETCHING: 'analysis:fetching',
  PLATFORM_DONE: 'analysis:platform_done',
  PLATFORM_ERROR: 'analysis:platform_error',
  NORMALIZING: 'analysis:normalizing',
  AI_PROCESSING: 'analysis:ai_processing',
  COMPLETED: 'analysis:completed',
  FAILED: 'analysis:failed',
}

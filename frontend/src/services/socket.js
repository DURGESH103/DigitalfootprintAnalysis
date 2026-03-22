import { io } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

let socket = null

export const connectSocket = () => {
  const token = useAuthStore.getState().token
  if (socket?.connected) return socket

  socket = io('http://localhost:3000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => console.log('Socket connected'))
  socket.on('disconnect', () => console.log('Socket disconnected'))
  socket.on('connect_error', (e) => console.warn('Socket error:', e.message))

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

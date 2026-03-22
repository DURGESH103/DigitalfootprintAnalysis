import { useEffect, useRef, useCallback } from 'react'
import { useAnalysisStore } from '@/store/reportStore'
import { connectSocket, SOCKET_EVENTS } from '@/services/socket'
import { analysisAPI } from '@/services/endpoints'
import { sleep } from '@/utils/helpers'

const STEP_DEFS = [
  { id: 'start', label: 'Analysis started', event: SOCKET_EVENTS.STARTED },
  { id: 'fetching', label: 'Fetching platform data', event: SOCKET_EVENTS.FETCHING },
  { id: 'normalizing', label: 'Normalizing data', event: SOCKET_EVENTS.NORMALIZING },
  { id: 'ai', label: 'AI processing insights', event: SOCKET_EVENTS.AI_PROCESSING },
  { id: 'done', label: 'Analysis complete', event: SOCKET_EVENTS.COMPLETED },
]

export const useAnalysis = (onComplete) => {
  const { jobId, setStatus, addStep, updateStep, setProgress, reset } = useAnalysisStore()
  const pollRef = useRef(null)
  const socketRef = useRef(null)

  const startListening = useCallback((jId) => {
    const socket = connectSocket()
    socketRef.current = socket

    // Initialize steps
    STEP_DEFS.forEach((s) => addStep({ ...s, status: 'pending' }))

    const markStep = (id, status = 'done', extra = {}) =>
      updateStep(id, { status, ...extra })

    socket.on(SOCKET_EVENTS.STARTED, () => {
      markStep('start', 'done')
      setProgress(10)
      setStatus('running')
    })

    socket.on(SOCKET_EVENTS.FETCHING, (d) => {
      markStep('fetching', 'running', { detail: `Fetching ${d.platform}...` })
      setProgress(25)
    })

    socket.on(SOCKET_EVENTS.PLATFORM_DONE, (d) => {
      markStep('fetching', 'running', { detail: `${d.platform} done ✓` })
      setProgress((p) => Math.min(p + 8, 55))
    })

    socket.on(SOCKET_EVENTS.NORMALIZING, () => {
      markStep('fetching', 'done')
      markStep('normalizing', 'running')
      setProgress(60)
    })

    socket.on(SOCKET_EVENTS.AI_PROCESSING, () => {
      markStep('normalizing', 'done')
      markStep('ai', 'running')
      setProgress(80)
    })

    socket.on(SOCKET_EVENTS.COMPLETED, (d) => {
      markStep('ai', 'done')
      markStep('done', 'done')
      setProgress(100)
      setStatus('completed')
      onComplete?.(d.reportId)
    })

    socket.on(SOCKET_EVENTS.FAILED, (d) => {
      setStatus('failed')
      STEP_DEFS.forEach((s) => updateStep(s.id, { status: 'error' }))
    })

    // Fallback polling
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await analysisAPI.jobStatus(jId)
        if (data.data.state === 'completed') {
          clearInterval(pollRef.current)
          setStatus('completed')
          setProgress(100)
          onComplete?.(data.data.result?.reportId)
        } else if (data.data.state === 'failed') {
          clearInterval(pollRef.current)
          setStatus('failed')
        }
      } catch {}
    }, 5000)
  }, [])

  const cleanup = useCallback(() => {
    clearInterval(pollRef.current)
    socketRef.current?.off(SOCKET_EVENTS.STARTED)
    socketRef.current?.off(SOCKET_EVENTS.FETCHING)
    socketRef.current?.off(SOCKET_EVENTS.PLATFORM_DONE)
    socketRef.current?.off(SOCKET_EVENTS.NORMALIZING)
    socketRef.current?.off(SOCKET_EVENTS.AI_PROCESSING)
    socketRef.current?.off(SOCKET_EVENTS.COMPLETED)
    socketRef.current?.off(SOCKET_EVENTS.FAILED)
  }, [])

  useEffect(() => {
    if (jobId) startListening(jobId)
    return cleanup
  }, [jobId])

  return { cleanup }
}

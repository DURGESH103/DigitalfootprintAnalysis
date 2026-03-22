import { useEffect, useRef, useCallback } from 'react'
import { useAnalysisStore } from '@/store/reportStore'
import { connectSocket, SOCKET_EVENTS } from '@/services/socket'
import { analysisAPI } from '@/services/endpoints'

const STEP_DEFS = [
  { id: 'start',       label: 'Analysis started'       },
  { id: 'fetching',    label: 'Fetching platform data'  },
  { id: 'normalizing', label: 'Normalizing data'        },
  { id: 'ai',          label: 'AI processing insights'  },
  { id: 'done',        label: 'Analysis complete'       },
]

export const useAnalysis = (onComplete) => {
  const { jobId, steps, setStatus, addStep, updateStep, setProgress } = useAnalysisStore()
  const pollRef    = useRef(null)
  const socketRef  = useRef(null)
  const onCompleteRef = useRef(onComplete) // avoid stale closure

  // Keep ref current without re-running the effect
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const markStep = useCallback((id, status, extra = {}) => {
    updateStep(id, { status, ...extra })
  }, [updateStep])

  const startListening = useCallback((jId) => {
    // Initialise steps only if not already populated (prevents duplicates on re-render)
    if (steps.length === 0) {
      STEP_DEFS.forEach((s) => addStep({ ...s, status: 'pending' }))
    }

    const socket = connectSocket()
    socketRef.current = socket

    const handlers = {
      [SOCKET_EVENTS.STARTED]: () => {
        markStep('start', 'done')
        setProgress(10)
        setStatus('running')
      },
      [SOCKET_EVENTS.FETCHING]: (d) => {
        markStep('fetching', 'running', { detail: `Fetching ${d.platform}…` })
        setProgress(25)
      },
      [SOCKET_EVENTS.PLATFORM_DONE]: (d) => {
        markStep('fetching', 'running', { detail: `${d.platform} ✓` })
        setProgress((p) => Math.min(p + 8, 55))
      },
      [SOCKET_EVENTS.PLATFORM_ERROR]: (d) => {
        markStep('fetching', 'running', { detail: `${d.platform} failed: ${d.error}` })
      },
      [SOCKET_EVENTS.NORMALIZING]: () => {
        markStep('fetching', 'done')
        markStep('normalizing', 'running')
        setProgress(60)
      },
      [SOCKET_EVENTS.AI_PROCESSING]: () => {
        markStep('normalizing', 'done')
        markStep('ai', 'running')
        setProgress(80)
      },
      [SOCKET_EVENTS.COMPLETED]: (d) => {
        markStep('ai', 'done')
        markStep('done', 'done')
        setProgress(100)
        setStatus('completed')
        clearInterval(pollRef.current)
        onCompleteRef.current?.(d.reportId)
      },
      [SOCKET_EVENTS.FAILED]: () => {
        setStatus('failed')
        STEP_DEFS.forEach((s) => updateStep(s.id, { status: 'error' }))
        clearInterval(pollRef.current)
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler))

    // Polling fallback — kicks in if socket events don't arrive within 5s
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await analysisAPI.jobStatus(jId)
        const state = data.data?.state
        if (state === 'completed') {
          clearInterval(pollRef.current)
          setStatus('completed')
          setProgress(100)
          onCompleteRef.current?.(data.data.result?.reportId)
        } else if (state === 'failed') {
          clearInterval(pollRef.current)
          setStatus('failed')
        }
      } catch { /* network error — keep polling */ }
    }, 5000)

    return handlers
  }, [steps.length, addStep, markStep, setProgress, setStatus, updateStep])

  useEffect(() => {
    if (!jobId) return
    const handlers = startListening(jobId)

    return () => {
      clearInterval(pollRef.current)
      const socket = socketRef.current
      if (socket && handlers) {
        Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler))
      }
    }
  }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps
}

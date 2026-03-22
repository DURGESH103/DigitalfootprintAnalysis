import { useState, useEffect } from 'react'
import { reportsAPI } from '@/services/endpoints'
import { useReportStore } from '@/store/reportStore'
import { extractError } from '@/utils/helpers'

export const useReport = (reportId) => {
  const { currentReport, setReport, setLoading, setError, loading, error } = useReportStore()
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    if (!reportId) return
    const fetch = async () => {
      setLocalLoading(true)
      try {
        const { data } = await reportsAPI.getById(reportId)
        setReport(data.data)
      } catch (e) {
        setError(extractError(e))
      } finally {
        setLocalLoading(false)
      }
    }
    fetch()
  }, [reportId])

  return { report: currentReport, loading: localLoading, error }
}

export const useLatestReport = (userId) => {
  const { currentReport, setReport } = useReportStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await reportsAPI.getLatest(userId)
        setReport(data.data)
      } catch (e) {
        setError(extractError(e))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId])

  return { report: currentReport, loading, error }
}

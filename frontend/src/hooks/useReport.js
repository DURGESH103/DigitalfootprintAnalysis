import { useState, useEffect } from 'react'
import { reportsAPI } from '@/services/endpoints'
import { useReportStore } from '@/store/reportStore'
import { extractError } from '@/utils/helpers'

export const useReport = (reportId) => {
  const { currentReport, setReport } = useReportStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!reportId) return
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await reportsAPI.getById(reportId)
        setReport(data.data)
      } catch (e) {
        if (e?.response?.status !== 404) setError(extractError(e))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [reportId])

  return { report: currentReport, loading, error }
}

export const useLatestReport = (userId) => {
  const { currentReport, setReport } = useReportStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await reportsAPI.getLatest(userId)
        setReport(data.data)
      } catch (e) {
        // 404 = no reports yet, perfectly normal for new users
        if (e?.response?.status !== 404) setError(extractError(e))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId])

  return { report: currentReport, loading, error }
}

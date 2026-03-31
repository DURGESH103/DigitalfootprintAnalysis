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

// Track which userIds we've already fetched so we don't spam 404s
const fetchedUsers = new Set()

export const useLatestReport = (userId) => {
  const { currentReport, setReport } = useReportStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    // Already fetched for this user — skip
    if (fetchedUsers.has(userId)) return

    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await reportsAPI.getLatest(userId)
        setReport(data.data)
        fetchedUsers.add(userId)
      } catch (e) {
        fetchedUsers.add(userId) // mark fetched even on 404 so we don't retry
        if (e?.response?.status !== 404) setError(extractError(e))
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId])

  return { report: currentReport, loading, error }
}

// Call this after a new analysis completes to force a re-fetch
export const invalidateReportCache = (userId) => {
  fetchedUsers.delete(userId)
}

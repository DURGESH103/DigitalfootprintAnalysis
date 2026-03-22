import { create } from 'zustand'

export const useReportStore = create((set) => ({
  currentReport: null,
  reports: [],
  total: 0,
  loading: false,
  error: null,

  setReport: (report) => set({ currentReport: report }),
  setReports: (reports, total) => set({ reports, total }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearReport: () => set({ currentReport: null }),
}))

export const useAnalysisStore = create((set) => ({
  jobId: null,
  status: 'idle', // idle | queued | running | completed | failed
  steps: [],
  progress: 0,

  setJobId: (jobId) => set({ jobId, status: 'queued' }),
  setStatus: (status) => set({ status }),
  addStep: (step) => set((s) => ({ steps: [...s.steps, step] })),
  updateStep: (id, update) =>
    set((s) => ({ steps: s.steps.map((st) => (st.id === id ? { ...st, ...update } : st)) })),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ jobId: null, status: 'idle', steps: [], progress: 0 }),
}))

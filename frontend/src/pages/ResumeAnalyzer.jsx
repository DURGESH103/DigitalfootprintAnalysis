import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { resumeAPI } from '@/services/endpoints'
import { Button, Card, Badge, Spinner, SectionHeader } from '@/components/ui/index'
import { extractError } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/msword': ['.doc', '.docx'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    try {
      const { data } = await resumeAPI.upload(file)
      setResult(data.data)
      toast.success('Resume analyzed!')
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result
    ? result.analysis.resume_score >= 70 ? '#10b981' : result.analysis.resume_score >= 50 ? '#6366f1' : '#ef4444'
    : '#6366f1'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Resume Analyzer</h1>
        <p className="text-text-secondary text-sm mt-1">Compare your resume skills with your actual coding activity</p>
      </div>

      {/* Upload zone */}
      <Card>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive ? 'border-brand bg-brand-glow' : 'border-border hover:border-border-hover hover:bg-bg-hover'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-3">{isDragActive ? '📂' : '📄'}</div>
          {file ? (
            <div>
              <p className="text-text-primary font-medium">{file.name}</p>
              <p className="text-text-muted text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-text-primary font-medium">Drop your resume here</p>
              <p className="text-text-muted text-sm mt-1">PDF, DOC, DOCX, TXT — max 5MB</p>
            </div>
          )}
        </div>

        {file && (
          <div className="flex gap-2 mt-4">
            <Button onClick={analyze} loading={loading} className="flex-1">
              🔍 Analyze Resume
            </Button>
            <Button variant="ghost" onClick={() => { setFile(null); setResult(null) }}>
              Clear
            </Button>
          </div>
        )}
      </Card>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score */}
            <Card className="text-center">
              <p className="text-text-muted text-sm mb-2">Resume Match Score</p>
              <p className="text-5xl font-bold" style={{ color: scoreColor }}>
                {result.analysis.resume_score}
              </p>
              <p className="text-text-muted text-xs mt-1">out of 100</p>
              <p className="text-text-secondary text-sm mt-3 leading-relaxed">{result.analysis.skill_gap_analysis}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched skills */}
              <Card>
                <SectionHeader title="✅ Matched Skills" subtitle="Found in both resume and activity" />
                <div className="flex flex-wrap gap-2">
                  {result.analysis.matched_skills.length ? (
                    result.analysis.matched_skills.map((s) => (
                      <Badge key={s} color="green">{s}</Badge>
                    ))
                  ) : (
                    <p className="text-text-muted text-sm">No matches found</p>
                  )}
                </div>
              </Card>

              {/* Missing skills */}
              <Card>
                <SectionHeader title="❌ Missing from Resume" subtitle="In your activity but not resume" />
                <div className="flex flex-wrap gap-2">
                  {result.analysis.missing_skills.length ? (
                    result.analysis.missing_skills.map((s) => (
                      <Badge key={s} color="red">{s}</Badge>
                    ))
                  ) : (
                    <p className="text-text-muted text-sm">All skills accounted for!</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Suggestions */}
            <Card>
              <SectionHeader title="💡 Suggestions" />
              <ul className="space-y-2">
                {result.analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="text-brand shrink-0 mt-0.5">→</span>{s}
                  </li>
                ))}
              </ul>
            </Card>

            {/* User skills */}
            {result.user_skills?.length > 0 && (
              <Card>
                <SectionHeader title="🛠️ Your Detected Skills" subtitle="From platform analysis" />
                <div className="flex flex-wrap gap-2">
                  {result.user_skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-glow text-brand border border-border-brand">
                      {s}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

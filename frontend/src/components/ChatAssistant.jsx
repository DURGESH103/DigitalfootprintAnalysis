import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useReportStore } from '@/store/reportStore'
import { Button, Input, Spinner } from './ui/index'

const SUGGESTIONS = [
  'How can I improve my hireability score?',
  'What skills am I missing?',
  'How do I compare to top developers?',
  'What should I focus on next?',
]

const generateResponse = (question, report) => {
  const scores = report?.scores || {}
  const q = question.toLowerCase()

  if (q.includes('improve') || q.includes('hireability')) {
    const low = Object.entries(scores)
      .filter(([k, v]) => k.endsWith('_score') && v < 60)
      .map(([k]) => k.replace(/_score$/, '').replace(/_/g, ' '))
    return low.length
      ? `To improve your hireability (${scores.hireability_score}/100), focus on: **${low.join(', ')}**. Consistent daily practice and building public projects will have the biggest impact.`
      : `Your hireability score is strong at ${scores.hireability_score}/100! Keep maintaining consistency and consider contributing to open source.`
  }
  if (q.includes('skill') || q.includes('missing')) {
    const gaps = report?.insights?.ai?.skill_gaps || []
    return gaps.length
      ? `Based on your profile, you're missing these in-demand skills: **${gaps.join(', ')}**. I recommend starting with system design and cloud fundamentals.`
      : `Your skill profile looks solid! Consider deepening expertise in your top languages.`
  }
  if (q.includes('compare') || q.includes('top')) {
    return `Your hireability score of **${scores.hireability_score}/100** puts you in the **${scores.hireability_score > 70 ? 'top 25%' : 'top 50%'}** of developers. Focus on consistency and visibility to break into the top 10%.`
  }
  if (q.includes('focus') || q.includes('next')) {
    const suggestions = report?.insights?.ai?.suggestions || []
    return suggestions.length
      ? `Here's what to focus on next:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : `Focus on building a consistent coding habit, contributing to GitHub, and improving your competitive programming rating.`
  }
  return `Based on your digital footprint analysis, your behavior type is **${scores.behavior_type || 'Balanced'}**. ${report?.insights?.ai?.persona || 'Keep building and improving across all platforms!'}`
}

export default function ChatAssistant() {
  const { chatOpen, toggleChat } = useUIStore()
  const { currentReport } = useReportStore()
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your AI career assistant. Ask me anything about your digital footprint! 🚀" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const response = generateResponse(q, currentReport)
    setMessages((m) => [...m, { role: 'assistant', text: response }])
    setLoading(false)
  }

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-brand shadow-glow flex items-center justify-center text-white text-xl"
      >
        {chatOpen ? '✕' : '🤖'}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-40 w-80 sm:w-96 flex flex-col glass rounded-2xl shadow-glow overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-card">
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-text-primary text-sm font-semibold">AI Assistant</p>
                <p className="text-text-muted text-xs">Powered by your footprint data</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-accent-green animate-pulse-slow" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-brand text-white rounded-br-sm'
                        : 'bg-bg-hover text-text-primary rounded-bl-sm border border-border'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-bg-hover border border-border rounded-xl px-3 py-2">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1 rounded-full bg-brand-glow text-brand border border-border-brand hover:bg-brand/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask anything..."
                className="input-field flex-1 py-2 text-xs"
              />
              <Button size="sm" onClick={() => send()} disabled={!input.trim() || loading}>→</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

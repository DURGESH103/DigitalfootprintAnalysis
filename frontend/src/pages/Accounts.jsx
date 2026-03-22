import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { accountsAPI } from '@/services/endpoints'
import { PLATFORMS } from '@/utils/constants'
import { Button, Card, Badge, Spinner, EmptyState, SectionHeader } from '@/components/ui/index'
import { extractError, getPlatformColor } from '@/utils/helpers'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'development', label: 'Development', icon: '⚡' },
  { id: 'coding', label: 'Coding Platforms', icon: '🧩' },
  { id: 'social', label: 'Social', icon: '🌐' },
]

export default function Accounts() {
  const [connected, setConnected] = useState({})
  const [inputs, setInputs] = useState({})
  const [loading, setLoading] = useState({})
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const { data } = await accountsAPI.list()
      const map = {}
      data.data.accounts.forEach((a) => { map[a.platform] = a })
      setConnected(map)
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setFetching(false)
    }
  }

  const connect = async (platform) => {
    const username = inputs[platform]?.trim()
    if (!username) return toast.error('Enter a username')
    setLoading({ ...loading, [platform]: 'connecting' })
    try {
      await accountsAPI.connect({ platform, username })
      setConnected({ ...connected, [platform]: { platform, username } })
      setInputs({ ...inputs, [platform]: '' })
      toast.success(`${platform} connected!`)
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setLoading({ ...loading, [platform]: null })
    }
  }

  const disconnect = async (platform) => {
    setLoading({ ...loading, [platform]: 'disconnecting' })
    try {
      await accountsAPI.disconnect(platform)
      const updated = { ...connected }
      delete updated[platform]
      setConnected(updated)
      toast.success(`${platform} disconnected`)
    } catch (e) {
      toast.error(extractError(e))
    } finally {
      setLoading({ ...loading, [platform]: null })
    }
  }

  const connectedCount = Object.keys(connected).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Connected Accounts</h1>
          <p className="text-text-secondary text-sm mt-1">Connect your profiles to start analysis</p>
        </div>
        <Badge color={connectedCount > 0 ? 'green' : 'muted'}>
          {connectedCount} connected
        </Badge>
      </div>

      {fetching ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <SectionHeader
              title={<span className="flex items-center gap-2">{cat.icon} {cat.label}</span>}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLATFORMS.filter((p) => p.category === cat.id).map((platform, i) => {
                const isConnected = !!connected[platform.id]
                const isLoading = loading[platform.id]
                const color = getPlatformColor(platform.id)

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`card transition-all duration-300 ${isConnected ? 'border-opacity-30' : ''}`}
                    style={isConnected ? { borderColor: `${color}30` } : {}}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold"
                          style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
                        >
                          {platform.label[0]}
                        </div>
                        <div>
                          <p className="text-text-primary text-sm font-semibold">{platform.label}</p>
                          <p className="text-text-muted text-xs">{platform.description}</p>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1 ${isConnected ? 'bg-accent-green' : 'bg-text-muted'}`} />
                    </div>

                    {isConnected ? (
                      <div className="flex items-center justify-between bg-bg-hover rounded-lg px-3 py-2">
                        <div>
                          <p className="text-xs text-text-muted">Connected as</p>
                          <p className="text-sm font-medium text-text-primary font-mono">{connected[platform.id].username}</p>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={isLoading === 'disconnecting'}
                          onClick={() => disconnect(platform.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          className="input-field flex-1 py-2 text-xs"
                          placeholder={platform.placeholder}
                          value={inputs[platform.id] || ''}
                          onChange={(e) => setInputs({ ...inputs, [platform.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && connect(platform.id)}
                        />
                        <Button
                          size="sm"
                          loading={isLoading === 'connecting'}
                          onClick={() => connect(platform.id)}
                        >
                          Connect
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

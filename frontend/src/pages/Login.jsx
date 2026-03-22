import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/services/endpoints'
import { Button, Input } from '@/components/ui/index'
import { extractError } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (form.password.length < 6) e.password = 'Password too short'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success(`Welcome back, ${data.data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
        <p className="text-text-secondary text-sm mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-text-secondary text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-brand hover:text-brand-light transition-colors font-medium">
          Sign up
        </Link>
      </p>

      {/* Demo hint */}
      <div className="p-3 rounded-lg bg-brand-glow border border-border-brand">
        <p className="text-xs text-text-secondary text-center">
          Demo: use any email + password (8+ chars) to sign up first
        </p>
      </div>
    </div>
  )
}

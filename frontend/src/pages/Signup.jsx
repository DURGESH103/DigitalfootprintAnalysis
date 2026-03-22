import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/services/endpoints'
import { Button, Input } from '@/components/ui/index'
import { extractError } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authAPI.signup(form)
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success('Account created! Welcome 🎉')
      navigate('/accounts')
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Create account</h2>
        <p className="text-text-secondary text-sm mt-1">Start analyzing your digital footprint</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} error={errors.email} />
        <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} error={errors.password} />
        <Button type="submit" loading={loading} className="w-full">Create Account</Button>
      </form>

      <p className="text-center text-text-secondary text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-brand hover:text-brand-light transition-colors font-medium">Sign in</Link>
      </p>
    </div>
  )
}

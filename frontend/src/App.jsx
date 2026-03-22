import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import PageLoader from '@/components/ui/PageLoader'

const Login = lazy(() => import('@/pages/Login'))
const Signup = lazy(() => import('@/pages/Signup'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Accounts = lazy(() => import('@/pages/Accounts'))
const Analysis = lazy(() => import('@/pages/Analysis'))
const Report = lazy(() => import('@/pages/Report'))
const Profile = lazy(() => import('@/pages/Profile'))
const Compare = lazy(() => import('@/pages/Compare'))
const ResumeAnalyzer = lazy(() => import('@/pages/ResumeAnalyzer'))

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

const GuestRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/report/:reportId?" element={<Report />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/resume" element={<ResumeAnalyzer />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

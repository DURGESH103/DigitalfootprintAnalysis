import { Spinner } from './index'

export default function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold">D</div>
        <Spinner size="md" />
      </div>
    </div>
  )
}

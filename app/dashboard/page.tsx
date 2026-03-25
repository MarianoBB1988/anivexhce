import { DashboardContent } from './dashboard-content'
import { ProtectedRoute } from '@/components/protected-route'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <DashboardContent />
      </div>
    </ProtectedRoute>
  )
}

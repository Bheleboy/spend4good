import { Outlet, useNavigate, useLocation } from '@tanstack/react-router'
import { AppSidebar } from '@/components/AppSidebar'
import { AppNavbar } from '@/components/AppNavbar'
import { useAuth } from '@/hooks/use-auth'
import { useEffect } from 'react'

export function DashboardLayout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, location.pathname, navigate])

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppNavbar />
        <main className="flex-1 overflow-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, FolderKanban, FileText, Users, Settings, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const navItems: Array<{ to: string; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }> = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  return (
    <aside className={cn(
      'flex flex-col border-r border-border bg-sidebar transition-all duration-200',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <DollarSign className="h-7 w-7 shrink-0 text-primary" />
        {!collapsed && <span className="text-lg font-bold text-foreground">Spend4Good</span>}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null
          const active = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-center border-t border-border p-3 text-muted-foreground hover:text-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}

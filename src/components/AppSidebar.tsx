import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, FolderKanban, FileText, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
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
      'flex flex-col border-r border-border bg-card transition-all duration-200',
      collapsed ? 'w-[68px]' : 'w-60'
    )}>
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
          <span className="text-sm font-black text-background">S4</span>
        </div>
        {!collapsed && <span className="text-base font-bold tracking-tight text-foreground">Spend4Good</span>}
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null
          const active = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}

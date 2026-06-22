import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Settings, ChevronDown, Bell } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { roleColors } from '@/lib/permissions'
import { Button } from '@/components/ui/button'

export function AppNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h2 className="text-sm font-medium text-foreground">
          {user?.organization?.name || 'Organization'}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-foreground">{user?.full_name}</p>
              <p className="text-[10px] capitalize text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
              <div className="px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{user?.email || user?.phone_number}</p>
                <Badge className={`mt-2 text-[10px] ${roleColors[user?.role || 'agent']}`}>
                  {user?.role?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => { setOpen(false); navigate({ to: '/settings' }) }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Settings className="h-4 w-4 text-muted-foreground" /> Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
